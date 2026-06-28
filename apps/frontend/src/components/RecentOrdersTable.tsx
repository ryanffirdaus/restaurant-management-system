import { NavLink } from 'react-router-dom'

interface Order {
  id: string
  items: string
  table: string
  server: string
  amount: string
  status: string
  time: string
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Pending:   { bg: 'bg-text-muted/10',   text: 'text-text-muted' },
  Preparing: { bg: 'bg-orange-500/10',   text: 'text-orange-400' },
  Ready:     { bg: 'bg-primary/10',      text: 'text-primary' },
  Completed: { bg: 'bg-blue-500/10',     text: 'text-blue-400' },
  Cancelled: { bg: 'bg-danger/10',       text: 'text-danger' },
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? { bg: 'bg-surface-variant', text: 'text-text-muted' }
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${s.bg} ${s.text}`}>
      {status}
    </span>
  )
}

interface RecentOrdersTableProps {
  orders: Order[]
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden">
      <div className="p-5 border-b border-outline flex justify-between items-center bg-surface/50">
        <h3 className="font-bold text-text-main">Recent Orders</h3>
        <NavLink
          to="/orders"
          className="px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-bold hover:opacity-90 transition-all"
        >
          View All
        </NavLink>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-variant/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-outline">
              <th className="px-5 py-3 whitespace-nowrap">Order ID</th>
              <th className="px-5 py-3 whitespace-nowrap">Items</th>
              <th className="px-5 py-3 whitespace-nowrap">Table</th>
              <th className="px-5 py-3 whitespace-nowrap">Status</th>
              <th className="px-5 py-3 whitespace-nowrap text-right">Amount</th>
              <th className="px-5 py-3 whitespace-nowrap">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">No orders yet.</td>
              </tr>
            ) : orders.map((o, i) => (
              <tr key={i} className="hover:bg-surface-variant/40 transition-colors">
                <td className="px-5 py-3 text-sm font-mono font-medium text-text-main whitespace-nowrap">{o.id}</td>
                <td className="px-5 py-3 text-sm text-text-muted whitespace-nowrap max-w-[200px] truncate">{o.items}</td>
                <td className="px-5 py-3 text-sm text-text-main whitespace-nowrap">{o.table}</td>
                <td className="px-5 py-3 whitespace-nowrap"><StatusPill status={o.status} /></td>
                <td className="px-5 py-3 text-sm font-bold text-right text-text-main whitespace-nowrap tabular-nums">{o.amount}</td>
                <td className="px-5 py-3 text-sm text-text-muted whitespace-nowrap">{o.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
