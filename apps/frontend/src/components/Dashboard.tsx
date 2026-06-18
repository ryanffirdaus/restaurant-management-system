import WelcomeBanner from './WelcomeBanner'
import MetricCard from './MetricCard'
import TableStatusGrid from './TableStatusGrid'
import StaffActivityFeed from './StaffActivityFeed'
import RecentOrdersTable from './RecentOrdersTable'
import AppFooter from './AppFooter'

const kpis = [
  { title: 'Total Revenue', value: '$12,450.00', trend: '12.5%', trendUp: true, icon: 'payments', iconClass: 'text-primary bg-primary/10' },
  { title: 'Total Orders', value: '148', trend: '5.2%', trendUp: true, icon: 'receipt_long', iconClass: 'text-blue-400 bg-blue-500/10' },
  { title: 'Active Tables', value: '18/22', trend: '82% Cap.', icon: 'table_bar', iconClass: 'text-orange-400 bg-orange-500/10' },
]

const tables = [
  { number: 'T-01', status: 'occupied' as const, label: '45 MIN' },
  { number: 'T-02', status: 'available' as const },
  { number: 'T-03', status: 'reserved' as const, label: '19:30', icon: 'event' },
  { number: 'T-04', status: 'occupied' as const, label: '12 MIN' },
  { number: 'T-05', status: 'occupied' as const, label: '64 MIN', icon: 'person' },
  { number: 'T-06', status: 'available' as const },
  { number: 'T-07', status: 'available' as const },
  { number: 'T-08', status: 'occupied' as const, label: '05 MIN' },
  { number: 'T-09', status: 'available' as const },
  { number: 'T-10', status: 'available' as const },
]

const staffActivities = [
  { icon: 'payments', title: 'Order #4203 Paid', description: 'Table 01 • Just now' },
  { icon: 'priority_high', iconClass: 'bg-status-alert/10 text-status-alert', title: 'Kitchen Alert: Delay', description: 'Station 2 • 4 mins ago' },
  { icon: 'check_circle', iconClass: 'bg-primary/10 text-primary', title: 'Table 12 Cleared', description: 'Staff: Elena • 12 mins ago' },
  { icon: 'person_add', title: 'Waitlist Updated', description: 'Party of 4 added • 20 mins ago' },
]

const recentOrders = [
  { id: '#ORD-2490', items: '2x Truffle Pasta, 1x Merlot...', table: 'Table 05', server: 'Marcus K.', amount: '$112.50', status: 'Preparing', time: '12:45 PM' },
  { id: '#ORD-2489', items: '1x Wagyu Steak, 2x Old Fashioned', table: 'Table 01', server: 'Sarah L.', amount: '$184.00', status: 'Served', time: '12:38 PM' },
  { id: '#ORD-2488', items: '4x Margherita Pizza', table: 'Table 12', server: 'Marcus K.', amount: '$72.00', status: 'Canceled', time: '12:30 PM' },
  { id: '#ORD-2487', items: '1x Caesar Salad, 1x Water', table: 'Table 08', server: 'Elena R.', amount: '$24.50', status: 'Served', time: '12:15 PM' },
]

export default function Dashboard() {
  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      <WelcomeBanner />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.title} {...kpi} />
        ))}
        <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden relative group">
          <div className="absolute inset-0 z-0">
            <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-transparent" />
          </div>
          <div className="relative z-10 p-card-padding h-full flex flex-col justify-end">
            <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-1">Daily Special</p>
            <h3 className="text-lg font-bold text-text-main truncate">Truffle Risotto</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <TableStatusGrid tables={tables} />
        <StaffActivityFeed activities={staffActivities} />
      </div>

      <RecentOrdersTable orders={recentOrders} />

      <AppFooter />
    </div>
  )
}
