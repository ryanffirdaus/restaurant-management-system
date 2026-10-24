import type { ReactNode } from 'react'
import Icon from './Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-md',
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={`relative bg-surface rounded-3xl border border-line shadow-pop w-full ${maxWidth} flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-outline">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{title}</h2>
            {subtitle && (
              <p className="text-sm text-text-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-0.5 rounded text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors"
          >
            <Icon name="ri-close-line" className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
