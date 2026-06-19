export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  customer_name: string | null
  status: OrderStatus
  total_price: number | null
  notes: string | null
  table_id: string | null
  paid_at: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
  order_items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderInput {
  userId: string
  customerName?: string
  items: OrderItemInput[]
  notes?: string
  tableId?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
  menu_item?: { name: string; image_url: string }
}

export interface OrderItemInput {
  menuItemId: string
  quantity: number
}

interface Payment {
  id: string
  amount: number
  method: string
}
