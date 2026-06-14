import { Router } from 'express'
import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import { getTables, getTable, createTable, updateTable, updateTableStatus, softDeleteTable } from '../lib/db/table.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { TableInput } from '../types/table.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.get('/', asyncHandler(async (_req, res: Response) => {
  const tables = await getTables(supabase)
  res.json(tables)
}))

router.get('/:id', asyncHandler(async (req, res: Response) => {
  const id = req.params.id as string
  const table = await getTable(id, supabase)
  res.json(table)
}))

router.post('/', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as TableInput
  if (!input.tableNumber) {
    return res.status(400).json({ error: 'tableNumber is required' })
  }
  const table = await createTable(input, req.userClient)
  res.status(201).json(table)
}))

router.put('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const input = req.body as Partial<TableInput>
  const table = await updateTable(id, input, req.userClient)
  res.json(table)
}))

router.patch('/:id/status', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const { status } = req.body as { status: string }
  const table = await updateTableStatus(id, status, req.userClient)
  res.json(table)
}))

router.delete('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  await softDeleteTable(id, req.userClient)
  res.status(204).end()
}))

export default router
