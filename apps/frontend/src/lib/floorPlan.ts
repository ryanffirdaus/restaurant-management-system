const STORAGE_KEY = 'servio_floor_plan_positions'

export interface TablePosition {
  tableId: string
  row: number
  col: number
}

export const GRID_ROWS = 8
export const GRID_COLS = 10

export function loadPositions(): Record<string, TablePosition> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function savePositions(positions: Record<string, TablePosition>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
}

export function autoLayoutTables(tableIds: string[]): Record<string, TablePosition> {
  const positions: Record<string, TablePosition> = {}
  tableIds.forEach((id, i) => {
    positions[id] = {
      tableId: id,
      row: Math.floor(i / GRID_COLS),
      col: i % GRID_COLS,
    }
  })
  return positions
}
