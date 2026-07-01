import type { Response, NextFunction } from 'express'
import { getSupabase, createUserClient } from '../config/supabase.js'
import type { AuthenticatedRequest } from '../shared/types/auth.js'

async function resolveUser(req: AuthenticatedRequest, token: string) {
  const { data, error } = await getSupabase().auth.getUser(token)
  if (error || !data.user) return false

  req.userId = data.user.id
  req.userRole = data.user.user_metadata?.role ?? data.user.role ?? undefined
  req.userToken = token
  req.userClient = createUserClient(token)
  return true
}

function unauthorized(res: Response, message = 'Missing or invalid authorization header') {
  return res.status(401).json({ success: false, message, data: null })
}

function forbidden(res: Response, message = 'Forbidden') {
  return res.status(403).json({ success: false, message, data: null })
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return unauthorized(res)

  const ok = await resolveUser(req, header.slice(7))
  if (!ok) return unauthorized(res, 'Invalid or expired token')

  next()
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) await resolveUser(req, header.slice(7))
  next()
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return unauthorized(res)

  const ok = await resolveUser(req, header.slice(7))
  if (!ok) return unauthorized(res, 'Invalid or expired token')
  if (req.userRole !== 'admin') return forbidden(res, 'Admin access required')

  next()
}
