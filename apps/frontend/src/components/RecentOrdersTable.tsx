import { NavLink } from 'react-router-dom'
import StatusPill from './StatusPill'
import { orderStatus } from '../lib/status'

interface Order {
  id: string
  items: string
  table: string
  server: string
  amount: string
  status: string
  time: string
}

interface RecentOrdersTableProps {
  orders: Order[]
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="bg-surface rounded-xl border border-line overflow-hidden">
      <div className="p-5 border-b border-outline flex justify-between items-center">
        <h3 className="font-semibold text-text-main">Recent Orders</h3>
        <NavLink
          to="/orders"
          className="h-9 px-3 inline-flex items-center rounded bg-raised text-ink text-sm font-medium hover:bg-line transition-colors"
        >
          View All
        </NavLink>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-variant/50 text-ink-3 text-xs font-medium border-b border-outline">
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
                <td className="px-5 py-3 text-sm font-mono font-normal text-text-main whitespace-nowrap">{o.id}</td>
                <td className="px-5 py-3 text-sm text-text-muted whitespace-nowrap max-w-[200px] truncate">{o.items}</td>
                <td className="px-5 py-3 text-sm text-text-main whitespace-nowrap">{o.table}</td>
                <td className="px-5 py-3 whitespace-nowrap"><StatusPill map={orderStatus} status={o.status} /></td>
                <td className="px-5 py-3 text-sm font-semibold text-right text-text-main whitespace-nowrap num">{o.amount}</td>
                <td className="px-5 py-3 text-sm text-text-muted whitespace-nowrap">{o.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
