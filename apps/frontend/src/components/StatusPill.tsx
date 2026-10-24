import Icon from './Icon'
import { tones, statusMeta, type StatusMeta } from '../lib/status'

interface StatusPillProps {
  map: Record<string, StatusMeta>
  status: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

/** Colored chip with icon + label. Use for every order / item / table status. */
export default function StatusPill({ map, status, size = 'sm', className = '' }: StatusPillProps) {
  const meta = statusMeta(map, status)
  const t = tones[meta.tone]
  const sizing = size === 'md' ? 'h-8 px-3 text-sm gap-1.5' : 'h-6 px-2 text-xs gap-1'
  return (
    <span className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sizing} ${t.text} ${t.soft} ${t.border} ${className}`}>
      <Icon name={meta.icon} className={size === 'md' ? 'text-base' : 'text-sm'} />
      {meta.label}
    </span>
  )
}
