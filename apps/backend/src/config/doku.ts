import crypto from 'crypto'

export const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID ?? ''
export const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY ?? ''
export const DOKU_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.doku.com'
  : 'https://api-sandbox.doku.com'

// DOKU Jokul HMAC-SHA256 signature
export function buildDokuHeaders(method: 'POST', path: string, body: object) {
  const requestId = crypto.randomUUID()
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  const bodyJson = JSON.stringify(body)
  const digest = 'SHA-256=' + crypto.createHash('sha256').update(bodyJson).digest('base64')

  const stringToSign = [
    `Client-Id:${DOKU_CLIENT_ID}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${path}`,
    `Digest:${digest}`,
  ].join('\n')

  const signature = crypto.createHmac('sha256', DOKU_SECRET_KEY).update(stringToSign).digest('base64')

  return {
    'Content-Type': 'application/json',
    'Client-Id': DOKU_CLIENT_ID,
    'Request-Id': requestId,
    'Request-Timestamp': timestamp,
    'Signature': `HMACSHA256=${signature}`,
  }
}

// Verify DOKU webhook notification
export function verifyDokuWebhook(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
): boolean {
  const clientId = headers['client-id'] as string
  const requestId = headers['request-id'] as string
  const timestamp = headers['request-timestamp'] as string
  const receivedSig = headers['signature'] as string

  if (!clientId || !requestId || !timestamp || !receivedSig) return false

  const digest = 'SHA-256=' + crypto.createHash('sha256').update(rawBody).digest('base64')
  const path = '/doku/webhook'

  const stringToSign = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${path}`,
    `Digest:${digest}`,
  ].join('\n')

  const expected = 'HMACSHA256=' + crypto.createHmac('sha256', DOKU_SECRET_KEY).update(stringToSign).digest('base64')
  return expected === receivedSig
}
