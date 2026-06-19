import { getSupabase } from '../../config/supabase.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Employee, EmployeeInput, EmployeeRegisterInput } from './employees.types.js'
import * as repo from './employees.repository.js'
import { AppError } from '../../shared/errors/AppError.js'

export async function getAll(client?: SupabaseClient): Promise<Employee[]> {
  const employees = await repo.getEmployees(client)
  const userIds = employees.map((e) => e.user_id)
  const { data: profiles } = userIds.length > 0
    ? await getSupabase().from('profiles').select('id, name, phone').in('id', userIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p])) as Record<string, { name: string; phone: string | null }>
  return employees.map((e) => ({ ...e, profile: profileMap[e.user_id] }))
}

export async function getById(id: string, client?: SupabaseClient): Promise<Employee> {
  const employee = await repo.getEmployee(id, client)
  const { data: profile } = await getSupabase().from('profiles').select('name, phone').eq('id', employee.user_id).maybeSingle()
  return { ...employee, profile: profile ?? undefined }
}

export async function register(input: EmployeeRegisterInput): Promise<Employee> {
  const { email, password, name, role, salary } = input

  const { data: userData, error: userError } = await getSupabase().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (userError) throw new AppError(userError.message, 400)
  if (!userData.user) throw new AppError('No user returned', 500)

  const { error: profileError } = await getSupabase().from('profiles').upsert(
    { id: userData.user.id, name },
    { onConflict: 'id' }
  )
  if (profileError) throw new AppError(profileError.message, 500)

  const { data: employee, error: empError } = await getSupabase()
    .from('employees')
    .insert([{ user_id: userData.user.id, role, salary: salary ?? null, active: true }])
    .select('*')
    .single()
  if (empError) throw new AppError(`Employee creation failed: ${empError.message}`, 500)

  return employee
}

export async function create(input: EmployeeInput, client?: SupabaseClient): Promise<Employee> {
  if (!input.userId || !input.role) throw new AppError('userId and role are required', 400)
  return repo.createEmployee(input, client)
}

export async function update(id: string, input: Partial<EmployeeInput>, client?: SupabaseClient): Promise<Employee> {
  return repo.updateEmployee(id, input, client)
}

export async function remove(id: string, client?: SupabaseClient): Promise<void> {
  await repo.softDeleteEmployee(id, client)
}
