import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export default function Checkbox({ label, id, className = '', disabled, ...rest }: CheckboxProps) {
  const checkId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <span className="relative flex items-center justify-center">
        <input
          type="checkbox"
          id={checkId}
          className="peer sr-only"
          disabled={disabled}
          {...rest}
        />
        <span
          className="
            w-5 h-5 rounded-md border transition-all flex items-center justify-center
            border-outline bg-background
            peer-checked:bg-primary peer-checked:border-primary
            peer-focus:ring-2 peer-focus:ring-primary/30 peer-focus:ring-offset-1 peer-focus:ring-offset-background
            group-hover:border-primary/50
          "
        >
          <svg
            className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          </svg>
        </span>
      </span>
      {label && (
        <span className={`text-sm ${disabled ? 'text-text-muted' : 'text-text-main'}`}>
          {label}
        </span>
      )}
    </label>
  )
}
