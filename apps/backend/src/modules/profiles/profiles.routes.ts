import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as controller from './profiles.controller.js'

const router = Router()

router.get('/me', requireAuth, asyncHandler(controller.getMyProfile))
router.put('/me', requireAuth, asyncHandler(controller.updateMyProfile))
router.get('/:id', asyncHandler(controller.getById))

export default router
