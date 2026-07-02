import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok } from '../../shared/utils/response.js'
import * as paymentService from './payments.service.js'

export async function getAll(req: AuthenticatedRequest, res: Response) {
  // Use service-role (no client arg) to bypass RLS and get all payments
  const payments = await paymentService.getAll()
  ok(res, payments, 'Payments fetched')
}

export async function getByOrder(req: AuthenticatedRequest, res: Response) {
  const payments = await paymentService.getByOrder(req.params.orderId as string, req.userClient)
  ok(res, payments, 'Payments fetched')
}

export async function create(req: AuthenticatedRequest, res: Response) {
  // Service role (no userClient) — cashier settles orders created by other staff,
  // so RLS must be bypassed for the order-completion update.
  const order = await paymentService.create(
    req.params.orderId as string,
    req.body,
    req.userId!,
  )
  ok(res, order, 'Payment processed')
}
