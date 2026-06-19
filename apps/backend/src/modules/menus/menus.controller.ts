import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as menuService from './menus.service.js'

export async function getAll(req: Request, res: Response) {
  const available = req.query.available === 'true'
  const items = await menuService.getAll(available)
  res.json(items)
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id as string
  const item = await menuService.getById(id)
  res.json(item)
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = req.body
  const item = await menuService.create(input, req.userClient)
  res.status(201).json(item)
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const input = req.body
  const item = await menuService.update(id, input, req.userClient)
  res.json(item)
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  await menuService.remove(id, req.userClient)
  res.status(204).end()
}

export async function toggleAvailability(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const item = await menuService.toggleAvailability(id, req.userClient)
  res.json(item)
}
