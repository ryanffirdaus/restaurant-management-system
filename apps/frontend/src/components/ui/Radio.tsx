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
            w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center
            border-outline bg-background
            peer-checked:border-primary peer-checked:bg-primary
            peer-focus:ring-2 peer-focus:ring-primary/30 peer-focus:ring-offset-1 peer-focus:ring-offset-background
            group-hover:border-primary/50
          "
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white scale-0 peer-checked:scale-100 transition-transform" />
        </span>
      </span>
      {label && (
        <span className="text-sm text-text-main">{label}</span>
      )}
    </label>
  )
}
