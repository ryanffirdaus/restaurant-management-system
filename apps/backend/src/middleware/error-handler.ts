import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/errors/AppError.js'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }
  console.error('[ERROR]', err.message)
  res.status(500).json({ error: err.message })
}
