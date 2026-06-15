interface KpiCardProps {
  title: string
  value: string
  trend?: string
  trendUp?: boolean
}

function KpiCard({ title, value, trend, trendUp }: KpiCardProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg p-5 px-6 shadow-[0_1px_3px_rgba(15,23,42,0.05)] flex flex-col gap-2">
      <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">{title}</span>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[32px] font-bold text-[#1e293b] leading-none tracking-tight">{value}</span>
        {trend && (
          <span
            className={`
              text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap
              ${trendUp
                ? 'text-[#10b981] bg-[#10b981]/10'
                : 'text-[#ef4444] bg-[#ef4444]/10'
              }
            `}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  )
}

export default KpiCard
