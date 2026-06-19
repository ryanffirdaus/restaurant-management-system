import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as profileService from './profiles.service.js'

export async function getMyProfile(req: AuthenticatedRequest, res: Response) {
  const profile = await profileService.getById(req.userId!)
  res.json(profile)
}

export async function updateMyProfile(req: AuthenticatedRequest, res: Response) {
  const input = req.body
  const profile = await profileService.update(req.userId!, input, req.userClient)
  res.json(profile)
}

export async function getById(req: Request, res: Response) {
  const id = req.params.id as string
  const profile = await profileService.getById(id)
  res.json(profile)
}
