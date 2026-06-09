import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing environment variable: ${key}`)
  return value
}

const supabaseUrl = getEnv('SUPABASE_URL')
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey)