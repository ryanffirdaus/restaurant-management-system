import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as controller from './payments.controller.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(controller.getAll))
router.get('/order/:orderId', requireAuth, asyncHandler(controller.getByOrder))
router.post('/order/:orderId', requireAuth, asyncHandler(controller.create))

export default router
