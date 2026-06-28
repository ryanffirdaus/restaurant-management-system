import { NavLink } from 'react-router-dom'
import Icon from './Icon'

type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

interface TableData {
  id: string
  tableNumber: number
  status: TableStatus
  capacity: number
}

interface TableStatusGridProps {
  tables: TableData[]
}

function statusStyle(status: TableStatus) {
  switch (status) {
    case 'available': return { border: 'border-primary/30', bg: 'bg-primary/8', dot: 'bg-primary', text: 'text-primary' }
    case 'occupied':  return { border: 'border-orange-400/30', bg: 'bg-orange-500/8', dot: 'bg-orange-400', text: 'text-orange-400' }
    case 'reserved':  return { border: 'border-blue-400/30', bg: 'bg-blue-500/8', dot: 'bg-blue-400', text: 'text-blue-400' }
    case 'cleaning':  return { border: 'border-danger/30', bg: 'bg-danger/8', dot: 'bg-danger', text: 'text-danger' }
  }
}

export default function TableStatusGrid({ tables }: TableStatusGridProps) {
  const sorted = [...tables].sort((a, b) => a.tableNumber - b.tableNumber)

  return (
    <div className="lg:col-span-2 card-bg rounded-2xl border border-outline shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-outline flex justify-between items-center bg-surface/50">
        <h3 className="font-bold text-text-main">Table Status</h3>
        <div className="flex items-center gap-4">
          {(['available', 'occupied', 'reserved', 'cleaning'] as const).map(s => {
            const c = statusStyle(s)
            return (
              <span key={s} className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {s}
              </span>
            )
          })}
          <NavLink to="/tables" className="text-primary text-[11px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1">
            Manage <Icon name="open_in_new" className="text-xs" />
          </NavLink>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-[380px] custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-2">
            <Icon name="table_bar" className="text-3xl opacity-40" />
            <p className="text-sm">No tables found</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {sorted.map(t => {
              const s = statusStyle(t.status)
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border ${s.border} ${s.bg} flex flex-col items-center justify-center py-3 px-1 gap-1`}
                >
                  <span className={`text-xs font-black ${s.text} leading-none`}>
                    T-{String(t.tableNumber).padStart(2, '0')}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  <span className="text-[9px] text-text-muted leading-none">{t.capacity}p</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
