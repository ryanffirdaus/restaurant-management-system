import { SearchBar, Select } from '../../../components/ui'
import { roleFilterOptions, statusOptions } from '../constants'

interface EmployeeFiltersProps {
  search: string
  roleFilter: string
  statusFilter: 'all' | 'active' | 'inactive'
  filteredCount: number
  totalCount: number
  onSearchChange: (value: string) => void
  onRoleFilterChange: (value: string) => void
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void
}

export default function EmployeeFilters({
  search,
  roleFilter,
  statusFilter,
  filteredCount,
  totalCount,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
}: EmployeeFiltersProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name or role..."
        className="flex-1 min-w-[200px] max-w-xs"
      />

      <div className="min-w-[160px]">
        <Select
          placeholder="All Roles"
          options={roleFilterOptions}
          value={roleFilter}
          onChange={onRoleFilterChange}
        />
      </div>

      <div className="min-w-[160px]">
        <Select
          placeholder="All Status"
          options={statusOptions}
          value={statusFilter}
          onChange={(v) => onStatusFilterChange(v as typeof statusFilter)}
        />
      </div>

      <span className="text-xs text-text-muted whitespace-nowrap">{filteredCount} of {totalCount}</span>
    </div>
  )
}
