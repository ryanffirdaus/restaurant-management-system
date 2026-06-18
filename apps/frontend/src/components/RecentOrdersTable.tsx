import Table from './Table'
import Badge from './Badge'
import type { Column } from './Table'

interface Order {
  id: string
  items: string
  table: string
  server: string
  amount: string
  status: string
  time: string
}

function statusVariant(status: string) {
  switch (status) {
    case 'Preparing': return 'warning' as const
    case 'Served': return 'primary' as const
    case 'Canceled': return 'danger' as const
    default: return 'neutral' as const
  }
}

const orderColumns: Column<Order>[] = [
  { key: 'id', label: 'Order ID', className: 'text-sm font-medium whitespace-nowrap text-text-main' },
  { key: 'items', label: 'Items', className: 'text-sm text-text-muted whitespace-nowrap' },
  { key: 'table', label: 'Table', className: 'text-sm text-text-main whitespace-nowrap' },
  { key: 'server', label: 'Server', className: 'text-sm text-text-main whitespace-nowrap' },
  { key: 'amount', label: 'Amount', className: 'text-sm font-bold text-right text-text-main whitespace-nowrap' },
  {
    key: 'status',
    label: 'Status',
    className: 'whitespace-nowrap',
    render: (order) => <Badge variant={statusVariant(order.status)}>{order.status}</Badge>,
  },
  { key: 'time', label: 'Time', className: 'text-text-muted text-sm whitespace-nowrap' },
]

interface RecentOrdersTableProps {
  orders: Order[]
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline flex justify-between items-center bg-surface/50">
        <h3 className="font-bold text-text-main">Recent Orders</h3>
        <div className="flex gap-3">
          <button className="px-4 py-1.5 bg-surface-variant border border-outline rounded-xl text-xs font-bold text-text-muted hover:text-text-main transition-colors">
            Export CSV
          </button>
          <button className="px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all">
            Full History
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table columns={orderColumns} data={orders} />
      </div>
    </div>
  )
}
