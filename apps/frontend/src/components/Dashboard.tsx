import { useOutletContext } from 'react-router-dom'
import KpiCard from './KpiCard'

const kpis = [
  { title: 'Total Revenue', value: 'Rp 12.8M', trend: '+12.5%', trendUp: true },
  { title: 'Active Orders', value: '18', trend: '+3', trendUp: true },
  { title: 'Tables Occupied', value: '12/20', trend: '60%', trendUp: undefined },
  { title: 'Avg. Order Value', value: 'Rp 214K', trend: '+5.2%', trendUp: true },
]

const recentOrders = [
  { id: '#1024', table: 'T5', customer: 'Budi', items: 3, total: 'Rp 156K', status: 'completed', time: '2 min ago' },
  { id: '#1023', table: 'T2', customer: 'Sari', items: 2, total: 'Rp 89K', status: 'preparing', time: '5 min ago' },
  { id: '#1022', table: 'T8', customer: 'Doni', items: 5, total: 'Rp 312K', status: 'pending', time: '8 min ago' },
  { id: '#1021', table: 'T3', customer: 'Maya', items: 1, total: 'Rp 45K', status: 'completed', time: '12 min ago' },
  { id: '#1020', table: 'T1', customer: 'Rudi', items: 4, total: 'Rp 278K', status: 'ready', time: '15 min ago' },
  { id: '#1019', table: 'T6', customer: 'Ani', items: 2, total: 'Rp 134K', status: 'preparing', time: '18 min ago' },
]

const activities = [
  { text: 'Order #1024 completed', time: '2 min ago', type: 'success' },
  { text: 'Table T8 — new order #1022', time: '8 min ago', type: 'info' },
  { text: 'Low stock: Nasi Goreng', time: '10 min ago', type: 'warning' },
  { text: 'Order #1023 moved to preparing', time: '5 min ago', type: 'info' },
  { text: 'Payment received — Table T5', time: '2 min ago', type: 'success' },
  { text: 'Table T1 — order #1020 ready', time: '15 min ago', type: 'info' },
]

const statusStyles: Record<string, string> = {
  completed: 'bg-[#10b981]/10 text-[#059669]',
  preparing: 'bg-[#f59e0b]/10 text-[#d97706]',
  pending: 'bg-[#64748b]/10 text-[#475569]',
  ready: 'bg-[#3b82f6]/10 text-[#2563eb]',
}

const activityDot: Record<string, string> = {
  success: 'bg-[#10b981] border-[#10b981]',
  warning: 'bg-[#f59e0b] border-[#f59e0b]',
  info: 'bg-[#3b82f6] border-[#3b82f6]',
}

function Dashboard() {
  const { sidebarOpen, toggleSidebar } = useOutletContext<{ sidebarOpen: boolean; toggleSidebar: () => void }>()
  return (
    <div className={`flex-1 overflow-y-auto min-h-screen transition-all duration-200 ${sidebarOpen ? 'ml-sidebar' : 'ml-0'} max-md:ml-0`}>
      <div className="p-6 max-md:p-4">
        {/* Header */}
        <header className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-10 h-10 rounded-md bg-white border border-[#e2e8f0] text-[#1e293b] text-xl flex items-center justify-center shrink-0 hover:bg-[#eceef0]"
              onClick={toggleSidebar}
            >
              ☰
            </button>
            <div>
              <h1 className="text-[28px] font-bold text-[#1e293b] tracking-tight leading-tight">Dashboard</h1>
              <p className="text-sm text-[#64748b] mt-1">Overview of today's operations</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-[#64748b]">Sun, 14 Jun 2026</span>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold bg-[#0f172a] text-white min-h-[44px] hover:bg-[#1e293b] transition-colors">
              + New Order
            </button>
          </div>
        </header>

        {/* KPI Grid */}
        <section className="grid grid-cols-4 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 mb-6">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </section>

        {/* Panels */}
        <div className="grid grid-cols-[1fr_minmax(280px,320px)] gap-5 items-start max-lg:grid-cols-1">
          {/* Recent Orders */}
          <section className="bg-white border border-[#e2e8f0] rounded-lg shadow-[0_1px_3px_rgba(15,23,42,0.05)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-sm font-semibold text-[#1e293b]">Recent Orders</h2>
              <a href="#" className="text-xs font-medium text-[#10b981] hover:underline">View All</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#f1f5f9] sticky top-0">
                  <tr>
                    {['Order', 'Table', 'Customer', 'Items', 'Total', 'Status', 'Time'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider border-b border-[#e2e8f0] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#f8fafc]">
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] font-medium tabular-nums text-[#1e293b] whitespace-nowrap">{order.id}</td>
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] text-[#1e293b] whitespace-nowrap">{order.table}</td>
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] text-[#1e293b] whitespace-nowrap">{order.customer}</td>
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] text-[#1e293b] whitespace-nowrap">{order.items}</td>
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] font-medium tabular-nums text-[#1e293b] whitespace-nowrap">{order.total}</td>
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-[8px] text-[11px] font-semibold capitalize ${statusStyles[order.status]}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 border-b border-[#f1f5f9] text-[#64748b] whitespace-nowrap">{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Activity Feed */}
          <section className="bg-white border border-[#e2e8f0] rounded-lg shadow-[0_1px_3px_rgba(15,23,42,0.05)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-sm font-semibold text-[#1e293b]">Activity Feed</h2>
            </div>
            <div className="py-2">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3 px-5 py-3 border-l-2 border-[#e2e8f0] ml-4 relative last:border-l-transparent">
                  <div className={`absolute -left-[5px] top-4 w-2 h-2 rounded-full border-2 border-[#e2e8f0] bg-white ${activityDot[a.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1e293b] leading-tight">{a.text}</p>
                    <span className="text-[11px] font-medium text-[#64748b] tracking-wide">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
