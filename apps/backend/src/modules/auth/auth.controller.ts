import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as authService from './auth.service.js'

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  const result = await authService.login({ email, password })
  res.json(result)
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  await authService.logout(req.userId!)
  res.json({ message: 'Logged out successfully' })
}

export async function me(req: AuthenticatedRequest, res: Response) {
  const result = await authService.getMe(req.userId!)
  res.json({ ...result, role: req.userRole })
}
