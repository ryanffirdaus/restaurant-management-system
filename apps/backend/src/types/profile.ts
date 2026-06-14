export interface Profile {
  id: string
  name: string
  phone: string | null
  avatar_url: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

export interface ProfileInput {
  name?: string
  phone?: string
  avatar_url?: string
}
