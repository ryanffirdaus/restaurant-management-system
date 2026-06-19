import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as controller from './auth.controller.js'

const router = Router()

router.post('/login', asyncHandler(controller.login))
router.post('/logout', requireAuth, asyncHandler(controller.logout))
router.get('/me', requireAuth, asyncHandler(controller.me))

export default router
