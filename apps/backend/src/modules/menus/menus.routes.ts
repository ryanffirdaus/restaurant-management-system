import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as controller from './menus.controller.js'

const router = Router()

router.get('/', asyncHandler(controller.getAll))
router.get('/:id', asyncHandler(controller.getById))
router.post('/', requireAdmin, asyncHandler(controller.create))
router.put('/:id', requireAdmin, asyncHandler(controller.update))
router.delete('/:id', requireAdmin, asyncHandler(controller.remove))
router.patch('/:id/availability', requireAdmin, asyncHandler(controller.toggleAvailability))

export default router
