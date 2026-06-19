import type { Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import * as orderService from './orders.service.js'

export async function getAll(req: AuthenticatedRequest, res: Response) {
  const orders = await orderService.getAll(req.userClient)
  res.json(orders)
}

export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
  const orders = await orderService.getByUser(req.userId!, req.userClient)
  res.json(orders)
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const order = await orderService.getById(id, req.userClient)
  res.json(order)
}

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = req.body
  const order = await orderService.create(input, req.userClient)
  res.status(201).json(order)
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  const { status } = req.body
  const order = await orderService.updateStatus(id, status, req.userClient)
  res.json(order)
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  const id = req.params.id as string
  await orderService.remove(id, req.userClient)
  res.status(204).end()
}
