import ActivityItem from './ActivityItem'

interface Activity {
  icon: string
  iconClass?: string
  title: string
  description: string
}

interface StaffActivityFeedProps {
  activities: Activity[]
}

export default function StaffActivityFeed({ activities }: StaffActivityFeedProps) {
  return (
    <div className="bg-surface rounded-xl border border-line flex flex-col">
      <div className="p-6 border-b border-outline flex justify-between items-center bg-surface/50">
        <h3 className="font-medium text-text-main">Staff Activity</h3>
        <span className="text-brand-ink text-xs font-medium cursor-pointer hover:underline">View All</span>
      </div>
      <div className="p-6 space-y-6 overflow-y-auto max-h-[420px] custom-scrollbar">
        {activities.map((a, i) => (
          <ActivityItem key={i} {...a} />
        ))}
      </div>
    </div>
  )
}
