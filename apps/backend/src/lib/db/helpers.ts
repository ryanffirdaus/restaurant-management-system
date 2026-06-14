import { supabase } from '../../config/supabase.js'
import type { SupabaseClient } from '@supabase/supabase-js'

export function db(client?: SupabaseClient): SupabaseClient {
  return client ?? supabase
}

export function now(): string {
  return new Date().toISOString()
}
