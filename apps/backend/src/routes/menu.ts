import { Router } from 'express'
import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import { getMenuItems, getAvailableMenuItems, getMenuItem, createMenuItem, updateMenuItem, softDeleteMenuItem, toggleMenuItemAvailability } from '../lib/db/menu.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { MenuItemInput } from '../types/menu.js'
import { requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.get('/', asyncHandler(async (_req, res: Response) => {
  const available = _req.query.available === 'true'
  const items = available
    ? await getAvailableMenuItems(supabase)
    : await getMenuItems(supabase)
  res.json(items)
}))

router.get('/:id', asyncHandler(async (req, res: Response) => {
  const id = req.params.id as string
  const item = await getMenuItem(id, supabase)
  res.json(item)
}))

router.post('/', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { name, price } = req.body as MenuItemInput
  if (!name || price === undefined || price < 0) {
    return res.status(400).json({ error: 'Name and valid price are required' })
  }
  const item = await createMenuItem(req.body as MenuItemInput, req.userClient)
  res.status(201).json(item)
}))

router.put('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const input = req.body as Partial<MenuItemInput>
  if (input.price !== undefined && input.price < 0) {
    return res.status(400).json({ error: 'Price must be >= 0' })
  }
  const item = await updateMenuItem(id, input, req.userClient)
  res.json(item)
}))

router.delete('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  await softDeleteMenuItem(id, req.userClient)
  res.status(204).end()
}))

router.patch('/:id/availability', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const item = await toggleMenuItemAvailability(id, req.userClient)
  res.json(item)
}))

export default router
