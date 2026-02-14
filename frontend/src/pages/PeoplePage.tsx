import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Users, CheckSquare, X, Search } from 'lucide-react';

const MOCK_PEOPLE = [
  { id: '1', name: 'Alice Chen', role: 'Engineering' },
  { id: '2', name: 'Bob Smith', role: 'Marketing' },
  { id: '3', name: 'Carol Davis', role: 'HR' },
  { id: '4', name: 'David Lee', role: 'Engineering' },
  { id: '5', name: 'Eve Wilson', role: 'Finance' },
];

const roleBadgeColors: Record<string, string> = {
  Engineering: 'bg-blue-50 text-blue-700 border-blue-200',
  Marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  HR: 'bg-amber-50 text-amber-700 border-amber-200',
  Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function PeoplePage() {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(MOCK_PEOPLE.map((p) => p.id)));
  const clearSelection = () => setSelectedIds(new Set());

  const handleCall = () => {
    if (selectedIds.size !== 1) {
      alert('Select exactly one person to call.');
      return;
    }
    const id = Array.from(selectedIds)[0];
    const person = MOCK_PEOPLE.find((p) => p.id === id);
    if (person) navigate(`/people/${person.id}`, { state: { person } });
  };

  const handleBatch = () => {
    if (selectedIds.size === 0) {
      alert('Select at least one person for batch.');
      return;
    }
    const selectedPeople = MOCK_PEOPLE.filter((p) => selectedIds.has(p.id));
    navigate('/people/batch', { state: { selectedPeople } });
  };

  const filtered = MOCK_PEOPLE.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">People</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employees and run simulations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCall}
            disabled={selectedIds.size !== 1}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0f172a] text-white text-sm font-medium rounded-lg hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Phone className="h-4 w-4" />
            Call selected
          </button>
          <button
            onClick={handleBatch}
            disabled={selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Users className="h-4 w-4" />
            Batch
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Select all
            </button>
            <button
              onClick={clearSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
            {selectedIds.size > 0 && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                {selectedIds.size} selected
              </span>
            )}
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-5 py-3 w-12" />
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((person) => (
              <tr
                key={person.id}
                className={`group cursor-pointer transition-colors ${
                  selectedIds.has(person.id)
                    ? 'bg-blue-50/60'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => toggleOne(person.id)}
              >
                <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(person.id)}
                    onChange={() => toggleOne(person.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-xs font-semibold text-slate-600">
                        {person.name.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <span className="font-medium text-slate-900 text-sm">{person.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      roleBadgeColors[person.role] || 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {person.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    No calls yet
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}