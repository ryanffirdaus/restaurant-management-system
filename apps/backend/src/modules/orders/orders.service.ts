import type { SupabaseClient } from '@supabase/supabase-js'
import type { Order, OrderInput } from './orders.types.js'
import * as repo from './orders.repository.js'
import { AppError } from '../../shared/errors/AppError.js'

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled']

export async function getAll(client?: SupabaseClient): Promise<Order[]> {
  return repo.getOrders(client)
}

export async function getByUser(userId: string, client?: SupabaseClient): Promise<Order[]> {
  const orders = await repo.getOrders(client)
  return orders.filter((o) => o.user_id === userId)
}

export async function getById(id: string, client?: SupabaseClient): Promise<Order> {
  return repo.getOrder(id, client)
}

export async function create(input: OrderInput, client?: SupabaseClient): Promise<Order> {
  if (!input.userId || !input.items || input.items.length === 0) {
    throw new AppError('userId and at least one item required', 400)
  }
  return repo.createOrder(input, client)
}

export async function updateStatus(id: string, status: string, client?: SupabaseClient): Promise<Order> {
  if (!VALID_STATUSES.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400)
  }
  return repo.updateOrderStatus(id, status, client)
}

export async function remove(id: string, client?: SupabaseClient): Promise<void> {
  await repo.softDeleteOrder(id, client)
}
