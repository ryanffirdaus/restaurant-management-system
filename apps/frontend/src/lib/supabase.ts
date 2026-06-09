import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const value = import.meta.env[key] as string | undefined
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY')

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)