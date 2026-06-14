import { Router } from 'express'
import type { Response } from 'express'
import { supabase } from '../config/supabase.js'
import { getProfile, updateProfile } from '../lib/db/profile.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import type { ProfileInput } from '../types/profile.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.get('/me', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const profile = await getProfile(req.userId!, supabase)
  res.json(profile)
}))

router.put('/me', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const input = req.body as ProfileInput
  const profile = await updateProfile(req.userId!, input, req.userClient)
  res.json(profile)
}))

router.get('/:id', asyncHandler(async (req, res: Response) => {
  const id = req.params.id as string
  const profile = await getProfile(id, supabase)
  res.json(profile)
}))

export default router
