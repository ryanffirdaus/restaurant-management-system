import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/errors/AppError.js'

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
    })
  }
  console.error('[ERROR]', err.message, err.stack)
  return res.status(500).json({
    success: false,
    message: err.message ?? 'Internal server error',
    data: null,
  })
}
