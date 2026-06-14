import { Router } from 'express'
import type { Response } from 'express'
import { getPaymentsByOrder, createPayment } from '../lib/db/payment.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { PaymentInput } from '../types/payment.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.get('/order/:orderId', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.orderId as string
  const payments = await getPaymentsByOrder(orderId, req.userClient)
  res.json(payments)
}))

router.post('/order/:orderId', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orderId = req.params.orderId as string
  const input = req.body as PaymentInput
  if (!input.amount || input.amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' })
  }
  if (!input.method) {
    return res.status(400).json({ error: 'Payment method is required' })
  }
  const order = await createPayment(orderId, input, req.userId!, req.userClient)
  res.json(order)
}))

export default router
