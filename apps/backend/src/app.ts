import express from 'express'
import cors from 'cors'
import type { Request, Response } from 'express'

import authRoutes from './modules/auth/auth.routes.js'
import employeeRoutes from './modules/employees/employees.routes.js'
import menuRoutes from './modules/menus/menus.routes.js'
import orderRoutes from './modules/orders/orders.routes.js'
import tableRoutes from './modules/tables/tables.routes.js'
import profileRoutes from './modules/profiles/profiles.routes.js'
import paymentRoutes from './modules/payments/payments.routes.js'
import stripeRoutes, { stripeWebhook } from './modules/payments/payments.stripe.routes.js'
import { errorHandler } from './middleware/error-handler.js'

const app = express()

// Stripe webhook needs raw body for signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook)

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'Backend API is running', timestamp: new Date() })
})

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Servio Backend', version: '1.0.0' })
})

app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/stripe', stripeRoutes)

app.use(errorHandler)

export default app
