import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
  icon?: ReactNode
}

// Saffron is reserved for the one action per screen that moves work forward.
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-brand-foreground font-semibold hover:bg-brand-hover',
  secondary: 'bg-raised text-ink font-medium hover:bg-line',
  outline: 'border border-line-strong text-ink font-medium hover:bg-raised',
  danger: 'bg-danger/10 border border-danger/40 text-danger font-medium hover:bg-danger/20',
  ghost: 'text-ink-2 font-medium hover:text-ink hover:bg-raised',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm', // 44px — touch minimum
  lg: 'h-14 px-6 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded transition-colors duration-150 active:translate-y-px ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </button>
  )
}
