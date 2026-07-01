import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok, created, noContent } from '../../shared/utils/response.js'
import * as menuService from './menus.service.js'

export async function getAll(req: Request, res: Response) {
  const available = req.query.available === 'true'
  const items = await menuService.getAll(available)
  ok(res, items, 'Menu items fetched')
}

export async function getById(req: Request, res: Response) {
  const item = await menuService.getById(req.params.id as string)
  ok(res, item, 'Menu item fetched')
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const item = await menuService.create(req.body, req.userClient)
  created(res, item, 'Menu item created')
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const item = await menuService.update(req.params.id as string, req.body, req.userClient)
  ok(res, item, 'Menu item updated')
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await menuService.remove(req.params.id as string, req.userClient)
  noContent(res)
}

export async function toggleAvailability(req: AuthenticatedRequest, res: Response) {
  const item = await menuService.toggleAvailability(req.params.id as string, req.userClient)
  ok(res, item, 'Menu item availability toggled')
}
