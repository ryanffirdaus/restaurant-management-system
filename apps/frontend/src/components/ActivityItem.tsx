import Icon from './Icon'

interface ActivityItemProps {
  icon: string
  iconClass?: string
  title: string
  description: string
}

export default function ActivityItem({ icon, iconClass = 'bg-surface-variant', title, description }: ActivityItemProps) {
  return (
    <div className="flex gap-4 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:text-primary transition-colors ${iconClass}`}>
        <Icon name={icon} className="text-lg" />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-main">{title}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
    </div>
  )
}
