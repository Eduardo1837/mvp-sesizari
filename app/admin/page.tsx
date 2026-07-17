"use client";

import { useState, useEffect } from 'react';

type Priority = 'Ridicată' | 'Medie' | 'Scăzută';
type SortKey = 'priority' | 'category' | 'abuseScore';
type SortDir = 'asc' | 'desc';

interface Ticket {
  id: string;
  priority: Priority;
  category: string;
  issue: string;
  aiAction: string;
  abuseScore: number;
  date: string;
  status: 'Deschis' | 'În analiză' | 'Rezolvat';
}

const priorityOrder: Record<Priority, number> = { Ridicată: 0, Medie: 1, Scăzută: 2 };

const badgeStyles: Record<Priority, { bg: string; text: string; dot: string }> = {
  Ridicată: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Medie: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  Scăzută: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const statusStyles: Record<Ticket['status'], string> = {
  Deschis: 'text-slate-500 bg-slate-100',
  'În analiză': 'text-blue-600 bg-blue-50',
  Rezolvat: 'text-emerald-700 bg-emerald-50',
};

function PriorityBadge({ priority }: { priority: Priority }) {
  const s = badgeStyles[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {priority}
    </span>
  );
}

function AbuseScore({ score }: { score: number }) {
  const level = score >= 60 ? 'high' : score >= 30 ? 'mid' : 'low';
  const colors = {
    high: { track: 'bg-red-100', fill: 'bg-red-500', text: 'text-red-600' },
    mid: { track: 'bg-amber-100', fill: 'bg-amber-400', text: 'text-amber-600' },
    low: { track: 'bg-slate-100', fill: 'bg-slate-400', text: 'text-slate-500' },
  };
  const c = colors[level];
  return (
    <div className="flex items-center gap-2.5 min-w-[80px]">
      <div className={`flex-1 h-1.5 rounded-full ${c.track}`}>
        <div className={`h-full rounded-full ${c.fill} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${c.text}`}>{score}%</span>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      {dir === 'asc' || !active ? <path d="M5 2L9 8H1L5 2Z" fill="currentColor" opacity={active && dir === 'asc' ? 1 : 0.4} /> : null}
      {dir === 'desc' || !active ? <path d="M5 8L1 2H9L5 8Z" fill="currentColor" opacity={active && dir === 'desc' ? 1 : 0.4} /> : null}
      {!active && (
        <>
          <path d="M5 2L9 5.5H1L5 2Z" fill="currentColor" opacity={0.35} />
          <path d="M5 8L1 4.5H9L5 8Z" fill="currentColor" opacity={0.35} />
        </>
      )}
    </svg>
  );
}

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterPriority, setFilterPriority] = useState<Priority | 'Toate'>('Toate');
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("/api/sesizari");
        if (!res.ok) throw new Error("Eroare la preluarea datelor din baza de date.");
        const data = await res.json();
        
        // Transformare DB Schema -> Frontend Schema
        const mappedData: Ticket[] = data.map((item: any) => ({
          id: `SZ-${item.id.toString().padStart(4, '0')}`,
          priority: item.prioritate >= 4 ? 'Ridicată' : item.prioritate === 3 ? 'Medie' : 'Scăzută',
          category: item.categorie,
          issue: item.text_sursa,
          aiAction: item.actiune_admin,
          abuseScore: Math.round(item.scor_abuz * 100),
          date: new Date(item.ora_incident).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: 'Deschis'
        }));
        
        setTickets(mappedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...tickets]
    .filter(t => filterPriority === 'Toate' || t.priority === filterPriority)
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority') cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      else if (sortKey === 'category') cmp = a.category.localeCompare(b.category, 'ro');
      else if (sortKey === 'abuseScore') cmp = a.abuseScore - b.abuseScore;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const counts = {
    Ridicată: tickets.filter(t => t.priority === 'Ridicată').length,
    Medie: tickets.filter(t => t.priority === 'Medie').length,
    Scăzută: tickets.filter(t => t.priority === 'Scăzută').length,
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Se încarcă datele de la server...</div>;
  if (error) return <div className="p-8 text-center text-red-600 font-bold">Eroare: {error}</div>;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".7" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".4" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800 tracking-tight">CivicAdmin</span>
            <span className="text-slate-300 text-sm">›</span>
            <span className="text-sm text-slate-500">Sesizări</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString('ro-RO')}</span>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AD</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Administrator</h1>
            <p className="text-sm text-slate-500 mt-0.5">Gestionați și monitorizați sesizările extrase de inteligența artificială.</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total sesizări', value: tickets.length, color: 'text-slate-900' },
            { label: 'Prioritate ridicată', value: counts['Ridicată'], color: 'text-red-600' },
            { label: 'Prioritate medie', value: counts['Medie'], color: 'text-amber-600' },
            { label: 'Prioritate scăzută', value: counts['Scăzută'], color: 'text-emerald-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 px-5 py-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-3xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(['Toate', 'Ridicată', 'Medie', 'Scăzută'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    filterPriority === p ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p} {p !== 'Toate' && <span className={`ml-1.5 tabular-nums ${filterPriority === p ? 'opacity-70' : 'opacity-50'}`}>{counts[p]}</span>}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono">{sorted.length} înregistrări</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[50px]">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 transition-colors w-[120px]" onClick={() => handleSort('priority')}>
                    Prioritate <SortIcon active={sortKey === 'priority'} dir={sortDir} />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 transition-colors w-[170px]" onClick={() => handleSort('category')}>
                    Categorie <SortIcon active={sortKey === 'category'} dir={sortDir} />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Problemă Semnalată</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[260px]">Acțiune Recomandată (AI)</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 transition-colors w-[130px]" onClick={() => handleSort('abuseScore')}>
                    Scor Abuz <SortIcon active={sortKey === 'abuseScore'} dir={sortDir} />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[100px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((ticket, i) => {
                  const isSelected = selectedRow === ticket.id;
                  return (
                    <tr key={ticket.id} onClick={() => setSelectedRow(isSelected ? null : ticket.id)} className={`border-b border-slate-100 last:border-0 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/60' : i % 2 === 0 ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/30 hover:bg-slate-50/70'}`}>
                      <td className="px-5 py-4"><span className="text-xs font-mono text-slate-400">{ticket.id}</span></td>
                      <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-4 py-4"><span className="text-sm text-slate-700 font-medium">{ticket.category}</span></td>
                      <td className="px-4 py-4"><p className="text-sm text-slate-600 leading-snug line-clamp-2 max-w-[380px]">{ticket.issue}</p><span className="text-[11px] text-slate-400 mt-0.5 block">{ticket.date}</span></td>
                      <td className="px-4 py-4"><p className="text-sm text-blue-700 leading-snug line-clamp-2 bg-blue-50/60 rounded-lg px-3 py-2 border border-blue-100/80">{ticket.aiAction}</p></td>
                      <td className="px-4 py-4"><AbuseScore score={ticket.abuseScore} /></td>
                      <td className="px-4 py-4"><span className={`text-xs font-medium px-2 py-1 rounded-md ${statusStyles[ticket.status]}`}>{ticket.status}</span></td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">Nu există înregistrări care să corespundă filtrelor.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}