import { Router } from 'express'
import type { Response } from 'express'
import { getOrders, getOrder, createOrder, updateOrderStatus, softDeleteOrder } from '../lib/db/order.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { OrderInput } from '../types/order.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled']

router.get('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await getOrders(req.userClient)
  res.json(orders)
}))

router.get('/my', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await getOrders(req.userClient)
  res.json(orders.filter((o) => o.user_id === req.userId))
}))

router.get('/:id', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const order = await getOrder(id, req.userClient)
  res.json(order)
}))

router.post('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as OrderInput
  if (!input.userId || !input.items || input.items.length === 0) {
    return res.status(400).json({ error: 'userId and at least one item required' })
  }
  const order = await createOrder(input, req.userClient)
  res.status(201).json(order)
}))

router.patch('/:id/status', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  const { status } = req.body as { status: string }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
  }
  const order = await updateOrderStatus(id, status, req.userClient)
  res.json(order)
}))

router.delete('/:id', requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id as string
  await softDeleteOrder(id, req.userClient)
  res.status(204).end()
}))

export default router
