import type { InputHTMLAttributes } from 'react'
import ValidationMessage from './ValidationMessage'

type ValidationState = 'valid' | 'error' | 'warning'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  validation?: ValidationState
  validationMessage?: string
}

const validationBorders: Record<ValidationState, string> = {
  valid: 'border-ready/60',
  error: 'border-danger/50',
  warning: 'border-progress/60',
}

const validationFocus: Record<ValidationState, string> = {
  valid: 'focus:border-brand-ink',
  error: 'focus:border-danger/50',
  warning: 'focus:border-progress/60',
}

export default function TextInput({
  label,
  hint,
  validation,
  validationMessage,
  className = '',
  disabled,
  ...rest
}: TextInputProps) {
  const borderStyle = validation
    ? validationBorders[validation]
    : 'border-line-strong focus:border-brand-ink'
  const focusStyle = validation
    ? validationFocus[validation]
    : 'focus:border-brand-ink'

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-normal text-text-muted">
          {label}
          {hint && <span className="text-text-muted ml-1 text-xs opacity-60">({hint})</span>}
        </label>
      )}
      <input
        className={`w-full bg-raised border ${borderStyle} rounded px-4 h-11 text-text-main placeholder:text-ink-3 ${focusStyle} focus:ring-0 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-surface-variant/50' : ''
        } ${className}`}
        disabled={disabled}
        {...rest}
      />
      {validationMessage && validation && (
        <ValidationMessage state={validation} message={validationMessage} />
      )}
    </div>
  )
}
