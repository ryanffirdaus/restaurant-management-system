import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase.js'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userRole?: string
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = header.slice(7)

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  req.userId = data.user.id
  req.userRole = data.user.role
  next()
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }

  const token = header.slice(7)
  const { data } = await supabase.auth.getUser(token)
  if (data.user) {
    req.userId = data.user.id
    req.userRole = data.user.role
  }
  next()
}
