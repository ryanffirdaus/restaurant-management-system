import type { Profile } from './profile.js'

export type EmployeeRole = 'admin' | 'manager' | 'chef' | 'cashier' | 'waiter'

export interface Employee {
  id: string
  user_id: string
  role: EmployeeRole
  salary: number | null
  hire_date: string
  active: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
  profile?: Pick<Profile, 'name' | 'phone'>
}

export interface EmployeeInput {
  userId: string
  role: EmployeeRole
  salary?: number
  hireDate?: string
}
