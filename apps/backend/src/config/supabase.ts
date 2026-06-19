import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'
import { getEnv } from './env.js'

let _supabase: SupabaseClient | null = null
let _supabaseAnon: SupabaseClient | null = null

function initClients(): { supabase: SupabaseClient; supabaseAnon: SupabaseClient } {
  if (!_supabase) {
    const supabaseUrl = getEnv('SUPABASE_URL')
    const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY')

    _supabase = createClient(supabaseUrl, supabaseServiceKey, {
      realtime: { transport: ws as never },
    })

    _supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: { transport: ws as never },
    })
  }
  return { supabase: _supabase!, supabaseAnon: _supabaseAnon! }
}

export function getSupabase(): SupabaseClient {
  return initClients().supabase
}

export function getSupabaseAnon(): SupabaseClient {
  return initClients().supabaseAnon
}

export function createUserClient(accessToken: string): SupabaseClient {
  const { supabase: _, supabaseAnon } = initClients()
  return createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_ANON_KEY'), {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    realtime: { transport: ws as never },
  })
}
