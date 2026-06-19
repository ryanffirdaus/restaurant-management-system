import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { createPaymentIntent, stripeWebhook } from './payments.stripe.js'

const router = Router()

router.post('/create-intent', requireAuth, asyncHandler(createPaymentIntent))

export { stripeWebhook }
export default router
