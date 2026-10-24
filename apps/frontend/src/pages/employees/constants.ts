import type { FormData } from './types'

export const emptyForm: FormData = { email: '', password: '', name: '', role: 'waiter', salary: '' }

export const roles = ['admin', 'waiter', 'kitchen', 'cashier']

export const roleOptions = roles.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))

export const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export const roleFilterOptions = [
  { value: 'all', label: 'All Roles' },
  ...roleOptions,
]

// Roles are identity, not status — keep them neutral so status colors stay meaningful.
export const roleVariant: Record<string, 'neutral'> = {
  admin: 'neutral',
  kitchen: 'neutral',
  cashier: 'neutral',
  waiter: 'neutral',
}
