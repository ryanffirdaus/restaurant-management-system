import { Router } from 'express'
import type { Response } from 'express'
import { supabase, supabaseAnon } from '../config/supabase.js'
import type { AuthenticatedRequest } from '../types/auth.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error-handler.js'

const router = Router()

router.post('/login', asyncHandler(async (req, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (error) {
    return res.status(401).json({ error: error.message })
  }

  res.json({
    user: data.user,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
}))

router.post('/logout', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { error } = await supabase.auth.admin.signOut(req.userId!)
  if (error) {
    return res.status(500).json({ error: error.message })
  }
  res.json({ message: 'Logged out successfully' })
}))

router.get('/me', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.userId)
    .single()

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('user_id', req.userId)
    .maybeSingle()

  res.json({
    id: req.userId,
    role: req.userRole,
    profile: profile ?? null,
    employee: employee ?? null,
  })
}))

export default router
