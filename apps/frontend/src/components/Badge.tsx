interface BadgeProps {
  children: string
  variant?: 'primary' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

const variants: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-status-occupied/10 text-status-occupied',
  neutral: 'bg-surface-variant text-text-muted',
}

export default function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
