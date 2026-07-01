import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok, created, noContent, fail } from '../../shared/utils/response.js'
import * as employeeService from './employees.service.js'

export async function register(req: AuthenticatedRequest, res: Response) {
  const { email, password, name, role, salary } = req.body
  if (!email || !password || !name || !role) {
    return fail(res, 'email, password, name, and role are required', 400)
  }
  const employee = await employeeService.register({ email, password, name, role, salary })
  created(res, employee, 'Employee registered')
}

export async function getAll(req: AuthenticatedRequest, res: Response) {
  const employees = await employeeService.getAll(req.userClient)
  ok(res, employees, 'Employees fetched')
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const employee = await employeeService.getById(req.params.id as string, req.userClient)
  ok(res, employee, 'Employee fetched')
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const employee = await employeeService.create(req.body, req.userClient)
  created(res, employee, 'Employee created')
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const employee = await employeeService.update(req.params.id as string, req.body, req.userClient)
  ok(res, employee, 'Employee updated')
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await employeeService.remove(req.params.id as string, req.userClient)
  noContent(res)
}
