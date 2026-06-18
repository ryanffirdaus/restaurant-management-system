import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export default function Textarea({ label, className = '', ...rest }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-muted">{label}</label>
      )}
      <textarea
        className={`w-full bg-background border border-outline rounded-xl px-4 py-3 text-text-main placeholder:text-text-muted/40 focus:border-primary/50 focus:ring-0 resize-none transition-all ${className}`}
        {...rest}
      />
    </div>
  )
}
