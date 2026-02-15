import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Lightbulb,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';

type Person = { id: string; name: string; role: string; phone?: string };

interface PersonMetrics {
  total_calls: number;
  avg_risk_score: number | null;
  latest_score: number;
  latest_summary: string;
  recommendations: string[];
  good_behaviors: string[];
  red_flags_missed: string[];
  leaked_items: string[];
  history: { score: number; scenario: string; date: string }[];
}

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

export default function PersonCallPage() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const person = location.state?.person as Person | undefined;

  const MOCK_PEOPLE = [
    { id: '1', name: 'Alice Chen', role: 'Engineering', phone: '+19194283795' },
    { id: '2', name: 'Bob Smith', role: 'Marketing', phone: '+19196569478' },
    { id: '3', name: 'Carol Davis', role: 'HR', phone: '+14253736930' },
  ];

  const personWithPhone = person
    ? { ...person, phone: person.phone ?? MOCK_PEOPLE.find((p) => p.id === person.id)?.phone }
    : undefined;

  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'calls'>('overview');
  const [metrics, setMetrics] = useState<PersonMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [initiateError, setInitiateError] = useState<string | null>(null);
  const [initiateSuccess, setInitiateSuccess] = useState(false);
  const [lastCallSid, setLastCallSid] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [callsForPerson, setCallsForPerson] = useState<CallSummary[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [auditCache, setAuditCache] = useState<Record<string, AuditData>>({});
  const [loadingAudit, setLoadingAudit] = useState<string | null>(null);
  const [feedbackCache, setFeedbackCache] = useState<Record<string, string>>({});
  const [feedbackLoadingCall, setFeedbackLoadingCall] = useState<string | null>(null);

  useEffect(() => {
    if (!personWithPhone?.phone) {
      setCallsForPerson([]);
      return;
    }
    setCallsLoading(true);
    fetch(`${API_BASE}/audit/list?phone_number=${encodeURIComponent(personWithPhone.phone)}`)
      .then((r) => r.json())
      .then((data: { calls: CallSummary[] }) => setCallsForPerson(data.calls || []))
      .catch(console.error)
      .finally(() => setCallsLoading(false));
  }, [personWithPhone?.phone]);

  const loadAudit = (call_sid: string) => {
    if (auditCache[call_sid]) return;
    setLoadingAudit(call_sid);
    fetch(`${API_BASE}/audit/${call_sid}`)
      .then((r) => r.json())
      .then((data: AuditData) => setAuditCache((prev) => ({ ...prev, [call_sid]: data })))
      .catch(console.error)
      .finally(() => setLoadingAudit(null));
  };

  const loadFeedback = (call_sid: string) => {
    if (feedbackCache[call_sid]) return;
    setFeedbackLoadingCall(call_sid);
    fetch(`${API_BASE}/${call_sid}/feedback`)
      .then((r) => r.json())
      .then((data: { feedback: string }) => setFeedbackCache((prev) => ({ ...prev, [call_sid]: data.feedback })))
      .catch(console.error)
      .finally(() => setFeedbackLoadingCall(null));
  };

  const toggleExpandCall = (call_sid: string) => {
    if (expandedCallId === call_sid) {
      setExpandedCallId(null);
      return;
    }
    setExpandedCallId(call_sid);
    loadAudit(call_sid);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
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

  if (!person) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">No person selected.</p>
        <button onClick={() => navigate('/people')} className="mt-4 text-blue-600 hover:underline">
          ← Back to People
        </button>
      </div>
    );
  }

  const scoreColor = (score: number) =>
    score <= 3 ? 'text-emerald-600' : score <= 6 ? 'text-amber-600' : 'text-red-600';

  const scoreBg = (score: number) =>
    score <= 3 ? 'bg-emerald-50 border-emerald-200' : score <= 6 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

  return (
    <div>
      <button
        onClick={() => navigate('/people')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to People
      </button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-600">
              {person.name.split(' ').map((n) => n[0]).join('')}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{person.name}</h1>
            <p className="text-sm text-slate-500">{person.role}</p>
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-200 mb-8">
        <div className="flex gap-8">
          {(['overview', 'metrics', 'calls'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition capitalize ${
                activeTab === tab
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-slate-900 font-medium">{person.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Department</p>
              <p className="text-slate-900 font-medium">{person.role}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">ID</p>
              <p className="text-slate-900 font-mono text-sm">{person.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-900">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100">
            {initiateError && (
              <p className="mb-3 text-sm text-red-600">{initiateError}</p>
            )}
            {initiateSuccess && (
              <p className="mb-3 text-sm text-emerald-600">Call initiated. The recipient should receive the call shortly.</p>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!personWithPhone?.phone || initiating}
              onClick={async () => {
                if (!personWithPhone?.phone) return;
                setInitiateError(null);
                setInitiateSuccess(false);
                setInitiating(true);
                try {
                  const res = await fetch('http://localhost:8000/api/call/initiate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      phone_number: personWithPhone.phone,
                      scenario_id: 'bank_fraud',
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setInitiateError(data.detail ?? data.message ?? `Request failed (${res.status})`);
                    return;
                  }
                  setInitiateSuccess(true);
                  if (data.call_sid) setLastCallSid(data.call_sid);
                } catch (e) {
                  setInitiateError(e instanceof Error ? e.message : 'Failed to start call. Is the backend running?');
                } finally {
                  setInitiating(false);
                }
              }}
            >
              <Phone className="h-4 w-4" />
              {initiating ? 'Initiating…' : 'Start Simulation Call'}
            </button>
            {lastCallSid && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Coach feedback</h3>
                {feedbackError && <p className="mb-2 text-sm text-red-600">{feedbackError}</p>}
                {feedback && (
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200">{feedback}</p>
                )}
                {!feedback && !feedbackLoading && (
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                    onClick={async () => {
                      if (!lastCallSid) return;
                      setFeedbackError(null);
                      setFeedbackLoading(true);
                      try {
                        const r = await fetch(`http://localhost:8000/api/call/${lastCallSid}/feedback`);
                        const data = await r.json().catch(() => ({}));
                        if (!r.ok) {
                          setFeedbackError(data.detail ?? data.message ?? `Request failed (${r.status})`);
                          return;
                        }
                        setFeedback(data.feedback ?? '');
                      } catch (e) {
                        setFeedbackError(e instanceof Error ? e.message : 'Failed to load feedback.');
                      } finally {
                        setFeedbackLoading(false);
                      }
                    }}
                  >
                    Get feedback from last call
                  </button>
                )}
                {feedbackLoading && <p className="text-sm text-slate-500">Loading feedback…</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {loading && <p className="text-slate-500 text-sm">Loading metrics...</p>}

          {!loading && (!metrics || metrics.total_calls === 0) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Phone className="h-7 w-7 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No simulation data yet</h3>
              <p className="text-sm text-slate-500">Run a simulation call to see this person's risk assessment and recommendations.</p>
            </div>
          )}

          {!loading && metrics && metrics.total_calls > 0 && (
            <>
              <div className={`rounded-xl border shadow-sm p-6 ${scoreBg(metrics.latest_score)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-slate-900">Latest Risk Score</h2>
                  <span className={`text-4xl font-bold ${scoreColor(metrics.latest_score)}`}>
                    {metrics.latest_score}/10
                  </span>
                </div>
                <p className="text-sm text-slate-700">{metrics.latest_summary}</p>
                <div className="mt-4 flex gap-4 text-sm text-slate-600">
                  <span>Total calls: <strong>{metrics.total_calls}</strong></span>
                  <span>Avg score: <strong>{metrics.avg_risk_score}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-semibold text-slate-900">Good Behaviors</h3>
                  </div>
                  <ul className="space-y-2">
                    {metrics.good_behaviors.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-slate-900">Red Flags Missed</h3>
                  </div>
                  <ul className="space-y-2">
                    {metrics.red_flags_missed.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">Recommendations</h3>
                </div>
                <div className="space-y-3">
                  {metrics.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-700 bg-blue-50/50 rounded-lg p-3">
                      <span className="font-semibold text-blue-600 shrink-0">{i + 1}.</span>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>

              {metrics.leaked_items.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-slate-900">Information Leaked</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {metrics.leaked_items.map((item, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-4">Simulation History</h3>
                <div className="space-y-3">
                  {metrics.history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{h.scenario}</p>
                        <p className="text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-sm font-bold ${scoreColor(h.score)}`}>{h.score}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'calls' && (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-slate-500 mb-4">
            Simulation calls for this person. Expand a call to see transcript and Gemini analysis.
          </p>
          {callsLoading && <p className="text-slate-500 text-sm">Loading calls...</p>}
          {!callsLoading && callsForPerson.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500">
              No simulation calls found for this phone number.
            </div>
          )}
          {!callsLoading &&
            callsForPerson.map((call) => {
              const isExpanded = expandedCallId === call.call_sid;
              const audit = auditCache[call.call_sid];
              const loadingThisAudit = loadingAudit === call.call_sid;
              const feedback = feedbackCache[call.call_sid];
              const loadingFeedback = feedbackLoadingCall === call.call_sid;
              const duration = getDuration(audit);
              const vulnCount = audit?.vulnerabilities?.length ?? 0;
              return (
                <div
                  key={call.call_sid}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpandCall(call.call_sid)}
                    className="w-full flex items-center gap-3 p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-900">{call.scenario_id}</span>
                        {statusBadge(call.status)}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDate(call.started_at)}
                        {duration && ` · ${duration}`}
                        {vulnCount > 0 && (
                          <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {vulnCount} sensitive event{vulnCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-5 space-y-6">
                      {loadingThisAudit && (
                        <p className="text-sm text-slate-500">Loading audit...</p>
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
                                {duration && <> · <strong>Duration:</strong> {duration}</>}
                              </p>
                              <p className="mt-1">
                                <strong>Transcript:</strong> {audit.transcript?.length ?? 0} turns
                              </p>
                            </div>
                          </section>
                          {audit.vulnerabilities && audit.vulnerabilities.length > 0 && (
                            <section>
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                                <ShieldAlert className="h-4 w-4" />
                                Vulnerabilities
                              </h4>
                              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                                {audit.vulnerabilities.map((v, i) => (
                                  <div key={i} className="text-sm">
                                    {v.data?.matches?.map((m: SensitiveMatch, j: number) => (
                                      <div key={j} className="flex items-center gap-2 flex-wrap">
                                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                                        <span className="font-medium text-amber-900">{m.type}</span>
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
                              <div className="rounded-lg bg-white border border-slate-200 p-4 space-y-2 max-h-48 overflow-y-auto">
                                {audit.transcript
                                  .sort((a, b) => a.turn - b.turn)
                                  .map((entry, i) => (
                                    <div
                                      key={i}
                                      className={`text-sm ${
                                        entry.speaker === 'scammer' ? 'text-slate-600' : 'text-slate-900'
                                      }`}
                                    >
                                      <span className="font-medium capitalize">{entry.speaker}:</span> {entry.text}
                                    </div>
                                  ))}
                              </div>
                            </section>
                          )}
                          <section>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                              <FileText className="h-4 w-4" />
                              Gemini analysis
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
                                {loadingFeedback ? 'Generating…' : 'Generate Gemini analysis'}
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