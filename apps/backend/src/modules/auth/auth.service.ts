import { getSupabase, getSupabaseAnon } from '../../config/supabase.js'
import type { LoginInput, AuthResponse, MeResponse } from './auth.types.js'
import { AppError } from '../../shared/errors/AppError.js'

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input
  const { data, error } = await getSupabaseAnon().auth.signInWithPassword({ email, password })
  if (error) throw new AppError(error.message, 401)
  return {
    user: { id: data.user.id, email: data.user.email },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  }
}

export async function logout(userId: string): Promise<void> {
  const { error } = await getSupabase().auth.admin.signOut(userId)
  if (error) throw new AppError(error.message, 500)
}

export async function getMe(userId: string): Promise<MeResponse> {
  const { data: profile, error: profileError } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) throw new AppError(`Failed to fetch profile: ${profileError.message}`, 500)

  const { data: employee, error: employeeError } = await getSupabase()
    .from('employees')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (employeeError) throw new AppError(`Failed to fetch employee: ${employeeError.message}`, 500)

  return {
    id: userId,
    role: undefined,
    profile: profile ?? null,
    employee: employee ?? null,
  }
}
