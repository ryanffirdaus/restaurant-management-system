import { tones, type Tone } from '../lib/status'

interface BadgeProps {
  children: string
  variant?: 'primary' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

const variantTone: Record<NonNullable<BadgeProps['variant']>, Tone> = {
  primary: 'ready',
  warning: 'progress',
  danger: 'danger',
  info: 'pending',
  neutral: 'neutral',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  const t = tones[variantTone[variant]]
  return (
    <span className={`inline-flex items-center h-6 px-2 rounded-full border text-xs font-medium ${t.text} ${t.soft} ${t.border} ${className}`}>
      {children}
    </span>
  )
}
