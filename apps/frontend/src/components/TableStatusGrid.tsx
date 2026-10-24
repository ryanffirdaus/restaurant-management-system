import { NavLink } from 'react-router-dom'
import Icon from './Icon'
import { tableStatus, tones } from '../lib/status'

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

export default function TableStatusGrid({ tables }: TableStatusGridProps) {
  const sorted = [...tables].sort((a, b) => a.tableNumber - b.tableNumber)

  return (
    <div className="lg:col-span-2 bg-surface rounded-xl border border-line overflow-hidden flex flex-col">
      <div className="p-5 border-b border-outline flex justify-between items-center">
        <h3 className="font-semibold text-text-main">Table Status</h3>
        <div className="flex items-center gap-4">
          {(['available', 'occupied', 'reserved', 'cleaning'] as const).map(s => {
            const c = tones[tableStatus[s].tone]
            return (
              <span key={s} className="hidden sm:flex items-center gap-1.5 text-xs text-ink-2">
                <span className={`w-2 h-2 rounded-full ${c.solid}`} />
                {tableStatus[s].label}
              </span>
            )
          })}
          <NavLink to="/tables" className="text-brand-ink text-xs font-medium hover:underline flex items-center gap-1">
            Manage <Icon name="ri-external-link-line" className="text-xs" />
          </NavLink>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-[380px] custom-scrollbar">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted gap-2">
            <Icon name="ri-layout-grid-line" className="text-3xl opacity-40" />
            <p className="text-sm">No tables found</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {sorted.map(t => {
              const s = tones[tableStatus[t.status]?.tone ?? 'neutral']
              return (
                <div
                  key={t.id}
                  className={`relative overflow-hidden rounded-lg border border-line bg-raised/40 flex flex-col items-center justify-center pt-4 pb-3 px-1 gap-1`}
                >
                  <span className={`absolute inset-x-0 top-0 h-1 ${s.solid}`} />
                  <span className="text-base font-semibold text-ink leading-none num">
                    {String(t.tableNumber).padStart(2, '0')}
                  </span>
                  <span className={`text-xs leading-none ${s.text}`}>{tableStatus[t.status]?.label ?? t.status}</span>
                  <span className="text-xs text-ink-3 leading-none flex items-center gap-0.5"><Icon name="ri-user-line" className="text-xs" />{t.capacity}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
