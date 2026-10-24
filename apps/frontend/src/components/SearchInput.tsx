import Icon from './Icon'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search anything...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Icon name="ri-search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        className="w-full bg-surface-variant border-none rounded pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-brand-ink text-text-main placeholder:text-text-muted transition-all"
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
