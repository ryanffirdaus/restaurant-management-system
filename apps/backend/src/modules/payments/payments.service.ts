import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payment, PaymentInput, PaymentMethod } from './payments.types.js'
import type { Order } from '../orders/orders.types.js'
import * as repo from './payments.repository.js'
import { AppError } from '../../shared/errors/AppError.js'

const VALID_METHODS: PaymentMethod[] = ['cash', 'debit_card', 'credit_card', 'qris', 'other']

export async function getAll(client?: SupabaseClient): Promise<Payment[]> {
  return repo.getAllPayments(client)
}

export async function getByOrder(orderId: string, client?: SupabaseClient): Promise<Payment[]> {
  return repo.getPaymentsByOrder(orderId, client)
}

export async function create(orderId: string, input: PaymentInput, cashierId: string, client?: SupabaseClient): Promise<Order> {
  if (!input.amount || input.amount <= 0) {
    throw new AppError('Amount must be greater than 0', 400)
  }
  if (!input.method || !VALID_METHODS.includes(input.method)) {
    throw new AppError('Valid payment method is required', 400)
  }
  return repo.createPayment(orderId, input, cashierId, client)
}
