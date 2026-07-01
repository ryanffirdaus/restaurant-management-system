import { Router } from 'express'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as controller from './orders.controller.js'

const router = Router()

router.get('/', requireAuth, asyncHandler(controller.getAll))
router.get('/my', requireAuth, asyncHandler(controller.getMyOrders))
router.get('/:id', requireAuth, asyncHandler(controller.getById))
router.post('/', requireAuth, asyncHandler(controller.create))
router.patch('/:id/status', requireAuth, asyncHandler(controller.updateStatus))
router.patch('/items/:itemId/status', requireAuth, asyncHandler(controller.updateItemStatus))
router.delete('/:id', requireAdmin, asyncHandler(controller.remove))

export default router
