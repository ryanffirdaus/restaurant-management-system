import type { InputHTMLAttributes } from 'react'

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export default function Toggle({ label, id, className = '', ...rest }: ToggleProps) {
  const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs text-text-muted uppercase font-bold">{label}</span>}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={toggleId}
          className="sr-only peer"
          {...rest}
        />
        <div
          className="
            w-12 h-6 rounded-full transition-all
            bg-surface-variant border border-outline
            peer-checked:bg-primary peer-checked:border-primary peer-checked:shadow-[0_0_15px_rgba(16,185,129,0.3)]
            peer-focus:outline-none
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:bg-text-muted after:rounded-full after:h-5 after:w-5 after:transition-all
            peer-checked:after:translate-x-6 peer-checked:after:bg-white peer-checked:after:border-white
          "
        />
      </label>
    </div>
  )
}
