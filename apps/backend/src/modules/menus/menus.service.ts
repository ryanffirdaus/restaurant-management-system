import type { SupabaseClient } from '@supabase/supabase-js'
import type { MenuItem, MenuItemInput } from './menus.types.js'
import * as repo from './menus.repository.js'
import { AppError } from '../../shared/errors/AppError.js'

export async function getAll(availableOnly: boolean = false, client?: SupabaseClient): Promise<MenuItem[]> {
  return availableOnly ? repo.getAvailableMenuItems(client) : repo.getMenuItems(client)
}

export async function getById(id: string, client?: SupabaseClient): Promise<MenuItem> {
  return repo.getMenuItem(id, client)
}

export async function create(input: MenuItemInput, client?: SupabaseClient): Promise<MenuItem> {
  if (!input.name || input.price === undefined || input.price < 0) {
    throw new AppError('Name and valid price are required', 400)
  }
  return repo.createMenuItem(input, client)
}

export async function update(id: string, input: Partial<MenuItemInput>, client?: SupabaseClient): Promise<MenuItem> {
  if (input.price !== undefined && input.price < 0) {
    throw new AppError('Price must be >= 0', 400)
  }
  return repo.updateMenuItem(id, input, client)
}

export async function remove(id: string, client?: SupabaseClient): Promise<void> {
  await repo.softDeleteMenuItem(id, client)
}

export async function toggleAvailability(id: string, client?: SupabaseClient): Promise<MenuItem> {
  return repo.toggleMenuItemAvailability(id, client)
}
