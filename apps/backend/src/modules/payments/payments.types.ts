export type PaymentMethod = 'cash' | 'debit_card' | 'credit_card' | 'qris' | 'other'

export interface Payment {
  id: string
  order_id: string
  amount: number
  method: PaymentMethod
  reference_id: string | null
  cashier_id: string
  paid_at: string
  created_at: string
  created_by: string | null
}

export interface PaymentInput {
  amount: number
  method: PaymentMethod
  referenceId?: string
}
