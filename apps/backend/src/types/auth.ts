import type { Request } from 'express'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userRole?: string
  userToken?: string
  userClient?: SupabaseClient
}
