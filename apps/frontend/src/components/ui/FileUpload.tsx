import { useState, useRef, type DragEvent } from 'react'
import Icon from '../Icon'

interface FileUploadProps {
  label?: string
  accept?: string
  maxSizeMB?: number
  onFiles?: (files: File[]) => void
}

export default function FileUpload({
  label = 'Product Images',
  accept = '.jpg,.jpeg,.png',
  maxSizeMB = 5,
  onFiles,
}: FileUploadProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles?.(files)
  }

  function handleClick() {
    inputRef.current?.click()
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFiles?.(files)
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-normal text-text-muted mb-2">{label}</label>
      )}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center bg-background/40 transition-all cursor-pointer ${
          dragging
            ? 'border-brand-ink/40 bg-brand/5'
            : 'border-line-strong hover:border-brand-ink/40 hover:bg-brand/5'
        }`}
      >
        <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center text-brand-ink mb-4">
          <Icon name="ri-add-line" className="text-2xl" />
        </div>
        <p className="text-sm text-text-main font-normal">Click or drag images here</p>
        <p className="text-xs text-text-muted mt-1">
          Supports {accept.replace(/\./g, '').toUpperCase()} (Max {maxSizeMB}MB)
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        multiple
      />
    </div>
  )
}
