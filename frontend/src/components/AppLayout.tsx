import { Outlet, NavLink } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-[#0f172a] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center h-16 justify-between">
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-400 transition-colors">
                  <Shield className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">CSA</span>
              </NavLink>
              <div className="flex gap-1">
                <NavLink
                  to="/people"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  People
                </NavLink>
                <NavLink
                  to="/metrics"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  Metrics
                </NavLink>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-300">A</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}