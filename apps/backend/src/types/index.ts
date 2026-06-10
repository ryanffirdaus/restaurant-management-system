export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  available: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface MenuItemInput {
  name: string
  description?: string
  price: number
  category?: string
  available?: boolean
  image_url?: string
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  total_price: number | null
  notes: string | null
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface OrderInput {
  userId: string
  items: OrderItemInput[]
  notes?: string
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
  menu_item?: Pick<MenuItem, 'name' | 'image_url'>
}

export interface OrderItemInput {
  menuItemId: string
  quantity: number
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  total_orders: number
  total_spent: number
  created_at: string
}

export interface CustomerInput {
  name: string
  email: string
  phone?: string
}
