// Single source of truth for status colors. Every app (admin, waiter,
// kitchen, cashier) must render the same status with the same color, icon
// and label so staff learn it once. Never rely on color alone.

export type Tone = 'pending' | 'progress' | 'ready' | 'reserved' | 'danger' | 'neutral'

export interface ToneClasses {
  /** Foreground text/icon color */
  text: string
  /** Solid fill for dots, bars, progress */
  solid: string
  /** Low-emphasis tinted background for chips and cards */
  soft: string
  /** Border matching the tone */
  border: string
}

export const tones: Record<Tone, ToneClasses> = {
  pending: { text: 'text-pending', solid: 'bg-pending', soft: 'bg-pending/10', border: 'border-pending/40' },
  progress: { text: 'text-progress', solid: 'bg-progress', soft: 'bg-progress/10', border: 'border-progress/40' },
  ready: { text: 'text-ready', solid: 'bg-ready', soft: 'bg-ready/10', border: 'border-ready/40' },
  reserved: { text: 'text-reserved', solid: 'bg-reserved', soft: 'bg-reserved/10', border: 'border-reserved/40' },
  danger: { text: 'text-danger', solid: 'bg-danger', soft: 'bg-danger/10', border: 'border-danger/40' },
  neutral: { text: 'text-ink-2', solid: 'bg-ink-3', soft: 'bg-raised', border: 'border-line' },
}

export interface StatusMeta {
  tone: Tone
  label: string
  icon: string
}

export const orderStatus: Record<string, StatusMeta> = {
  pending: { tone: 'pending', label: 'Pending', icon: 'ri-time-line' },
  preparing: { tone: 'progress', label: 'Preparing', icon: 'ri-fire-line' },
  ready: { tone: 'ready', label: 'Ready', icon: 'ri-checkbox-circle-line' },
  completed: { tone: 'neutral', label: 'Completed', icon: 'ri-check-double-line' },
  cancelled: { tone: 'danger', label: 'Cancelled', icon: 'ri-close-circle-line' },
}

export const itemStatus: Record<string, StatusMeta> = {
  pending: { tone: 'pending', label: 'Queued', icon: 'ri-time-line' },
  preparing: { tone: 'progress', label: 'Cooking', icon: 'ri-fire-line' },
  ready: { tone: 'ready', label: 'Ready', icon: 'ri-checkbox-circle-line' },
}

export const tableStatus: Record<string, StatusMeta> = {
  available: { tone: 'ready', label: 'Available', icon: 'ri-checkbox-blank-circle-line' },
  occupied: { tone: 'progress', label: 'Occupied', icon: 'ri-group-line' },
  reserved: { tone: 'reserved', label: 'Reserved', icon: 'ri-calendar-event-line' },
  cleaning: { tone: 'neutral', label: 'Cleaning', icon: 'ri-brush-line' },
}

const fallback: StatusMeta = { tone: 'neutral', label: 'Unknown', icon: 'ri-question-line' }

export function statusMeta(map: Record<string, StatusMeta>, status: string | null | undefined): StatusMeta {
  if (!status) return fallback
  return map[status.toLowerCase()] ?? { ...fallback, label: status }
}

/** Kitchen ticket age: under 10 min fine, 10–20 warn, over 20 late. */
export function ageTone(minutes: number): Tone {
  if (minutes < 10) return 'neutral'
  if (minutes < 20) return 'progress'
  return 'danger'
}
