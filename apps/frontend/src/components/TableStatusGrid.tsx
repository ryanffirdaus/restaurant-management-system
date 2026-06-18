import TableStatusCard from './TableStatusCard'

type TableStatus = 'available' | 'occupied' | 'reserved'

interface TableData {
  number: string
  status: TableStatus
  label?: string
  icon?: string
}

interface TableStatusGridProps {
  tables: TableData[]
}

export default function TableStatusGrid({ tables }: TableStatusGridProps) {
  return (
    <div className="lg:col-span-2 card-bg rounded-2xl border border-outline shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-outline flex justify-between items-center bg-surface/50">
        <h3 className="font-bold text-text-main">Table Status</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-occupied" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-reserved" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Reserved</span>
          </div>
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto max-h-[420px] custom-scrollbar">
        {tables.map((t) => (
          <TableStatusCard key={t.number} {...t} />
        ))}
      </div>
    </div>
  )
}
