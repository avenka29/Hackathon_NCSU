import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Lightbulb, TrendingDown, ArrowLeft, Phone } from 'lucide-react';

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

export default function PersonCallPage() {
  const { personId } = useParams<{ personId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const person = location.state?.person as Person | undefined;

  const MOCK_PEOPLE = [
    { id: '1', name: 'Alice Chen', role: 'Engineering', phone: '+19194283795' },
    { id: '2', name: 'Bob Smith', role: 'Marketing', phone: '+19195551002' },
    { id: '3', name: 'Carol Davis', role: 'HR', phone: '+19195551003' },
    { id: '4', name: 'David Lee', role: 'Engineering', phone: '+19195551004' },
    { id: '5', name: 'Eve Wilson', role: 'Finance', phone: '+19195551005' },
  ];

  const [activeTab, setActiveTab] = useState<'overview' | 'metrics'>('overview');
  const [metrics, setMetrics] = useState<PersonMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (person?.phone && activeTab === 'metrics') {
      setLoading(true);
      fetch(`http://localhost:8000/api/call/person/${encodeURIComponent(person.phone)}/metrics`)
        .then((r) => r.json())
        .then(setMetrics)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [person?.phone, activeTab]);

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
          {(['overview', 'metrics'] as const).map((tab) => (
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
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f172a] text-white rounded-lg hover:bg-[#1e293b] font-medium transition-colors shadow-sm"
              onClick={() => {
                fetch('http://localhost:8000/api/call/initiate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    phone_number: person.phone,
                    scenario_id: 'bank_fraud'
                  })
                });
              }}
            >
              <Phone className="h-4 w-4" />
              Start Simulation Call
            </button>
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
              {/* Risk Score */}
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
                {/* Good Behaviors */}
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

                {/* Red Flags Missed */}
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

              {/* Recommendations */}
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

              {/* Leaked Items */}
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

              {/* Call History */}
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
    </div>
  );
}
