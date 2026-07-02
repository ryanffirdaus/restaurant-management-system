import { supabase } from './supabase'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken()
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' }
}

const BASE = import.meta.env.VITE_API_URL as string

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body?.message ?? body?.error ?? `HTTP ${res.status}`
    throw new Error(message)
  }
  // Unwrap standardized envelope { success, message, data }
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as ApiResponse<T>).data
  }
  return body as T
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: await authHeaders() })
  return handleResponse<T>(res)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `HTTP ${res.status}`)
  }
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}
