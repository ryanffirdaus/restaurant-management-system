import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile, ProfileInput } from './profiles.types.js'
import * as repo from './profiles.repository.js'

export async function getById(id: string, client?: SupabaseClient): Promise<Profile> {
  return repo.getProfile(id, client)
}

export async function update(id: string, input: ProfileInput, client?: SupabaseClient): Promise<Profile> {
  return repo.updateProfile(id, input, client)
}
