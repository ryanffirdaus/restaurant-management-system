import { db, now } from '../../shared/utils/db.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RestaurantTable, TableInput } from './tables.types.js'

export async function getTables(client?: SupabaseClient): Promise<RestaurantTable[]> {
  const { data, error } = await db(client)
    .from('restaurant_tables')
    .select('*')
    .is('deleted_at', null)
    .order('table_number', { ascending: true })
  if (error) throw error
  return data
}

export async function getTable(id: string, client?: SupabaseClient): Promise<RestaurantTable> {
  const { data, error } = await db(client)
    .from('restaurant_tables')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (error) throw error
  return data
}

export async function createTable(input: TableInput, client?: SupabaseClient): Promise<RestaurantTable> {
  const { data, error } = await db(client)
    .from('restaurant_tables')
    .insert([{
      table_number: input.tableNumber,
      capacity: input.capacity ?? 4,
      notes: input.notes ?? null,
    }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTable(id: string, input: Partial<TableInput>, client?: SupabaseClient): Promise<RestaurantTable> {
  const { data, error } = await db(client)
    .from('restaurant_tables')
    .update({
      table_number: input.tableNumber,
      capacity: input.capacity,
      notes: input.notes,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTableStatus(id: string, status: string, client?: SupabaseClient): Promise<RestaurantTable> {
  const { data, error } = await db(client)
    .from('restaurant_tables')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteTable(id: string, client?: SupabaseClient): Promise<void> {
  const { error } = await db(client)
    .from('restaurant_tables')
    .update({ deleted_at: now() })
    .eq('id', id)
  if (error) throw error
}
