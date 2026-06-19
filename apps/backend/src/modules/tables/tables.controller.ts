import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as tableService from './tables.service.js'

export async function getAll(_req: Request, res: Response) {
  const tables = await tableService.getAll()
  res.json(tables)
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id as string
  const table = await tableService.getById(id)
  res.json(table)
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = req.body
  const table = await tableService.create(input, req.userClient)
  res.status(201).json(table)
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const input = req.body
  const table = await tableService.update(id, input, req.userClient)
  res.json(table)
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const { status } = req.body
  const table = await tableService.updateStatus(id, status, req.userClient)
  res.json(table)
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  await tableService.remove(id, req.userClient)
  res.status(204).end()
}
