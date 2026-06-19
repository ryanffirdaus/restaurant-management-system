export type EmployeeRole = 'admin' | 'waiter' | 'kitchen' | 'cashier'

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
  profile?: { name: string; phone: string | null } | null
}

export interface EmployeeInput {
  userId: string
  role: EmployeeRole
  salary?: number
  hireDate?: string
}

export interface EmployeeRegisterInput {
  email: string
  password: string
  name: string
  role: EmployeeRole
  salary?: number
}
