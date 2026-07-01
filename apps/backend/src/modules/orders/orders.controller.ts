import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok, created, noContent } from '../../shared/utils/response.js'
import * as orderService from './orders.service.js'

export async function getAll(req: AuthenticatedRequest, res: Response) {
  // Use service-role client (no arg) so Supabase RLS does not filter by user_id
  const orders = await orderService.getAll()
  ok(res, orders, 'Orders fetched')
}

export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
  const orders = await orderService.getByUser(req.userId!, req.userClient)
  ok(res, orders, 'Orders fetched')
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const order = await orderService.getById(req.params.id as string)
  ok(res, order, 'Order fetched')
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const order = await orderService.create(req.body, req.userClient)
  created(res, order, 'Order created')
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  // No userClient — use service role so any authenticated user (kitchen, waiter)
  // can update status regardless of who created the order (RLS would block cross-user updates)
  const order = await orderService.updateStatus(req.params.id as string, req.body.status)
  ok(res, order, 'Order status updated')
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  await orderService.remove(req.params.id as string, req.userClient)
  noContent(res)
}
