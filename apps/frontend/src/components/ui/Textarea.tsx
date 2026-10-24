import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export default function Textarea({ label, className = '', ...rest }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-normal text-text-muted">{label}</label>
      )}
      <textarea
        className={`w-full bg-raised border border-line-strong rounded px-4 py-3 text-text-main placeholder:text-ink-3 focus:border-brand-ink focus:ring-0 resize-none transition-all ${className}`}
        {...rest}
      />
    </div>
  )
}
