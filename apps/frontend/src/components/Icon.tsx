interface IconProps {
  name: string
  className?: string
  filled?: boolean
}

export default function Icon({ name, className = 'text-lg', filled }: IconProps) {
  const cls = filled && !name.includes('-fill') ? name.replace(/-line$/, '-fill') : name
  return <i className={`${cls} leading-none ${className}`} />
}
