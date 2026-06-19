import { db, now } from '../../shared/utils/db.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Payment, PaymentInput } from './payments.types.js'
import type { Order } from '../orders/orders.types.js'

export async function getPaymentsByOrder(orderId: string, client?: SupabaseClient): Promise<Payment[]> {
  const { data, error } = await db(client)
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('paid_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPayment(
  orderId: string,
  input: PaymentInput,
  cashierId: string,
  client?: SupabaseClient
): Promise<Order> {
  const { data: order, error: orderError } = await db(client)
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()
  if (orderError) throw orderError

  const { error: payError } = await db(client)
    .from('payments')
    .insert([{
      order_id: orderId,
      amount: input.amount,
      method: input.method,
      reference_id: input.referenceId ?? null,
      cashier_id: cashierId,
    }])
    .select()
    .single()
  if (payError) throw payError

  const { data: allPayments } = await db(client)
    .from('payments')
    .select('amount')
    .eq('order_id', orderId)

  const sumPaid = (allPayments ?? []).reduce((s, p) => s + Number(p.amount), 0)

  if (sumPaid >= Number(order.total_price)) {
    const { data: updated, error: updateError } = await db(client)
      .from('orders')
      .update({ paid_at: now(), status: 'completed' })
      .eq('id', orderId)
      .select('*, order_items(*), payments(*)')
      .single()
    if (updateError) throw updateError
    return updated
  }

  const { data: updated, error: updateError } = await db(client)
    .from('orders')
    .select('*, order_items(*), payments(*)')
    .eq('id', orderId)
    .single()
  if (updateError) throw updateError
  return updated
}
