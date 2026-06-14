import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getEnv } from './env.js'

const supabaseUrl = getEnv('SUPABASE_URL')
const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY')

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey)

export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
