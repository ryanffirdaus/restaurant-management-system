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
  valid: 'border-primary/50',
  error: 'border-danger/50',
  warning: 'border-warning/40',
}

const validationFocus: Record<ValidationState, string> = {
  valid: 'focus:border-primary/50',
  error: 'focus:border-danger/50',
  warning: 'focus:border-warning/40',
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
    : 'border-outline focus:border-primary/50'
  const focusStyle = validation
    ? validationFocus[validation]
    : 'focus:border-primary/50'

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-muted">
          {label}
          {hint && <span className="text-text-muted ml-1 text-xs opacity-60">({hint})</span>}
        </label>
      )}
      <input
        className={`w-full bg-background border ${borderStyle} rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted/40 ${focusStyle} focus:ring-0 transition-all ${
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
