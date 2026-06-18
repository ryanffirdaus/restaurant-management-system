import { useCallback } from 'react'
import Icon from './Icon'

type TableStatus = 'available' | 'occupied' | 'reserved'

interface TableStatusCardProps {
  number: string
  status: TableStatus
  label?: string
  icon?: string
}

const statusColors: Record<TableStatus, { bg: string; border: string; text: string; badge: string }> = {
  available: { bg: 'bg-primary/5', border: 'border-primary/30', text: 'text-primary', badge: 'bg-primary/10' },
  occupied: { bg: 'bg-status-occupied/5', border: 'border-status-occupied/30', text: 'text-status-occupied', badge: 'bg-status-occupied/10' },
  reserved: { bg: 'bg-status-reserved/5', border: 'border-status-reserved/30', text: 'text-status-reserved', badge: 'bg-status-reserved/10' },
}

const statusIcons: Record<TableStatus, string> = {
  available: 'person',
  occupied: 'groups',
  reserved: 'event',
}

export default function TableStatusCard({ number, status, label, icon }: TableStatusCardProps) {
  const c = statusColors[status]

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
      <span className={`text-[10px] font-bold ${c.text} mb-2 tracking-widest`}>{number}</span>
      <Icon name={icon ?? statusIcons[status]} className={`${c.text} text-2xl mb-1`} />
      {label && (
        <span className={`text-[10px] font-bold ${c.text} ${c.badge} px-2 py-0.5 rounded-full`}>{label}</span>
      )}
    </div>
  )
}
