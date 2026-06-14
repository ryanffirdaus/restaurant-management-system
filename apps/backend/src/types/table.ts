export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'

export interface RestaurantTable {
  id: string
  table_number: number
  capacity: number
  status: TableStatus
  notes: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

export interface TableInput {
  tableNumber: number
  capacity?: number
  notes?: string
}
