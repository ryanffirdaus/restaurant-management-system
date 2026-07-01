import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { ok } from '../../shared/utils/response.js'
import * as profileService from './profiles.service.js'

export async function getMyProfile(req: AuthenticatedRequest, res: Response) {
  const profile = await profileService.getById(req.userId!)
  ok(res, profile, 'Profile fetched')
}

export async function updateMyProfile(req: AuthenticatedRequest, res: Response) {
  const profile = await profileService.update(req.userId!, req.body, req.userClient)
  ok(res, profile, 'Profile updated')
}

export async function getById(req: Request, res: Response) {
  const profile = await profileService.getById(req.params.id as string)
  ok(res, profile, 'Profile fetched')
}
