import Icon from './Icon'
import { tones, type Tone } from '../lib/status'

interface MetricCardProps {
  title: string
  value: string
  trend?: string
  trendUp?: boolean
  icon: string
  tone?: Tone
  /** @deprecated use `tone` */
  iconClass?: string
}

export default function MetricCard({ title, value, trend, trendUp, icon, tone = 'neutral' }: MetricCardProps) {
  const t = tones[tone]
  return (
    <div className="bg-surface border border-line rounded-xl p-card-padding flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-ink-2">{title}</p>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.soft} ${t.text}`}>
          <Icon name={icon} className="text-lg" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <h3 className="text-3xl font-semibold text-ink num truncate">{value}</h3>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 pb-1 shrink-0 ${trendUp === false ? 'text-danger' : 'text-ready'}`}>
            <Icon name={trendUp === false ? 'ri-arrow-down-line' : 'ri-arrow-up-line'} className="text-xs" />
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}
