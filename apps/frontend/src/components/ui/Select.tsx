import { useState, useRef, useEffect, useMemo } from 'react'
import ValidationMessage from './ValidationMessage'
import Icon from '../Icon'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  validation?: 'valid' | 'error' | 'warning'
  validationMessage?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}

export default function Select({
  label,
  hint,
  options,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  validation,
  validationMessage,
  value,
  onChange,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState('')
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internal
  const selected = options.find((o) => o.value === currentValue)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => searchRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  )

  function handleSelect(opt: SelectOption) {
    if (!isControlled) setInternal(opt.value)
    onChange?.(opt.value)
    setOpen(false)
  }

  const borderColor = validation
    ? validation === 'valid'
      ? 'border-primary/50'
      : validation === 'error'
        ? 'border-danger/50'
        : 'border-warning/40'
    : open
      ? 'border-primary'
      : 'border-outline hover:border-primary/50'

  const rounded = open ? 'rounded-t-xl' : 'rounded-xl'

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-text-muted">
          {label}
          {hint && <span className="text-text-muted ml-1 text-xs opacity-60">({hint})</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={`w-full bg-background border-2 ${borderColor} ${rounded} px-4 py-3 flex justify-between items-center text-text-main transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={selected ? 'text-text-main truncate' : 'text-text-muted/40 truncate'}>
            {selected ? selected.label : placeholder}
          </span>
          <Icon
            name={open ? 'expand_less' : 'expand_more'}
            className="text-base text-text-muted shrink-0"
          />
        </button>
        {open && (
          <div className="absolute z-20 w-full bg-surface border-x-2 border-b-2 border-primary rounded-b-xl shadow-lg shadow-primary/5 overflow-hidden">
            <div className="p-2 border-b border-outline">
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-background border border-outline rounded-lg px-3 py-1.5 text-sm text-text-main placeholder:text-text-muted/40 focus:border-primary/50 focus:ring-0 outline-none"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-text-muted">No results</div>
              ) : (
                filtered.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors text-text-main hover:bg-surface-variant ${
                      selected?.value === opt.value ? 'bg-primary/10 font-medium' : ''
                    }`}
                  >
                    {opt.label}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {validationMessage && validation && (
        <ValidationMessage state={validation} message={validationMessage} />
      )}
    </div>
  )
}
