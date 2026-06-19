import { Router } from 'express'
import { requireAdmin } from '../../middleware/auth.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as controller from './employees.controller.js'

const router = Router()

router.post('/register', requireAdmin, asyncHandler(controller.register))
router.get('/', requireAdmin, asyncHandler(controller.getAll))
router.get('/:id', requireAdmin, asyncHandler(controller.getById))
router.post('/', requireAdmin, asyncHandler(controller.create))
router.put('/:id', requireAdmin, asyncHandler(controller.update))
router.delete('/:id', requireAdmin, asyncHandler(controller.remove))

export default router
