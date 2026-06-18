interface IconProps {
  name: string
  className?: string
  filled?: boolean
}

export default function Icon({ name, className = 'text-lg', filled = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined leading-none ${className}`}
      style={{ fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {name}
    </span>
  )
}
