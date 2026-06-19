import { db } from '../../shared/utils/db.js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, ProfileInput } from './profiles.types.js'

export async function getProfile(id: string, client?: SupabaseClient): Promise<Profile> {
  const { data, error } = await db(client)
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, input: ProfileInput, client?: SupabaseClient): Promise<Profile> {
  const { data, error } = await db(client)
    .from('profiles')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
