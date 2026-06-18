import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
  sortKey?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  getRowClass?: (item: T) => string | undefined
}

export default function Table<T>({
  columns,
  data,
  loading,
  emptyText = 'No data.',
  sortKey,
  sortDir,
  onSort,
  getRowClass,
}: TableProps<T>) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-variant/50 text-text-muted text-[10px] font-bold uppercase tracking-widest border-b border-outline">
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    className={`
                      px-6 py-4 whitespace-nowrap
                      ${col.sortable ? 'select-none cursor-pointer' : ''}
                      ${col.headerClassName ?? ''}
                    `}
                    onClick={() => {
                      if (col.sortable && onSort) onSort(col.key)
                    }}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className={`text-[10px] leading-none ${isSorted ? 'opacity-100' : 'opacity-30'}`}>
                          {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-text-muted">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-text-muted">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr
                  key={(item as Record<string, unknown>).id as string ?? i}
                  className={`
                    hover:bg-surface-variant transition-colors group
                    ${getRowClass?.(item) ?? ''}
                  `}
                >
                  {columns.map((col) => {
                    const value = (item as Record<string, unknown>)[col.key]
                    return (
                      <td
                        key={col.key}
                        className={`px-6 py-4 ${col.className ?? 'text-text-main'}`}
                      >
                        {col.render ? col.render(item) : (value as ReactNode) ?? <span className="text-text-muted">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
