import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Record<string, unknown> | null
  employeeRole: string | null
  loading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, employeeRole: null, loading: true })

  const fetchMe = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setState((prev) => ({
          ...prev,
          profile: data.profile,
          employeeRole: data.employee?.role ?? null,
          loading: false,
        }))
      } else {
        setState({ user: null, profile: null, employeeRole: null, loading: false })
      }
    } catch {
      setState({ user: null, profile: null, employeeRole: null, loading: false })
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user }))
        fetchMe(session.access_token)
      } else {
        setState((prev) => ({ ...prev, loading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user }))
        fetchMe(session.access_token)
      } else {
        setState({ user: null, profile: null, employeeRole: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchMe])

  const login = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    setState((prev) => ({ ...prev, user: data.user }))
    fetchMe(data.session.access_token)
    return null
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setState({ user: null, profile: null, employeeRole: null, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
