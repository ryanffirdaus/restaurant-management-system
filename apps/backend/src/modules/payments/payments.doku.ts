import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { getSupabase } from '../../config/supabase.js'
import { DOKU_BASE_URL, DOKU_CLIENT_ID, buildDokuHeaders, verifyDokuWebhook } from '../../config/doku.js'
import { AppError } from '../../shared/errors/AppError.js'
import { ok } from '../../shared/utils/response.js'

const CHECKOUT_PATH = '/checkout/v1/payment'
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:18327'

// POST /api/doku/checkout  { orderId }
export async function createCheckout(req: AuthenticatedRequest, res: Response) {
  const { orderId } = req.body
  if (!orderId) throw new AppError('orderId is required', 400)

  if (!DOKU_CLIENT_ID) {
    throw new AppError('DOKU is not configured on this server. Set DOKU_CLIENT_ID and DOKU_SECRET_KEY.', 503)
  }

  const { data: order, error } = await getSupabase()
    .from('orders')
    .select('id, total_price, status, paid_at')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (error || !order) throw new AppError('Order not found', 404)
  if (order.paid_at) throw new AppError('Order already paid', 400)
  if (!order.total_price || order.total_price <= 0) throw new AppError('Invalid order total', 400)

  // DOKU amount in IDR (integer, no decimal)
  const amount = Math.round(Number(order.total_price))

  const body = {
    order: {
      invoice_number: `INV-${orderId.slice(0, 8).toUpperCase()}`,
      line_items: [
        { name: 'Restaurant Order', price: amount, quantity: 1 },
      ],
      amount,
      currency: 'IDR',
      callback_url: `${FRONTEND_URL}/cashier`,
      auto_redirect: false,
    },
    payment: {
      payment_due_date: 60, // minutes
    },
  }

  const headers = buildDokuHeaders('POST', CHECKOUT_PATH, body)

  const dokuRes = await fetch(`${DOKU_BASE_URL}${CHECKOUT_PATH}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const dokuData = await dokuRes.json() as any
  if (!dokuRes.ok || !dokuData?.response?.payment?.url) {
    throw new AppError(dokuData?.error?.message ?? 'DOKU checkout creation failed', 502)
  }

  const checkoutUrl: string = dokuData.response.payment.url
  const invoiceNumber: string = body.order.invoice_number

  // Record pending payment
  await getSupabase().from('payments').insert({
    order_id: orderId,
    amount,
    method: 'other',
    reference_id: invoiceNumber,
    cashier_id: req.userId!,
    paid_at: null,
  })

  ok(res, { checkoutUrl, invoiceNumber }, 'Checkout created')
}

// POST /api/doku/webhook  (raw body, verified with HMAC)
export async function dokuWebhook(req: Request, res: Response) {
  const rawBody = (req as any).rawBody as string ?? ''

  if (!verifyDokuWebhook(req.headers as Record<string, string | undefined>, rawBody)) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  let payload: any
  try { payload = JSON.parse(rawBody) } catch { return res.status(400).json({ error: 'Invalid JSON' }) }

  const status: string = payload?.transaction?.status ?? ''
  const invoiceNumber: string = payload?.order?.invoice_number ?? ''
  const amount: number = payload?.order?.amount ?? 0

  if (status !== 'SUCCESS' || !invoiceNumber) {
    return res.json({ received: true })
  }

  const { data: payment } = await getSupabase()
    .from('payments')
    .select('id, order_id')
    .eq('reference_id', invoiceNumber)
    .is('paid_at', null)
    .single()

  if (!payment) return res.json({ received: true })

  await getSupabase()
    .from('payments')
    .update({ paid_at: new Date().toISOString(), amount })
    .eq('id', payment.id)

  const { data: order } = await getSupabase()
    .from('orders')
    .select('total_price')
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

  return res.json({ received: true })
}
