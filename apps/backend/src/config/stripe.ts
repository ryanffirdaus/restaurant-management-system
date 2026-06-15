import Stripe from 'stripe'
import { getEnv } from './env.js'

let _stripe: Stripe | null = null
let _webhookSecret: string | null = null

function initStripe() {
  if (!_stripe) {
    _stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), {
      typescript: true,
    })
    _webhookSecret = getEnv('STRIPE_WEBHOOK_SECRET')
  }
  return { stripe: _stripe, webhookSecret: _webhookSecret }
}

export function getStripe(): Stripe {
  return initStripe().stripe
}

export function getWebhookSecret(): string {
  return initStripe().webhookSecret!
}
