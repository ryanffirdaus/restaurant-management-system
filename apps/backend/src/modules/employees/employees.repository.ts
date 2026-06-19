import { db, now } from '../../shared/utils/db.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Employee, EmployeeInput } from './employees.types.js'

export async function getEmployees(client?: SupabaseClient): Promise<Employee[]> {
  const { data, error } = await db(client)
    .from('employees')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getEmployee(id: string, client?: SupabaseClient): Promise<Employee> {
  const { data, error } = await db(client)
    .from('employees')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data
}

export async function createEmployee(input: EmployeeInput, client?: SupabaseClient): Promise<Employee> {
  const { data, error } = await db(client)
    .from('employees')
    .insert([{
      user_id: input.userId,
      role: input.role,
      salary: input.salary ?? null,
      hire_date: input.hireDate ?? new Date().toISOString().split('T')[0],
    }])
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>, client?: SupabaseClient): Promise<Employee> {
  const { data, error } = await db(client)
    .from('employees')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function softDeleteEmployee(id: string, client?: SupabaseClient): Promise<void> {
  const { error } = await db(client)
    .from('employees')
    .update({ deleted_at: now() })
    .eq('id', id)
  if (error) throw error
}
