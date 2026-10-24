import { useState, useEffect, useCallback } from 'react'
import { apiGet, formatIDR } from '../../lib/api'
import MetricCard from '../../components/MetricCard'

interface Order {
  id: string
  status: string
  total_price: number | null
  created_at: string
  order_items?: { quantity: number; price_at_purchase: number; menu_item?: { name: string; category?: string } }[]
}

interface MenuItem {
  id: string
  name: string
  category: string | null
}

// ─── Mini bar chart ──────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-28">
      {data.map(d => {
        const pct = (d.value / max) * 100
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-xs text-ink-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium num whitespace-nowrap">
              {formatIDR(d.value)}
            </span>
            <div className="w-full rounded-t-md bg-raised relative overflow-hidden" style={{ height: '80px' }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-brand rounded-t-md transition-all duration-500"
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-ink-3 font-normal whitespace-nowrap">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Donut chart (CSS) ───────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  completed:  'rgb(var(--c-ink-3))',
  preparing:  'rgb(var(--c-progress))',
  pending:    'rgb(var(--c-pending))',
  ready:      'rgb(var(--c-ready))',
  cancelled:  'rgb(var(--c-danger))',
}

function DonutChart({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.count, 0)
  if (total === 0) return <div className="w-28 h-28 rounded-full bg-raised" />

  let cumulative = 0
  const parts = segments.filter(s => s.count > 0).map(s => {
    const pct = (s.count / total) * 360
    const start = cumulative
    cumulative += pct
    return { ...s, start, pct }
  })

  const gradientParts = parts.map(p =>
    `${p.color} ${p.start}deg ${p.start + p.pct}deg`
  ).join(', ')

  return (
    <div
      className="w-28 h-28 rounded-full flex-shrink-0"
      style={{ background: `conic-gradient(${gradientParts})` }}
    >
      <div className="w-full h-full rounded-full flex items-center justify-center" style={{ margin: '14px', width: 'calc(100% - 28px)', height: 'calc(100% - 28px)', background: 'inherit', borderRadius: '50%' }}>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const data = await apiGet<Order[]>('/orders')
      setOrders(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Derived stats ──

  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (o.total_price ?? 0), 0)
  const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0
  const cancelRate = orders.length > 0
    ? ((orders.filter(o => o.status === 'cancelled').length / orders.length) * 100).toFixed(1)
    : '0'

  // Revenue last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      label: d.toLocaleDateString('en', { weekday: 'short' }),
      dateStr: d.toDateString(),
      value: 0,
    }
  })
  completed.forEach(o => {
    const ds = new Date(o.created_at).toDateString()
    const slot = last7.find(d => d.dateStr === ds)
    if (slot) slot.value += o.total_price ?? 0
  })

  // Orders by status (donut)
  const statusCounts = ['completed', 'preparing', 'pending', 'ready', 'cancelled'].map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    count: orders.filter(o => o.status === s).length,
    color: STATUS_COLORS[s],
  }))

  // Top selling items
  const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {}
  orders.forEach(o => {
    (o.order_items ?? []).forEach(item => {
      const name = item.menu_item?.name ?? 'Unknown'
      if (!itemSales[name]) itemSales[name] = { name, qty: 0, revenue: 0 }
      itemSales[name].qty += item.quantity
      itemSales[name].revenue += item.quantity * item.price_at_purchase
    })
  })
  const topItems = Object.values(itemSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8)
  const maxQty = Math.max(...topItems.map(i => i.qty), 1)

  // Revenue by category
  const catRevenue: Record<string, number> = {}
  orders.forEach(o => {
    (o.order_items ?? []).forEach(item => {
      const cat = item.menu_item?.category ?? 'Other'
      catRevenue[cat] = (catRevenue[cat] ?? 0) + item.quantity * item.price_at_purchase
    })
  })
  const catData = Object.entries(catRevenue)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label: label.length > 6 ? label.slice(0, 5) + '…' : label, value }))

  // Hourly distribution
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
    label: h % 3 === 0 ? `${h}h` : '',
    value: orders.filter(o => new Date(o.created_at).getHours() === h).length,
  }))

  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Analytics</h1>
        <p className="text-sm text-ink-2 mt-0.5">Performance overview based on all recorded orders</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {[
          { label: 'Total Revenue', value: formatIDR(totalRevenue), icon: 'ri-money-dollar-circle-line', tone: 'neutral' as const },
          { label: 'Avg Order Value', value: formatIDR(avgOrderValue), icon: 'ri-line-chart-line', tone: 'neutral' as const },
          { label: 'Total Orders', value: String(orders.length), icon: 'ri-bill-line', tone: 'pending' as const },
          { label: 'Cancellation Rate', value: `${cancelRate}%`, icon: 'ri-close-circle-line', tone: 'danger' as const },
        ].map(k => (
          <MetricCard key={k.label} title={k.label} value={loading ? '...' : k.value} icon={k.icon} tone={k.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Revenue last 7 days */}
        <div className="lg:col-span-2 bg-surface rounded-xl border border-line p-5">
          <h3 className="font-semibold text-ink mb-4">Revenue — Last 7 Days</h3>
          {loading ? (
            <div className="h-28 flex items-center justify-center text-ink-2 text-sm">Loading...</div>
          ) : (
            <BarChart data={last7} />
          )}
        </div>

        {/* Orders by status donut */}
        <div className="bg-surface rounded-xl border border-line p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-ink">Orders by Status</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-ink-2 text-sm">Loading...</div>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 flex-shrink-0">
                <DonutChart segments={statusCounts} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-16 h-16 rounded-full bg-surface flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold text-ink leading-none num">{orders.length}</span>
                    <span className="text-xs text-ink-3">total</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                {statusCounts.filter(s => s.count > 0).map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-ink-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="truncate">{s.label}</span>
                    </span>
                    <span className="text-xs font-semibold text-ink num">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        {/* Top selling items */}
        <div className="bg-surface rounded-xl border border-line p-5">
          <h3 className="font-semibold text-ink mb-4">Top Selling Items</h3>
          {loading ? (
            <div className="text-center text-ink-2 text-sm py-6">Loading...</div>
          ) : topItems.length === 0 ? (
            <div className="text-center text-ink-2 text-sm py-6">No data</div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => {
                const pct = (item.qty / maxQty) * 100
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2 text-ink font-normal min-w-0">
                        <span className="text-xs font-medium text-ink-3 w-4 text-center num">{i + 1}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-ink-3 text-xs num">{item.qty} sold</span>
                        <span className="font-semibold text-ink num">{formatIDR(item.revenue)}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-raised overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Revenue by category */}
        <div className="bg-surface rounded-xl border border-line p-5">
          <h3 className="font-semibold text-ink mb-4">Revenue by Category</h3>
          {loading ? (
            <div className="text-center text-ink-2 text-sm py-6">Loading...</div>
          ) : catData.length === 0 ? (
            <div className="text-center text-ink-2 text-sm py-6">No data</div>
          ) : (
            <BarChart data={catData} />
          )}
        </div>
      </div>

      {/* Hourly order distribution */}
      <div className="bg-surface rounded-xl border border-line p-5">
        <h3 className="font-semibold text-ink mb-4">Orders by Hour of Day</h3>
        {loading ? (
          <div className="text-center text-ink-2 text-sm py-6">Loading...</div>
        ) : (
          <BarChart data={hourBuckets} />
        )}
      </div>
    </div>
  )
}
