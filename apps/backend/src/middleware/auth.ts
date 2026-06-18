import type { Response, NextFunction } from 'express'
import { supabase, createUserClient } from '../config/supabase.js'
import type { AuthenticatedRequest } from '../types/auth.js'

async function resolveUser(req: AuthenticatedRequest, token: string) {
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return false

  req.userId = data.user.id
  req.userRole = data.user.user_metadata?.role ?? data.user.role ?? undefined
  req.userToken = token
  req.userClient = createUserClient(token)
  return true
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const ok = await resolveUser(req, header.slice(7))
  if (!ok) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  next()
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next()
    return
  }

  await resolveUser(req, header.slice(7))
  next()
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const ok = await resolveUser(req, header.slice(7))
  if (!ok) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}
