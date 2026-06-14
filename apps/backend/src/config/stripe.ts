import Stripe from 'stripe'
import { getEnv } from './env.js'

export const stripe = new Stripe(getEnv('STRIPE_SECRET_KEY'), {
  typescript: true,
})

export const STRIPE_WEBHOOK_SECRET = getEnv('STRIPE_WEBHOOK_SECRET')
