import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as employeeService from './employees.service.js'

export async function register(req: AuthenticatedRequest, res: Response) {
  const { email, password, name, role, salary } = req.body
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'email, password, name, and role are required' })
  }
  const employee = await employeeService.register({ email, password, name, role, salary })
  res.status(201).json(employee)
}

export async function getAll(req: AuthenticatedRequest, res: Response) {
  const employees = await employeeService.getAll(req.userClient)
  res.json(employees)
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const employee = await employeeService.getById(id, req.userClient)
  res.json(employee)
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = req.body
  const employee = await employeeService.create(input, req.userClient)
  res.status(201).json(employee)
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const input = req.body
  const employee = await employeeService.update(id, input, req.userClient)
  res.json(employee)
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  await employeeService.remove(id, req.userClient)
  res.status(204).end()
}
