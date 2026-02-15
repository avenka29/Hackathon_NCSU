import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import {
  Phone,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  MessageSquare,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/call';

type CallSummary = {
  call_sid: string;
  phone_number: string;
  scenario_id: string;
  status: string;
  started_at: string;
  ended_at?: string;
  current_turn?: number;
};

type SensitiveMatch = {
  type: string;
  value: string;
  confidence: number;
  position?: number;
};

type VulnerabilityEvent = {
  event_type: string;
  timestamp: string;
  data: { turn?: number; matches?: SensitiveMatch[] };
};

type AuditData = {
  call_sid: string;
  session: CallSummary;
  transcript: { turn: number; speaker: string; text: string; timestamp?: string }[];
  events: { event_type: string; timestamp: string; data: Record<string, unknown> }[];
  vulnerabilities: VulnerabilityEvent[];
};

export default function AuditPage() {
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [auditCache, setAuditCache] = useState<Record<string, AuditData>>({});
  const [loadingAudit, setLoadingAudit] = useState<string | null>(null);
  const [feedbackCache, setFeedbackCache] = useState<Record<string, string>>({});
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/audit/list`)
      .then((r) => r.json())
      .then((data: { calls: CallSummary[] }) => setCalls(data.calls || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [location.pathname])

  const loadAudit = (call_sid: string) => {
    if (auditCache[call_sid]) return;
    setLoadingAudit(call_sid);
    fetch(`${API_BASE}/audit/${call_sid}`)
      .then((r) => r.json())
      .then((data: AuditData) =>
        setAuditCache((prev) => ({ ...prev, [call_sid]: data }))
      )
      .catch(console.error)
      .finally(() => setLoadingAudit(null));
  };

  const loadFeedback = (call_sid: string) => {
    if (feedbackCache[call_sid]) return;
    setFeedbackLoading(call_sid);
    fetch(`${API_BASE}/${call_sid}/feedback`)
      .then((r) => r.json())
      .then((data: { feedback: string }) =>
        setFeedbackCache((prev) => ({ ...prev, [call_sid]: data.feedback }))
      )
      .catch(console.error)
      .finally(() => setFeedbackLoading(null));
  };

  const toggleExpand = (call_sid: string) => {
    if (expandedId === call_sid) {
      setExpandedId(null);
      return;
    }
    setExpandedId(call_sid);
    loadAudit(call_sid);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-800',
      in_progress: 'bg-blue-100 text-blue-800',
      initiated: 'bg-slate-100 text-slate-700',
      ringing: 'bg-amber-100 text-amber-800',
      failed: 'bg-red-100 text-red-800',
      no_answer: 'bg-slate-100 text-slate-600',
      busy: 'bg-amber-100 text-amber-700',
    };
    const cls = map[status] || 'bg-slate-100 text-slate-600';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getDuration = (audit: AuditData | undefined) => {
    if (!audit) return null;
    const ended = audit.events.find((e) => e.event_type === 'call_ended');
    const sec = ended?.data?.duration;
    if (sec == null) return null;
    const n = Number(sec);
    if (isNaN(n)) return null;
    if (n < 60) return `${n}s`;
    return `${Math.floor(n / 60)}m ${n % 60}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-slate-500">Loading calls...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Failed to load audit list</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review each simulation call: outcome, vulnerabilities, and coach feedback
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No calls to audit yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Run a phishing simulation from the People page. Completed and in-progress calls will appear here for audit.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {calls.map((call) => {
            const isExpanded = expandedId === call.call_sid;
            const audit = auditCache[call.call_sid];
            const loadingThisAudit = loadingAudit === call.call_sid;
            const feedback = feedbackCache[call.call_sid];
            const loadingFeedback = feedbackLoading === call.call_sid;
            const duration = getDuration(audit);
            const vulnCount = audit?.vulnerabilities?.length ?? 0;

            return (
              <div
                key={call.call_sid}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(call.call_sid)}
                  className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-900">{call.phone_number}</span>
                      {statusBadge(call.status)}
                      <span className="text-xs text-slate-400">{call.scenario_id}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Started {formatDate(call.started_at)}
                      {duration && ` · ${duration}`}
                      {vulnCount > 0 && (
                        <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          {vulnCount} sensitive data event{vulnCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-5 space-y-6">
                    {loadingThisAudit && (
                      <p className="text-sm text-slate-500">Loading audit details...</p>
                    )}
                    {!loadingThisAudit && audit && (
                      <>
                        <section>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <Clock className="h-4 w-4" />
                            How it went
                          </h4>
                          <div className="rounded-lg bg-white border border-slate-200 p-4 text-sm text-slate-700">
                            <p>
                              <strong>Status:</strong> {audit.session.status.replace(/_/g, ' ')}
                              {duration && (
                                <> · <strong>Duration:</strong> {duration}</>
                              )}
                            </p>
                            <p className="mt-1">
                              <strong>Transcript entries:</strong> {audit.transcript?.length ?? 0} turns
                              {audit.transcript?.length
                                ? ' — conversation recorded between scammer and user.'
                                : ' — no transcript (call may have ended before speech).'}
                            </p>
                          </div>
                        </section>

                        {audit.vulnerabilities && audit.vulnerabilities.length > 0 && (
                          <section>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                              <ShieldAlert className="h-4 w-4" />
                              Vulnerabilities (sensitive data detected)
                            </h4>
                            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                              {audit.vulnerabilities.map((v, i) => (
                                <div key={i} className="text-sm">
                                  {v.data?.matches?.map((m: SensitiveMatch, j: number) => (
                                    <div
                                      key={j}
                                      className="flex items-center gap-2 flex-wrap"
                                    >
                                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                      <span className="font-medium text-amber-900">
                                        {m.type}
                                      </span>
                                      <span className="text-amber-800">
                                        (confidence: {Math.round((m.confidence ?? 0) * 100)}%)
                                      </span>
                                      {m.value && (
                                        <span className="text-amber-700/80 truncate max-w-[200px]">
                                          — &quot;{m.value}&quot;
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {audit.transcript && audit.transcript.length > 0 && (
                          <section>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                              <MessageSquare className="h-4 w-4" />
                              Transcript
                            </h4>
                            <div className="rounded-lg bg-white border border-slate-200 p-4 space-y-2 max-h-64 overflow-y-auto">
                              {audit.transcript
                                .sort((a, b) => a.turn - b.turn)
                                .map((entry, i) => (
                                  <div
                                    key={i}
                                    className={`text-sm ${
                                      entry.speaker === 'scammer'
                                        ? 'text-slate-600'
                                        : 'text-slate-900'
                                    }`}
                                  >
                                    <span className="font-medium capitalize">
                                      {entry.speaker}:
                                    </span>{' '}
                                    {entry.text}
                                  </div>
                                ))}
                            </div>
                          </section>
                        )}

                        <section>
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                            <FileText className="h-4 w-4" />
                            Coach feedback
                          </h4>
                          {feedback ? (
                            <div className="rounded-lg bg-white border border-slate-200 p-4 text-sm text-slate-700">
                              {feedback}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => loadFeedback(call.call_sid)}
                              disabled={loadingFeedback || (audit.transcript?.length ?? 0) === 0}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingFeedback ? 'Generating…' : 'Generate coach feedback'}
                            </button>
                          )}
                        </section>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
