import type { SupabaseClient } from '@supabase/supabase-js'
import type { RestaurantTable, TableInput } from './tables.types.js'
import * as repo from './tables.repository.js'
import { AppError } from '../../shared/errors/AppError.js'

export async function getAll(client?: SupabaseClient): Promise<RestaurantTable[]> {
  return repo.getTables(client)
}

export async function getById(id: string, client?: SupabaseClient): Promise<RestaurantTable> {
  return repo.getTable(id, client)
}

export async function create(input: TableInput, client?: SupabaseClient): Promise<RestaurantTable> {
  if (!input.tableNumber) throw new AppError('tableNumber is required', 400)
  return repo.createTable(input, client)
}

export async function update(id: string, input: Partial<TableInput>, client?: SupabaseClient): Promise<RestaurantTable> {
  return repo.updateTable(id, input, client)
}

export async function updateStatus(id: string, status: string, client?: SupabaseClient): Promise<RestaurantTable> {
  return repo.updateTableStatus(id, status, client)
}

export async function remove(id: string, client?: SupabaseClient): Promise<void> {
  await repo.softDeleteTable(id, client)
}
