import type { Response } from 'express'

export function ok<T>(res: Response, data: T, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data })
}

export function created<T>(res: Response, data: T, message = 'Created') {
  return ok(res, data, message, 201)
}

export function noContent(res: Response) {
  return res.status(204).end()
}

export function fail(res: Response, message: string, status = 500, data: unknown = null) {
  return res.status(status).json({ success: false, message, data })
}
