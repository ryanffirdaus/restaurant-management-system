import { Router } from 'express'
import type { Response } from 'express'
import { getEmployees, getEmployee, createEmployee, updateEmployee, softDeleteEmployee } from '../lib/db/employee.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { EmployeeInput } from '../types/employee.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.get('/', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const employees = await getEmployees(req.userClient)
  res.json(employees)
}))

router.get('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const employee = await getEmployee(id, req.userClient)
  res.json(employee)
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
