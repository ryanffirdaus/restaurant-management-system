import type { Request, Response } from 'express'
import { getSupabase } from '../../config/supabase.js'
import { getStripe, getWebhookSecret } from '../../config/stripe.js'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { AppError } from '../../shared/errors/AppError.js'

export async function createPaymentIntent(req: AuthenticatedRequest, res: Response) {
  const { orderId } = req.body
  if (!orderId) throw new AppError('orderId is required', 400)

  const { data: order, error: orderError } = await getSupabase()
    .from('orders')
    .select('id, total_price, status, paid_at')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (orderError || !order) throw new AppError('Order not found', 404)
  if (order.paid_at) throw new AppError('Order already paid', 400)
  if (!order.total_price || order.total_price <= 0) throw new AppError('Invalid order total', 400)

  const amountInCents = Math.round(Number(order.total_price) * 100)

  const stripe = getStripe()
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'idr',
    metadata: { order_id: orderId },
  })

  const { error: insertError } = await getSupabase()
    .from('payments')
    .insert({
      order_id: orderId,
      amount: order.total_price,
      method: 'credit_card',
      reference_id: paymentIntent.id,
      cashier_id: req.userId!,
      paid_at: null,
    })

  if (insertError) {
    await stripe.paymentIntents.cancel(paymentIntent.id)
    throw new AppError('Failed to record payment', 500)
  }

  res.json({ clientSecret: paymentIntent.client_secret })
}

export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string | undefined
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature header' })

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(req.body, sig, getWebhookSecret())
  } catch {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as any
    const paymentIntentId = pi.id

    const { data: payment } = await getSupabase()
      .from('payments')
      .select('id, order_id, amount')
      .eq('reference_id', paymentIntentId)
      .is('paid_at', null)
      .single()

    if (!payment) return res.status(404).json({ error: 'Payment record not found' })

    await getSupabase().from('payments').update({ paid_at: new Date().toISOString() }).eq('id', payment.id)

    const { data: order } = await getSupabase()
      .from('orders')
      .select('id, total_price')
      .eq('id', payment.order_id)
      .single()

    const { data: allPayments } = await getSupabase()
      .from('payments')
      .select('amount')
      .eq('order_id', payment.order_id)
      .not('paid_at', 'is', null)

    const sumPaid = (allPayments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0)

    if (order && sumPaid >= Number(order.total_price)) {
      await getSupabase()
        .from('orders')
        .update({ paid_at: new Date().toISOString(), status: 'completed' })
        .eq('id', payment.order_id)
    }
  }

  res.json({ received: true })
}
