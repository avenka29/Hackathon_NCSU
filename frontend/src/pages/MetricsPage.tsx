import { Users, Phone, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';

const stats = [
  {
    label: 'Total People',
    value: '5',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    label: 'Calls Completed',
    value: '0',
    icon: Phone,
    color: 'text-slate-900',
    bg: 'bg-slate-50',
    border: 'border-slate-100',
  },
  {
    label: 'Avg. Risk Score',
    value: '—',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    label: 'Data Leaked',
    value: '0',
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
  },
];

export default function MetricsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Metrics</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of simulation results and team performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border ${stat.border} p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No simulation data yet</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Run your first phishing simulation to see detailed metrics, risk scores, and team performance breakdowns here.
          </p>
        </div>
      </div>
    </div>
  );
}