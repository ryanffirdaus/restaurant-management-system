import { db, now } from './helpers.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MenuItem, MenuItemInput } from '../../types/menu.js'

export async function getMenuItems(client?: SupabaseClient): Promise<MenuItem[]> {
  const { data, error } = await db(client)
    .from('menu_items')
    .select('*')
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function getAvailableMenuItems(client?: SupabaseClient): Promise<MenuItem[]> {
  const { data, error } = await db(client)
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function getMenuItem(id: string, client?: SupabaseClient): Promise<MenuItem> {
  const { data, error } = await db(client)
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) throw error
  return data
}

export async function createMenuItem(input: MenuItemInput, client?: SupabaseClient): Promise<MenuItem> {
  const { data, error } = await db(client)
    .from('menu_items')
    .insert([{
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      category: input.category ?? null,
      available: input.available ?? true,
      image_url: input.image_url ?? null,
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateMenuItem(id: string, input: Partial<MenuItemInput>, client?: SupabaseClient): Promise<MenuItem> {
  const { data, error } = await db(client)
    .from('menu_items')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function softDeleteMenuItem(id: string, client?: SupabaseClient): Promise<void> {
  const { error } = await db(client)
    .from('menu_items')
    .update({ deleted_at: now() })
    .eq('id', id)

  if (error) throw error
}

export async function toggleMenuItemAvailability(id: string, client?: SupabaseClient): Promise<MenuItem> {
  const item = await getMenuItem(id, client)
  return updateMenuItem(id, { available: !item.available }, client)
}
