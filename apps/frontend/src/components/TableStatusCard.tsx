import { useCallback } from 'react'
import Icon from './Icon'
import { tableStatus, tones } from '../lib/status'

type TableStatus = 'available' | 'occupied' | 'reserved'

interface TableStatusCardProps {
  number: string
  status: TableStatus
  label?: string
  icon?: string
}

const statusIcons: Record<TableStatus, string> = {
  available: 'ri-user-line',
  occupied: 'ri-group-2-line',
  reserved: 'ri-calendar-line',
}

export default function TableStatusCard({ number, status, label, icon }: TableStatusCardProps) {
  const t = tones[tableStatus[status].tone]
  const c = { bg: 'bg-surface', border: 'border-line', text: t.text, badge: t.soft }

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.classList.add('scale-95')
    setTimeout(() => el.classList.remove('scale-95'), 100)
  }, [])

  return (
    <div
      className={`aspect-square ${c.bg} ${c.border} border rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer hover:opacity-80 transition-all group select-none`}
      onClick={handleClick}
    >
      <span className={`text-xs ${c.text} mb-2 font-mono`}>{number}</span>
      <Icon name={icon ?? statusIcons[status]} className={`${c.text} text-2xl mb-1`} />
      {label && (
        <span className={`text-xs font-medium ${c.text} ${c.badge} px-2 py-0.5 rounded-full`}>{label}</span>
      )}
    </div>
  )
}
