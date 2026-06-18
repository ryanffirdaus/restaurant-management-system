import { Router } from 'express'
import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import { getEmployees, getEmployee, createEmployee, updateEmployee, softDeleteEmployee } from '../lib/db/employee.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { EmployeeInput } from '../types/employee.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.post('/register', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role, salary } = req.body
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, and role are required' })
  }

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })
  if (userError) {
    return res.status(400).json({ error: userError.message })
  }
  if (!userData.user) {
    return res.status(500).json({ error: 'No user returned' })
  }

  await supabase.from('profiles').upsert(
    { id: userData.user.id, name },
    { onConflict: 'id' }
  )

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .insert([{ user_id: userData.user.id, role, salary: salary ?? null, active: true }])
    .select('*')
    .single()

  if (empError) {
    return res.status(500).json({ error: `Employee creation failed: ${empError.message}` })
  }

  res.status(201).json(employee)
}))

router.get('/', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employees = await getEmployees(req.userClient)
  const userIds = employees.map((e) => e.user_id)
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, name, phone').in('id', userIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))
  const result = employees.map((e) => ({ ...e, profile: profileMap[e.user_id] ?? null }))
  res.json(result)
}))

router.get('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const employee = await getEmployee(id, req.userClient)
  const { data: profile } = await supabase.from('profiles').select('name, phone').eq('id', employee.user_id).maybeSingle()
  res.json({ ...employee, profile: profile ?? null })
}))

router.post('/', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as EmployeeInput
  if (!input.userId || !input.role) {
    return res.status(400).json({ error: 'userId and role are required' })
  }
  const employee = await createEmployee(input, req.userClient)
  res.status(201).json(employee)
}))

router.put('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const input = req.body as Partial<EmployeeInput>
  const employee = await updateEmployee(id, input, req.userClient)
  res.json(employee)
}))

router.delete('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  await softDeleteEmployee(id, req.userClient)
  res.status(204).end()
}))

export default router
