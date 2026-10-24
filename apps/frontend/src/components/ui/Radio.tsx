import type { InputHTMLAttributes } from 'react'

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export default function Radio({ label, id, className = '', ...rest }: RadioProps) {
  const radioId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer group">
      <span className="relative flex items-center justify-center">
        <input
          type="radio"
          id={radioId}
          className="peer sr-only"
          {...rest}
        />
        <span
          className="
            w-5 h-5 rounded-full border transition-all flex items-center justify-center
            border-line-strong bg-background
            peer-checked:border-brand-ink peer-checked:bg-brand
            peer-focus:ring-2 peer-focus:ring-brand-ink/30 peer-focus:ring-offset-1 peer-focus:ring-offset-background
            group-hover:border-brand-ink/50
          "
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-foreground scale-0 peer-checked:scale-100 transition-transform" />
        </span>
      </span>
      {label && (
        <span className="text-sm text-text-main">{label}</span>
      )}
    </label>
  )
}
