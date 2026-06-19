export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email?: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number | null | undefined
  }
}

export interface MeResponse {
  id: string | undefined
  role: string | undefined
  profile: Record<string, any> | null
  employee: Record<string, any> | null
}
