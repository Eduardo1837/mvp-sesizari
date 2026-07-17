"use client"

import { useState, useEffect, useMemo } from 'react'
import AiInsightsPanel from './AiInsightsPanel'

type Priority = 'Ridicată' | 'Medie' | 'Scăzută'
type SortKey = 'priority' | 'abuseScore' | 'category'
type SortDir = 'asc' | 'desc'

interface Ticket {
  id: string
  priority: Priority
  category: string
  issue: string
  aiAction: string
  abuseScore: number
  date: string
  status: 'Deschis' | 'În analiză' | 'Rezolvat'
}

const priorityOrder: Record<Priority, number> = { Ridicată: 0, Medie: 1, Scăzută: 2 }

const badgeStyles: Record<Priority, { bg: string; text: string; dot: string }> = {
  Ridicată: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  Medie: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  Scăzută: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

const statusStyles: Record<Ticket['status'], string> = {
  Deschis: 'text-slate-500 bg-slate-100',
  'În analiză': 'text-blue-600 bg-blue-50',
  Rezolvat: 'text-emerald-700 bg-emerald-50',
}

const selectArrowBg = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")"

function PriorityBadge({ priority }: { priority: Priority }) {
  const s = badgeStyles[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {priority}
    </span>
  )
}

function AbuseScoreBar({ score }: { score: number }) {
  const level = score >= 60 ? 'high' : score >= 30 ? 'mid' : 'low'
  const colors = {
    high: { track: 'bg-red-100', fill: 'bg-red-500', text: 'text-red-600' },
    mid: { track: 'bg-amber-100', fill: 'bg-amber-400', text: 'text-amber-600' },
    low: { track: 'bg-slate-100', fill: 'bg-slate-400', text: 'text-slate-500' },
  }
  const c = colors[level]
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex-1 h-1.5 rounded-full ${c.track}`}>
        <div className={`h-full rounded-full ${c.fill} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold tabular-nums w-8 text-right ${c.text}`}>{score}%</span>
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className={`inline-block ml-1 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      {!active && (
        <>
          <path d="M5 2L9 5.5H1L5 2Z" fill="currentColor" opacity={0.35} />
          <path d="M5 8L1 4.5H9L5 8Z" fill="currentColor" opacity={0.35} />
        </>
      )}
      {active && dir === 'asc' && <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />}
      {active && dir === 'desc' && <path d="M5 8L1 2H9L5 8Z" fill="currentColor" />}
    </svg>
  )
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <PriorityBadge priority={ticket.priority} />
        <span className="text-[11px] text-slate-400 font-mono shrink-0 mt-0.5">{ticket.date}</span>
      </div>
      <div className="px-4 pb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{ticket.category}</p>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md shrink-0 ${statusStyles[ticket.status]}`}>
          {ticket.status}
        </span>
      </div>
      <div className="px-4 pb-3">
        <p className="text-sm text-slate-500 leading-snug line-clamp-2">{ticket.issue}</p>
      </div>
      <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-blue-500 shrink-0">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M3.5 6.5C4 7.5 7 7.5 7.5 6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="3.8" cy="4.2" r=".7" fill="currentColor" />
            <circle cx="7.2" cy="4.2" r=".7" fill="currentColor" />
          </svg>
          <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wider">Acțiune AI</span>
        </div>
        <p className="text-sm text-blue-800 leading-snug">{ticket.aiAction}</p>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Scor Abuz</span>
        </div>
        <AbuseScoreBar score={ticket.abuseScore} />
      </div>
    </div>
  )
}

function TableRow({ ticket, index, selected, onSelect }: { ticket: Ticket; index: number; selected: boolean; onSelect: () => void }) {
  return (
    <tr onClick={onSelect} className={`border-b border-slate-100 last:border-0 cursor-pointer transition-colors group ${selected ? 'bg-blue-50/60' : index % 2 === 0 ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/30 hover:bg-slate-50/70'}`}>
      <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
      <td className="px-4 py-4"><span className="text-sm text-slate-700 font-medium">{ticket.category}</span></td>
      <td className="px-4 py-4">
        <p className="text-sm text-slate-600 leading-snug line-clamp-2 max-w-[380px]">{ticket.issue}</p>
        <span className="text-[11px] text-slate-400 mt-0.5 block">{ticket.date}</span>
      </td>
      <td className="px-4 py-4"><p className="text-sm text-blue-700 leading-snug bg-blue-50/60 rounded-lg px-3 py-2 border border-blue-100/80">{ticket.aiAction}</p></td>
      <td className="px-4 py-4"><AbuseScoreBar score={ticket.abuseScore} /></td>
      <td className="px-4 py-4"><span className={`text-xs font-medium px-2 py-1 rounded-md ${statusStyles[ticket.status]}`}>{ticket.status}</span></td>
      <td className="px-4 py-4 text-right">
        <button onClick={e => e.stopPropagation()} className="text-xs font-medium text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity">
          Detalii →
        </button>
      </td>
    </tr>
  )
}

function FilterSheet({ open, onClose, filterPriority, setFilterPriority, filterStatus, setFilterStatus, filterCategory, setFilterCategory, categories }: any) {
  const hasActive = !!(filterPriority || filterStatus || filterCategory)
  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-slate-200" /></div>
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Filtre</h2>
          {hasActive && (
            <button onClick={() => { setFilterPriority(''); setFilterStatus(''); setFilterCategory('') }} className="text-xs font-medium text-red-500">
              Resetează
            </button>
          )}
        </div>
        <div className="px-5 pb-8 space-y-4">
          {[
            { label: 'Prioritate', value: filterPriority, onChange: setFilterPriority, options: [{ value: '', label: 'Toate prioritățile' }, { value: 'Ridicată', label: 'Ridicată' }, { value: 'Medie', label: 'Medie' }, { value: 'Scăzută', label: 'Scăzută' }] },
            { label: 'Status', value: filterStatus, onChange: setFilterStatus, options: [{ value: '', label: 'Toate statusurile' }, { value: 'Deschis', label: 'Deschis' }, { value: 'În analiză', label: 'În analiză' }, { value: 'Rezolvat', label: 'Rezolvat' }] },
            { label: 'Categorie', value: filterCategory, onChange: setFilterCategory, options: [{ value: '', label: 'Toate categoriile' }, ...categories.map((c: string) => ({ value: c, label: c }))] }
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{field.label}</label>
              <select value={field.value} onChange={e => field.onChange(e.target.value)} className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors" style={{ backgroundImage: selectArrowBg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                {field.options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors mt-2">
            Aplică filtre
          </button>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [filterStatus, setFilterStatus] = useState<Ticket['status'] | ''>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  useEffect(() => {
    async function loadTickets() {
      try {
        const res = await fetch('/api/sesizari')
        if (!res.ok) throw new Error('Eroare la comunicarea cu serverul API.')
        const data = await res.json()
        
        const mapped: Ticket[] = data.map((t: any) => ({
          id: `SZ-${t.id.toString().padStart(4, '0')}`,
          priority: t.prioritate >= 4 ? 'Ridicată' : t.prioritate === 3 ? 'Medie' : 'Scăzută',
          category: t.categorie,
          issue: t.text_sursa,
          aiAction: t.actiune_admin,
          abuseScore: Math.round(t.scor_abuz * 100),
          date: new Date(t.ora_incident).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: 'Deschis'
        }))
        setTickets(mapped)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    loadTickets()
  }, [])

  const categories = useMemo(() => {
    return [...new Set(tickets.map(t => t.category))].sort((a, b) => a.localeCompare(b, 'ro'))
  }, [tickets])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    return [...tickets]
      .filter(t => !filterPriority || t.priority === filterPriority)
      .filter(t => !filterStatus || t.status === filterStatus)
      .filter(t => !filterCategory || t.category === filterCategory)
      .sort((a, b) => {
        let cmp = 0
        if (sortKey === 'priority') cmp = priorityOrder[a.priority] - priorityOrder[b.priority]
        else if (sortKey === 'abuseScore') cmp = a.abuseScore - b.abuseScore
        else if (sortKey === 'category') cmp = a.category.localeCompare(b.category, 'ro')
        return sortDir === 'asc' ? cmp : -cmp
      })
  }, [tickets, filterPriority, filterStatus, filterCategory, sortKey, sortDir])

  const counts = useMemo(() => ({
    Ridicată: tickets.filter(t => t.priority === 'Ridicată').length,
    Medie: tickets.filter(t => t.priority === 'Medie').length,
    Scăzută: tickets.filter(t => t.priority === 'Scăzută').length,
  }), [tickets])

  const activeFilters = [filterPriority, filterStatus, filterCategory].filter(Boolean).length

  if (isLoading) return <div className="p-8 text-center text-sm font-mono text-slate-500">ÎNCĂRCARE DATE...</div>
  if (error) return <div className="p-8 text-center text-sm font-mono text-red-600">EROARE BAZĂ DATE: {error}</div>

  const kpiCards = [
    { label: 'Total sesizări', value: tickets.length, sub: 'actualizat acum', color: 'text-slate-900' },
    { label: 'Prioritate ridicată', value: counts['Ridicată'], sub: 'acțiune urgentă', color: 'text-red-600' },
    { label: 'Prioritate medie', value: counts['Medie'], sub: 'în evaluare', color: 'text-amber-600' },
    { label: 'Prioritate scăzută', value: counts['Scăzută'], sub: 'monitorizare', color: 'text-emerald-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 tracking-tight">CivicAdmin</span>
            <span className="text-slate-300 text-sm hidden sm:inline">›</span>
            <span className="text-sm text-slate-500 hidden sm:inline">Sesizări</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">{new Date().toLocaleDateString('ro-RO')}</span>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">AD</div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-5 sm:mb-7 flex items-end justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dashboard Administrator</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Gestionați sesizările cetățenilor în timp real.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {kpiCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
              <p className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider mb-1 leading-tight">{card.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="sm:hidden inline-flex items-center gap-2 w-full justify-center border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors relative"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-slate-500">
                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filtre
              {activeFilters > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-3">
              {[
                { value: filterPriority, onChange: setFilterPriority, options: [{ value: '', label: 'Prioritate — Toate' }, { value: 'Ridicată', label: 'Ridicată' }, { value: 'Medie', label: 'Medie' }, { value: 'Scăzută', label: 'Scăzută' }] },
                { value: filterStatus, onChange: setFilterStatus, options: [{ value: '', label: 'Status — Toate' }, { value: 'Deschis', label: 'Deschis' }, { value: 'În analiză', label: 'În analiză' }, { value: 'Rezolvat', label: 'Rezolvat' }] },
                { value: filterCategory, onChange: setFilterCategory, options: [{ value: '', label: 'Categorie — Toate' }, ...categories.map(c => ({ value: c, label: c }))] },
              ].map((sel, i) => (
                <select
                  key={i}
                  value={sel.value}
                  onChange={e => sel.onChange(e.target.value as any)}
                  className="text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 pr-7 appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
                  style={{ backgroundImage: selectArrowBg, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                >
                  {sel.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono shrink-0 hidden sm:inline">{sorted.length} înregistrări</span>
          </div>

          <div className="sm:hidden divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">Nicio sesizare găsită.</p>
            ) : (
              <div className="p-3 space-y-3">
                {sorted.map(ticket => <TicketCard key={ticket.id} ticket={ticket} />)}
              </div>
            )}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-600 transition-colors w-[120px]" onClick={() => handleSort('priority')}>
                    Prioritate<SortIcon active={sortKey === 'priority'} dir={sortDir} />
                  </th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-600 transition-colors w-[170px]" onClick={() => handleSort('category')}>
                    Categorie<SortIcon active={sortKey === 'category'} dir={sortDir} />
                  </th>
                  <th className="px-4 py-3">Problemă Semnalată</th>
                  <th className="px-4 py-3 w-[260px]">Acțiune Recomandată (AI)</th>
                  <th className="px-4 py-3 cursor-pointer select-none hover:text-slate-600 transition-colors w-[130px]" onClick={() => handleSort('abuseScore')}>
                    Scor Abuz<SortIcon active={sortKey === 'abuseScore'} dir={sortDir} />
                  </th>
                  <th className="px-4 py-3 w-[100px]">Status</th>
                  <th className="px-4 py-3 w-[80px]" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((ticket, i) => (
                  <TableRow
                    key={ticket.id}
                    ticket={ticket}
                    index={i}
                    selected={selectedRow === ticket.id}
                    onSelect={() => setSelectedRow(selectedRow === ticket.id ? null : ticket.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6 sm:mt-8">
          <AiInsightsPanel />
        </div>
      </main>

      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filterPriority={filterPriority}
        setFilterPriority={setFilterPriority}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={categories}
      />
    </div>
  )
}