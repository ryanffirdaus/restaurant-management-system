import crypto from 'crypto'

// Read env lazily so values are available after dotenv loads.
export function getMidtransServerKey(): string {
  return process.env.MIDTRANS_SERVER_KEY ?? ''
}

export function getMidtransBaseUrl(): string {
  return process.env.NODE_ENV === 'production'
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com'
}

export function isMidtransConfigured(): boolean {
  return getMidtransServerKey() !== ''
}

export function getMidtransAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${getMidtransServerKey()}:`).toString('base64')
}

// Midtrans notification signature: sha512(order_id + status_code + gross_amount + server_key)
export function verifyMidtransSignature(payload: {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
}): boolean {
  const { order_id, status_code, gross_amount, signature_key } = payload
  if (!order_id || !status_code || !gross_amount || !signature_key) return false
  const expected = crypto
    .createHash('sha512')
    .update(order_id + status_code + gross_amount + getMidtransServerKey())
    .digest('hex')
  return expected === signature_key
}
