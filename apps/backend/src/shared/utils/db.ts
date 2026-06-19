import { getSupabase } from '../../config/supabase.js'
import type { SupabaseClient } from '@supabase/supabase-js'

export function db(client?: SupabaseClient): SupabaseClient {
  return client ?? getSupabase()
}

export function now(): string {
  return new Date().toISOString()
}
