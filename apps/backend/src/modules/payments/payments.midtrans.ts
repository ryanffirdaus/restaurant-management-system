import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../../shared/types/auth.js'
import { getSupabase } from '../../config/supabase.js'
import {
  getMidtransBaseUrl,
  getMidtransAuthHeader,
  isMidtransConfigured,
  verifyMidtransSignature,
} from '../../config/midtrans.js'
import { AppError } from '../../shared/errors/AppError.js'
import { ok } from '../../shared/utils/response.js'

// ---------------------------------------------------------------------------
// Channel registry — every channel here is charged via Midtrans Core API and
// rendered inline in the cashier UI (QR image or payment code, no redirect).
// All verified working on this sandbox account.
// ---------------------------------------------------------------------------
type ChannelGroup = 'qris' | 'ewallet' | 'virtual_account'

interface MidtransChannel {
  id: string
  label: string
  group: ChannelGroup
  kind: 'qr' | 'code'
  icon: string
  instructions: string
  payload: Record<string, unknown>
}

const CHANNELS: MidtransChannel[] = [
  {
    id: 'QRIS', label: 'QRIS', group: 'qris', kind: 'qr', icon: 'ri-qr-code-line',
    instructions: 'Scan with any QRIS app (GoPay, OVO, DANA, ShopeePay, mobile banking)',
    payload: { payment_type: 'qris' },
  },
  {
    id: 'GOPAY', label: 'GoPay', group: 'ewallet', kind: 'qr', icon: 'ri-smartphone-line',
    instructions: 'Scan with the Gojek app',
    payload: { payment_type: 'gopay' },
  },
  {
    id: 'VA_BCA', label: 'BCA Virtual Account', group: 'virtual_account', kind: 'code', icon: 'ri-bank-line',
    instructions: 'Transfer to this virtual account number via BCA mobile/ATM',
    payload: { payment_type: 'bank_transfer', bank_transfer: { bank: 'bca' } },
  },
  {
    id: 'VA_BNI', label: 'BNI Virtual Account', group: 'virtual_account', kind: 'code', icon: 'ri-bank-line',
    instructions: 'Transfer to this virtual account number via BNI mobile/ATM',
    payload: { payment_type: 'bank_transfer', bank_transfer: { bank: 'bni' } },
  },
  {
    id: 'VA_BRI', label: 'BRI Virtual Account', group: 'virtual_account', kind: 'code', icon: 'ri-bank-line',
    instructions: 'Transfer to this virtual account number via BRImo/ATM',
    payload: { payment_type: 'bank_transfer', bank_transfer: { bank: 'bri' } },
  },
  {
    id: 'VA_CIMB', label: 'CIMB Virtual Account', group: 'virtual_account', kind: 'code', icon: 'ri-bank-line',
    instructions: 'Transfer to this virtual account number via OCTO mobile/ATM',
    payload: { payment_type: 'bank_transfer', bank_transfer: { bank: 'cimb' } },
  },
  {
    id: 'VA_PERMATA', label: 'Permata Virtual Account', group: 'virtual_account', kind: 'code', icon: 'ri-bank-line',
    instructions: 'Transfer to this virtual account number via PermataMobile/ATM',
    payload: { payment_type: 'permata' },
  },
  {
    id: 'MANDIRI_BILL', label: 'Mandiri Bill Payment', group: 'virtual_account', kind: 'code', icon: 'ri-bank-line',
    instructions: 'Pay via Livin by Mandiri / ATM — company code + bill key below',
    payload: { payment_type: 'echannel', echannel: { bill_info1: 'Payment', bill_info2: 'Restaurant Order' } },
  },
]

// Midtrans expiry_time is "YYYY-MM-DD HH:mm:ss" in WIB (UTC+7) → ISO string
function expiryToIso(expiry: string | undefined): string | null {
  if (!expiry) return null
  return expiry.replace(' ', 'T') + '+07:00'
}

// GET /api/midtrans/channels
export async function getChannels(_req: AuthenticatedRequest, res: Response) {
  const channels = CHANNELS.map(({ id, label, group, kind, icon, instructions }) => ({
    id, label, group, kind, icon, instructions,
  }))
  ok(res, channels, 'Channels fetched')
}

// POST /api/midtrans/payment  { orderId, channel }
export async function createPayment(req: AuthenticatedRequest, res: Response) {
  const { orderId, channel } = req.body
  if (!orderId) throw new AppError('orderId is required', 400)

  const ch = CHANNELS.find(c => c.id === channel)
  if (!ch) throw new AppError(`Unknown channel. Valid: ${CHANNELS.map(c => c.id).join(', ')}`, 400)

  if (!isMidtransConfigured()) {
    throw new AppError('Midtrans is not configured on this server. Set MIDTRANS_SERVER_KEY.', 503)
  }

  const { data: order, error } = await getSupabase()
    .from('orders')
    .select('id, total_price, status, paid_at, customer_name')
    .eq('id', orderId)
    .is('deleted_at', null)
    .single()

  if (error || !order) throw new AppError('Order not found', 404)
  if (order.paid_at) throw new AppError('Order already paid', 400)
  if (!order.total_price || order.total_price <= 0) throw new AppError('Invalid order total', 400)

  // Amount in IDR — whole rupiah, no decimals
  const amount = Math.round(Number(order.total_price))

  // Unique per attempt; also used as Midtrans order_id so the webhook can match
  const invoiceNumber = `INV-${orderId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  const body = {
    transaction_details: { order_id: invoiceNumber, gross_amount: amount },
    customer_details: { first_name: order.customer_name || 'Guest' },
    ...ch.payload,
  }

  const mtRes = await fetch(`${getMidtransBaseUrl()}/v2/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': getMidtransAuthHeader(),
    },
    body: JSON.stringify(body),
  })

  const data = await mtRes.json() as any

  // Midtrans returns HTTP 200 with status_code "201" on successful charge creation
  if (data?.status_code !== '201') {
    console.error('[Midtrans charge]', ch.id, data?.status_code, JSON.stringify(data).slice(0, 400))
    throw new AppError(
      `Midtrans charge failed (${data?.status_code ?? mtRes.status}): ${data?.status_message ?? 'Unknown error'}`,
      502,
    )
  }

  // Normalize per channel type
  const qrUrl: string | null =
    (data.actions ?? []).find((a: any) => a.name === 'generate-qr-code')?.url ?? null
  const paymentCode: string | null =
    data.va_numbers?.[0]?.va_number ??
    data.permata_va_number ??
    data.payment_code ??
    (data.bill_key ? `${data.biller_code}/${data.bill_key}` : null)

  if (!qrUrl && !paymentCode) {
    console.error('[Midtrans charge] no code/QR in response', JSON.stringify(data).slice(0, 400))
    throw new AppError('Midtrans did not return a payment code', 502)
  }

  // Record pending payment (paid_at null → not counted as revenue until webhook confirms)
  await getSupabase().from('payments').insert({
    order_id: orderId,
    amount,
    method: ch.id === 'QRIS' ? 'qris' : 'other',
    reference_id: invoiceNumber,
    cashier_id: req.userId!,
    paid_at: null,
  })

  ok(res, {
    invoiceNumber,
    channel: ch.id,
    channelLabel: ch.label,
    instructions: ch.instructions,
    kind: ch.kind,
    paymentCode,
    qrUrl,
    expiresAt: expiryToIso(data.expiry_time),
  }, 'Payment created')
}

// POST /api/midtrans/webhook — Midtrans HTTP(S) notification
export async function midtransWebhook(req: Request, res: Response) {
  const payload = req.body ?? {}

  if (!verifyMidtransSignature(payload)) {
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const invoiceNumber: string = payload.order_id ?? ''
  const txStatus: string = payload.transaction_status ?? ''
  const fraudStatus: string = payload.fraud_status ?? 'accept'
  const amount = Math.round(Number(payload.gross_amount ?? 0))

  // settlement (VA/QRIS/store) or capture+accept (cards) = paid
  const isPaid =
    txStatus === 'settlement' || (txStatus === 'capture' && fraudStatus === 'accept')

  if (!isPaid || !invoiceNumber) {
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
