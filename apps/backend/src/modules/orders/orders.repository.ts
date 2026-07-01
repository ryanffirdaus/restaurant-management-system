import { db, now } from '../../shared/utils/db.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MenuItem } from '../menus/menus.types.js'
import type { Order, OrderInput } from './orders.types.js'
import { getMenuItem } from '../menus/menus.repository.js'

export async function getOrders(client?: SupabaseClient): Promise<Order[]> {
  const { data, error } = await db(client)
    .from('orders')
    .select('*, order_items(*, menu_item:menu_item_id(name, image_url)), table:table_id(table_number)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrder(id: string, client?: SupabaseClient): Promise<Order> {
  const { data, error } = await db(client)
    .from('orders')
    .select('*, order_items(*, menu_item:menu_item_id(name, image_url))')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data
}

export async function createOrder(input: OrderInput, client?: SupabaseClient): Promise<Order> {
  const itemsWithPrice = await Promise.all(
    input.items.map(async (item) => {
      const menuItem = await getMenuItem(item.menuItemId, client)
      return {
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price_at_purchase: menuItem.price,
      }
    })
  )

  const totalPrice = itemsWithPrice.reduce(
    (sum, item) => sum + item.price_at_purchase * item.quantity, 0
  )

  const { data: order, error: orderError } = await db(client)
    .from('orders')
    .insert([{
      user_id: input.userId,
      customer_name: input.customerName ?? null,
      total_price: totalPrice,
      notes: input.notes ?? null,
      table_id: input.tableId ?? null,
    }])
    .select()
    .single()
  if (orderError) throw orderError

  const orderItems = itemsWithPrice.map((item) => ({ ...item, order_id: order.id }))

  const { data: items, error: itemsError } = await db(client)
    .from('order_items')
    .insert(orderItems)
    .select('*, menu_item:menu_item_id(name, image_url)')
  if (itemsError) throw itemsError

  return { ...order, order_items: items }
}

export async function updateOrderStatus(id: string, status: string, client?: SupabaseClient): Promise<Order> {
  const { data, error } = await db(client)
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteOrder(id: string, client?: SupabaseClient): Promise<void> {
  const { error } = await db(client)
    .from('orders')
    .update({ deleted_at: now() })
    .eq('id', id)
  if (error) throw error
}
