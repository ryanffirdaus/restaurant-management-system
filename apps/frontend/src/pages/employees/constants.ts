import type { FormData } from './types'

export const emptyForm: FormData = { email: '', password: '', name: '', role: 'waiter', salary: '' }

export const roles = ['admin', 'manager', 'chef', 'cashier', 'waiter']

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

export const roleVariant: Record<string, 'primary' | 'warning' | 'danger' | 'info'> = {
  admin: 'danger',
  manager: 'warning',
  chef: 'info',
  cashier: 'primary',
  waiter: 'primary',
}
