export interface Employee {
  id: string
  user_id: string
  role: string
  salary: number | null
  hire_date: string
  active: boolean
  profile?: { name: string; phone: string | null } | null
}

export interface FormData {
  email: string
  password: string
  name: string
  role: string
  salary: string
}

export type SortKey = 'name' | 'role' | 'salary' | 'hire_date' | 'active'
