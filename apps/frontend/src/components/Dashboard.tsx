import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiGet, formatUSD } from '../lib/api'
import WelcomeBanner from './WelcomeBanner'
import MetricCard from './MetricCard'
import TableStatusGrid from './TableStatusGrid'
import RecentOrdersTable from './RecentOrdersTable'
import AppFooter from './AppFooter'

interface RestaurantTable {
  id: string
  table_number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
}

interface Order {
  id: string
  customer_name: string | null
  status: string
  total_price: number | null
  table_id: string | null
  created_at: string
  order_items?: { quantity: number; menu_item?: { name: string } }[]
}

export default function Dashboard() {
  const { profile } = useAuth()
  const displayName = (profile?.name as string) ?? 'Manager'

  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [tablesData, ordersData] = await Promise.all([
        apiGet<RestaurantTable[]>('/tables'),
        apiGet<Order[]>('/orders'),
      ])
      setTables(tablesData)
      setOrders(ordersData)
    } catch {
      // show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const occupied = tables.filter(t => t.status === 'occupied').length
  const available = tables.filter(t => t.status === 'available').length
  const totalTables = tables.length

  const todayStr = new Date().toDateString()
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === todayStr)
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_price ?? 0), 0)
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length

  const tableData = tables.map(t => ({
    id: t.id,
    number: `T-${String(t.table_number).padStart(2, '0')}`,
    tableNumber: t.table_number,
    status: t.status,
    capacity: t.capacity,
  }))

  const recentOrders = orders.slice(0, 10).map(o => {
    const items = o.order_items ?? []
    const itemsPreview = items.length > 0
      ? items.slice(0, 2).map(i => `${i.quantity}x ${i.menu_item?.name ?? '?'}`).join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '')
      : '—'
    const tableMatch = tables.find(t => t.id === o.table_id)
    const tableLabel = tableMatch ? `Table ${tableMatch.table_number}` : 'Takeaway'
    return {
      id: `#${o.id.slice(0, 6).toUpperCase()}`,
      items: itemsPreview,
      table: tableLabel,
      server: o.customer_name ?? '—',
      amount: o.total_price != null ? formatUSD(o.total_price) : '—',
      status: o.status.charAt(0).toUpperCase() + o.status.slice(1),
      time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  })

  const kpis = [
    {
      title: 'Today\'s Revenue',
      value: loading ? '...' : formatUSD(todayRevenue),
      icon: 'payments',
      iconClass: 'text-primary bg-primary/10',
    },
    {
      title: 'Total Orders',
      value: loading ? '...' : String(orders.length),
      icon: 'receipt_long',
      iconClass: 'text-blue-400 bg-blue-500/10',
    },
    {
      title: 'Active Tables',
      value: loading ? '...' : `${occupied}/${totalTables}`,
      trend: totalTables > 0 ? `${Math.round((occupied / totalTables) * 100)}% Cap.` : undefined,
      icon: 'table_bar',
      iconClass: 'text-orange-400 bg-orange-500/10',
    },
    {
      title: 'Active Orders',
      value: loading ? '...' : String(activeOrders),
      icon: 'pending_actions',
      iconClass: 'text-yellow-400 bg-yellow-500/10',
    },
  ]

  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      <WelcomeBanner
        name={displayName}
        newOrders={activeOrders}
        revenue={formatUSD(todayRevenue)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <TableStatusGrid tables={tableData} />
        {/* Stats sidebar */}
        <div className="card-bg rounded-2xl border border-outline shadow-sm p-6 flex flex-col gap-5">
          <h3 className="font-bold text-text-main">Quick Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: 'text-text-muted' },
              { label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length, color: 'text-orange-400' },
              { label: 'Ready', count: orders.filter(o => o.status === 'ready').length, color: 'text-primary' },
              { label: 'Completed today', count: todayOrders.filter(o => o.status === 'completed').length, color: 'text-blue-400' },
              { label: 'Available tables', count: available, color: 'text-primary' },
              { label: 'Occupied tables', count: occupied, color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-outline/50 last:border-0">
                <span className="text-sm text-text-muted">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{loading ? '…' : s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RecentOrdersTable orders={recentOrders} />

      <AppFooter />
    </div>
  )
}
