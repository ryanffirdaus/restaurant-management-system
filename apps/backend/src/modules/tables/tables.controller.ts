import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok, created, noContent } from '../../shared/utils/response.js'
import * as tableService from './tables.service.js'

export async function getAll(_req: Request, res: Response) {
  const tables = await tableService.getAll()
  ok(res, tables, 'Tables fetched')
}

export async function getById(req: Request, res: Response) {
  const table = await tableService.getById(req.params.id as string)
  ok(res, table, 'Table fetched')
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const table = await tableService.create(req.body, req.userClient)
  created(res, table, 'Table created')
}

export async function update(req: AuthenticatedRequest, res: Response) {
  const table = await tableService.update(req.params.id as string, req.body, req.userClient)
  ok(res, table, 'Table updated')
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  const table = await tableService.updateStatus(req.params.id as string, req.body.status, req.userClient)
  ok(res, table, 'Table status updated')
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await tableService.remove(req.params.id as string, req.userClient)
  noContent(res)
}
