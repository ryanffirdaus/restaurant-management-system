import { useState, useRef, useEffect, useMemo } from 'react'
import Icon from '../Icon'

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  label?: string
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  selectedValues?: string[]
  onChange?: (values: string[]) => void
}

export default function Combobox({
  label,
  options,
  placeholder = 'Choose...',
  searchPlaceholder = 'Search...',
  selectedValues,
  onChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [internal, setInternal] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isControlled = selectedValues !== undefined
  const currentValues = isControlled ? selectedValues : internal

  const selectedOptions = useMemo(
    () => options.filter((o) => currentValues.includes(o.value)),
    [options, currentValues]
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  function toggle(opt: ComboboxOption) {
    const next = currentValues.includes(opt.value)
      ? currentValues.filter((v) => v !== opt.value)
      : [...currentValues, opt.value]
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  function triggerLabel() {
    if (selectedOptions.length === 0) return <span className="text-text-muted/40">{placeholder}</span>
    if (selectedOptions.length <= 2) {
      return <span className="text-text-main truncate">{selectedOptions.map((o) => o.label).join(', ')}</span>
    }
    return <span className="text-text-main">{selectedOptions.length} selected</span>
  }

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-text-muted">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`w-full bg-background border-2 flex justify-between items-center text-text-main transition-all ${
            open
              ? 'border-primary rounded-t-xl'
              : 'border-outline hover:border-primary/50 rounded-xl'
          } px-4 py-3`}
        >
          <span className="flex items-center gap-1.5 min-w-0 flex-1">
            {selectedOptions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            )}
            {triggerLabel()}
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
                filtered.map((opt) => {
                  const checked = currentValues.includes(opt.value)
                  return (
                    <div
                      key={opt.value}
                      onClick={() => toggle(opt)}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-3 ${
                        checked
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-text-main hover:bg-surface-variant'
                      }`}
                    >
                      <span className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 bg-background border-outline">
                        {checked && (
                          <Icon name="ri-check-line" className="text-[10px] text-primary" filled />
                        )}
                      </span>
                      <span>{opt.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
