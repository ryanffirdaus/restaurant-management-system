import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { getChannels, createPayment, midtransWebhook } from './payments.midtrans.js'

const router = Router()

router.get('/channels', requireAuth, asyncHandler(getChannels))
router.post('/payment', requireAuth, asyncHandler(createPayment))
// No auth — verified via Midtrans signature_key inside the handler
router.post('/webhook', asyncHandler(midtransWebhook))

export default router
