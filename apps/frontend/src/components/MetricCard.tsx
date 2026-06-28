import Icon from './Icon'

interface MetricCardProps {
  title: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
  iconClass?: string
}

export default function MetricCard({ title, value, trend, trendUp, icon, iconClass = 'text-primary bg-primary/10' }: MetricCardProps) {
  return (
    <div className="card-bg p-card-padding rounded-2xl border border-outline shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-2 rounded-xl ${iconClass}`}>
          <Icon name={icon} />
        </div>
        {trend && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trendUp ? 'text-primary' : 'text-danger'}`}>
            <Icon name={trendUp ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} className="text-xs" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-text-main">{value}</h3>
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
    </div>
  )
}
