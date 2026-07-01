import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok, fail } from '../../shared/utils/response.js'
import * as authService from './auth.service.js'

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body
  if (!email || !password) {
    return fail(res, 'Email and password are required', 400)
  }
  const result = await authService.login({ email, password })
  ok(res, result, 'Login successful')
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  await authService.logout(req.userId!)
  ok(res, null, 'Logged out successfully')
}

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return fail(res, 'User not authenticated', 401)
  }
  const result = await authService.getMe(req.userId)
  ok(res, { ...result, role: req.userRole }, 'User fetched')
}
