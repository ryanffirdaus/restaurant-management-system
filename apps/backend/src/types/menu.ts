export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  category: string | null
  available: boolean
  image_url: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

export interface MenuItemInput {
  name: string
  description?: string
  price: number
  category?: string
  available?: boolean
  image_url?: string
}
