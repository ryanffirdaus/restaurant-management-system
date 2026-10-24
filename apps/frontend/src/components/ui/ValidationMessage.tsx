import Icon from '../Icon'

interface ValidationMessageProps {
  state: 'valid' | 'error' | 'warning'
  message: string
}

const stateStyles: Record<string, { icon: string; textClass: string; bgClass: string }> = {
  valid: {
    icon: 'ri-checkbox-circle-line',
    textClass: 'text-ready',
    bgClass: 'bg-ready/10',
  },
  error: {
    icon: 'ri-error-warning-line',
    textClass: 'text-danger',
    bgClass: 'bg-danger/20',
  },
  warning: {
    icon: 'ri-alert-line',
    textClass: 'text-progress',
    bgClass: 'bg-progress/10',
  },
}

export default function ValidationMessage({ state, message }: ValidationMessageProps) {
  const s = stateStyles[state]

  return (
    <p className={`text-xs ${s.textClass} flex items-center gap-1 mt-1`}>
      <span className={`w-4 h-4 ${s.bgClass} rounded-full flex items-center justify-center text-xs`}>
        <Icon name={s.icon} className="text-xs" filled />
      </span>
      {message}
    </p>
  )
}
