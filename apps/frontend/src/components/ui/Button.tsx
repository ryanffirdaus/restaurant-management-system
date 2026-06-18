import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  icon?: ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-black font-bold hover:bg-emerald-light shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20',
  secondary:
    'bg-surface-variant text-text-main font-bold hover:bg-outline hover:shadow-lg hover:shadow-black/10',
  outline:
    'border border-primary/50 text-primary font-bold hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10',
  danger:
    'bg-danger/10 border border-danger/20 text-danger font-bold hover:bg-danger/20 hover:shadow-lg hover:shadow-danger/10',
  ghost:
    'text-text-muted font-medium hover:text-text-main hover:bg-surface-variant',
}

export default function Button({
  variant = 'primary',
  children,
  icon,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
        variantClasses[variant]
      } ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none scale-100 hover:scale-100 active:scale-100' : 'cursor-pointer'} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  )
}
