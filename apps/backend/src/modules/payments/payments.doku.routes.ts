import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { createCheckout, dokuWebhook } from './payments.doku.js'

const router = Router()

router.post('/checkout', requireAuth, asyncHandler(createCheckout))

export { dokuWebhook }
export default router
