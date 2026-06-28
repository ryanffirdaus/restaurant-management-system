import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as paymentService from './payments.service.js'

export async function getAll(req: AuthenticatedRequest, res: Response) {
  const payments = await paymentService.getAll(req.userClient)
  res.json(payments)
}

export async function getByOrder(req: AuthenticatedRequest, res: Response) {
  const orderId = req.params.orderId as string
  const payments = await paymentService.getByOrder(orderId, req.userClient)
  res.json(payments)
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const orderId = req.params.orderId as string
  const input = req.body
  const order = await paymentService.create(orderId, input, req.userId!, req.userClient)
  res.json(order)
}
