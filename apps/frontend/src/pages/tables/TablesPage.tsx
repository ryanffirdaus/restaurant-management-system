import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPatch, apiPost, apiDelete } from '../../lib/api'
import { loadPositions, savePositions, autoLayoutTables, GRID_ROWS, GRID_COLS, type TablePosition } from '../../lib/floorPlan'
import Icon from '../../components/Icon'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import { Button, TextInput, Select } from '../../components/ui'

interface RestaurantTable {
  id: string
  table_number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  notes: string | null
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cleaning', label: 'Cleaning' },
]

function statusColor(status: string) {
  switch (status) {
    case 'available': return { border: 'border-primary/40', bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' }
    case 'occupied': return { border: 'border-orange-400/40', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' }
    case 'reserved': return { border: 'border-blue-400/40', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' }
    case 'cleaning': return { border: 'border-danger/40', bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' }
    default: return { border: 'border-outline', bg: 'bg-surface-variant', text: 'text-text-muted', dot: 'bg-text-muted' }
  }
}

function statusVariant(status: string) {
  switch (status) {
    case 'available': return 'primary' as const
    case 'occupied': return 'warning' as const
    case 'reserved': return 'neutral' as const
    case 'cleaning': return 'danger' as const
    default: return 'neutral' as const
  }
}

// ─── Floor Plan Component ────────────────────────────────────────────────────

interface FloorPlanProps {
  tables: RestaurantTable[]
  isAdmin: boolean
  onStatusClick: (t: RestaurantTable) => void
  onEditClick: (t: RestaurantTable) => void
}

function FloorPlan({ tables, isAdmin, onStatusClick, onEditClick }: FloorPlanProps) {
  const [positions, setPositions] = useState<Record<string, TablePosition>>({})
  const [editMode, setEditMode] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [selected, setSelected] = useState<RestaurantTable | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (tables.length === 0) return
    const stored = loadPositions()
    const newIds = tables.filter(t => !stored[t.id]).map(t => t.id)
    if (newIds.length > 0) {
      // find first free cells for new tables
      const usedCells = new Set(Object.values(stored).map(p => `${p.row},${p.col}`))
      const newPositions = { ...stored }
      for (const id of newIds) {
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            if (!usedCells.has(`${r},${c}`)) {
              newPositions[id] = { tableId: id, row: r, col: c }
              usedCells.add(`${r},${c}`)
              break
            }
          }
          if (newPositions[id]) break
        }
      }
      setPositions(newPositions)
      savePositions(newPositions)
    } else {
      setPositions(stored)
    }
    initialized.current = true
  }, [tables])

  function handleDragStart(e: React.DragEvent, tableId: string) {
    if (!editMode) return
    setDragging(tableId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(e: React.DragEvent, row: number, col: number) {
    e.preventDefault()
    if (!dragging) return
    // Check if cell is occupied by another table
    const occupant = Object.values(positions).find(p => p.row === row && p.col === col && p.tableId !== dragging)
    if (occupant) {
      // swap
      const dragPos = positions[dragging]
      const newPositions = {
        ...positions,
        [dragging]: { tableId: dragging, row, col },
        [occupant.tableId]: { tableId: occupant.tableId, row: dragPos.row, col: dragPos.col },
      }
      setPositions(newPositions)
      savePositions(newPositions)
    } else {
      const newPositions = { ...positions, [dragging]: { tableId: dragging, row, col } }
      setPositions(newPositions)
      savePositions(newPositions)
    }
    setDragging(null)
  }

  function handleAutoLayout() {
    const newPositions = autoLayoutTables(tables.map(t => t.id))
    setPositions(newPositions)
    savePositions(newPositions)
  }

  const tableById = Object.fromEntries(tables.map(t => [t.id, t]))

  // Build grid: cell -> tableId
  const grid: Record<string, string> = {}
  Object.values(positions).forEach(p => {
    if (tableById[p.tableId]) {
      grid[`${p.row},${p.col}`] = p.tableId
    }
  })

  return (
    <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden">
      <div className="p-5 border-b border-outline flex items-center justify-between bg-surface/50">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-text-main">Floor Plan</h3>
          <div className="flex gap-3">
            {(['available', 'occupied', 'reserved', 'cleaning'] as const).map(s => {
              const c = statusColor(s)
              return (
                <span key={s} className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  {s}
                </span>
              )
            })}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleAutoLayout}>
              <Icon name="auto_fix_high" className="text-base" />
              Auto Layout
            </Button>
            <Button variant={editMode ? 'primary' : 'outline'} onClick={() => setEditMode(v => !v)}>
              <Icon name={editMode ? 'check' : 'drag_indicator'} className="text-base" />
              {editMode ? 'Done' : 'Edit Layout'}
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 overflow-auto">
        {editMode && (
          <p className="text-xs text-text-muted mb-3 flex items-center gap-1.5">
            <Icon name="info" className="text-sm" />
            Drag tables to rearrange. Drop onto another table to swap positions.
          </p>
        )}
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 72px)`, gridTemplateRows: `repeat(${GRID_ROWS}, 72px)`, width: 'fit-content' }}
        >
          {Array.from({ length: GRID_ROWS }, (_, r) =>
            Array.from({ length: GRID_COLS }, (_, c) => {
              const key = `${r},${c}`
              const tableId = grid[key]
              const table = tableId ? tableById[tableId] : null
              const c_style = table ? statusColor(table.status) : null

              return (
                <div
                  key={key}
                  className={`rounded-xl border transition-all ${
                    table
                      ? `${c_style!.border} ${c_style!.bg} cursor-pointer hover:opacity-80 ${editMode ? 'cursor-grab active:cursor-grabbing' : ''}`
                      : `border-dashed border-outline/30 ${editMode ? 'bg-surface-variant/20' : 'bg-transparent'}`
                  } ${dragging && !table ? 'border-primary/40 bg-primary/5' : ''}`}
                  onDragOver={e => { if (editMode) e.preventDefault() }}
                  onDrop={e => editMode && handleDrop(e, r, c)}
                  onClick={() => {
                    if (!editMode && table) setSelected(table)
                  }}
                >
                  {table && (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center p-1 select-none"
                      draggable={editMode}
                      onDragStart={e => handleDragStart(e, table.id)}
                    >
                      <span className={`text-[10px] font-black ${c_style!.text} leading-none`}>
                        T-{String(table.table_number).padStart(2, '0')}
                      </span>
                      <span className="text-[9px] text-text-muted leading-none mt-0.5">{table.capacity}p</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${c_style!.dot} mt-1`} />
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Table quick-action popover */}
      {selected && !editMode && (
        <div className="border-t border-outline p-4 flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${statusColor(selected.status).dot}`} />
            <div>
              <p className="text-sm font-bold text-text-main">Table {selected.table_number}</p>
              <p className="text-xs text-text-muted">{selected.capacity} seats • {selected.status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="ghost" onClick={() => { onEditClick(selected); setSelected(null) }}>
                <Icon name="edit" className="text-sm" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => { onStatusClick(selected); setSelected(null) }}>
              <Icon name="swap_horiz" className="text-sm" />
              Status
            </Button>
            <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors">
              <Icon name="close" className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TablesPage() {
  const { employeeRole } = useAuth()
  const isAdmin = employeeRole === 'admin' || employeeRole === 'manager'

  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'floorplan' | 'list'>('floorplan')

  const [addOpen, setAddOpen] = useState(false)
  const [editTable, setEditTable] = useState<RestaurantTable | null>(null)
  const [form, setForm] = useState({ table_number: '', capacity: '4', notes: '' })
  const [saving, setSaving] = useState(false)

  const [statusModal, setStatusModal] = useState<{ table: RestaurantTable; status: string } | null>(null)

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiGet<RestaurantTable[]>('/tables')
      setTables(data)
    } catch {
      setError('Failed to load tables')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTables() }, [fetchTables])

  function openAdd() {
    setForm({ table_number: '', capacity: '4', notes: '' })
    setAddOpen(true)
  }

  function openEdit(t: RestaurantTable) {
    setEditTable(t)
    setForm({ table_number: String(t.table_number), capacity: String(t.capacity), notes: t.notes ?? '' })
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editTable) {
        await apiPatch(`/tables/${editTable.id}`, {
          tableNumber: Number(form.table_number),
          capacity: Number(form.capacity),
          notes: form.notes || null,
        })
        setEditTable(null)
      } else {
        await apiPost('/tables', {
          tableNumber: Number(form.table_number),
          capacity: Number(form.capacity),
          notes: form.notes || null,
        })
        setAddOpen(false)
      }
      await fetchTables()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error saving table')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusModal) return
    try {
      await apiPatch(`/tables/${statusModal.table.id}/status`, { status: statusModal.status })
      setStatusModal(null)
      await fetchTables()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error updating status')
    }
  }

  async function handleDelete(t: RestaurantTable) {
    if (!confirm(`Delete Table ${t.table_number}? This cannot be undone.`)) return
    try {
      await apiDelete(`/tables/${t.id}`)
      await fetchTables()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error deleting table')
    }
  }

  const counts = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
  }

  const formModal = addOpen || editTable !== null

  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Tables</h1>
          <p className="text-sm text-text-muted mt-0.5">{tables.length} tables total</p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl border border-outline overflow-hidden">
            <button
              onClick={() => setView('floorplan')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors ${view === 'floorplan' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-variant'}`}
            >
              <Icon name="grid_view" className="text-sm" />
              Floor Plan
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-xs font-bold flex items-center gap-1.5 transition-colors border-l border-outline ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-main hover:bg-surface-variant'}`}
            >
              <Icon name="table_rows" className="text-sm" />
              List
            </button>
          </div>
          {isAdmin && (
            <Button variant="primary" onClick={openAdd}>
              <Icon name="add" className="text-base" />
              Add Table
            </Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {[
          { label: 'Available', count: counts.available, cls: 'text-primary' },
          { label: 'Occupied', count: counts.occupied, cls: 'text-orange-400' },
          { label: 'Reserved', count: counts.reserved, cls: 'text-blue-400' },
          { label: 'Cleaning', count: counts.cleaning, cls: 'text-danger' },
        ].map(s => (
          <div key={s.label} className="card-bg rounded-2xl border border-outline p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{s.label}</p>
            <p className={`text-3xl font-bold ${s.cls}`}>{s.count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="card-bg rounded-2xl border border-outline p-12 text-center text-text-muted">Loading...</div>
      ) : error ? (
        <div className="card-bg rounded-2xl border border-outline p-12 text-center text-danger">{error}</div>
      ) : view === 'floorplan' ? (
        <FloorPlan
          tables={tables}
          isAdmin={isAdmin}
          onStatusClick={t => setStatusModal({ table: t, status: t.status })}
          onEditClick={openEdit}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-gutter">
          {tables.map(t => {
            const c = statusColor(t.status)
            return (
              <div
                key={t.id}
                className={`card-bg rounded-2xl border ${c.border} p-5 flex flex-col gap-3 hover:opacity-90 transition-all group`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <span className={`text-[10px] font-black ${c.text}`}>{t.table_number}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors">
                        <Icon name="edit" className="text-sm" />
                      </button>
                      <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                        <Icon name="delete" className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-lg font-bold text-text-main">T-{String(t.table_number).padStart(2, '0')}</p>
                  <p className="text-xs text-text-muted">{t.capacity} seats</p>
                </div>
                <Badge variant={statusVariant(t.status)}>{t.status.charAt(0).toUpperCase() + t.status.slice(1)}</Badge>
                {t.notes && <p className="text-xs text-text-muted truncate">{t.notes}</p>}
                <button
                  onClick={() => setStatusModal({ table: t, status: t.status })}
                  className="mt-auto text-xs font-medium text-text-muted hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Icon name="swap_horiz" className="text-sm" />
                  Change status
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={formModal}
        onClose={() => { setAddOpen(false); setEditTable(null) }}
        title={editTable ? `Edit Table ${editTable.table_number}` : 'Add Table'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAddOpen(false); setEditTable(null) }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !form.table_number}>
              {saving ? 'Saving...' : editTable ? 'Save Changes' : 'Add Table'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextInput
            label="Table Number"
            type="number"
            value={form.table_number}
            onChange={e => setForm(f => ({ ...f, table_number: e.target.value }))}
            placeholder="e.g. 1"
          />
          <TextInput
            label="Capacity (seats)"
            type="number"
            value={form.capacity}
            onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
            placeholder="4"
          />
          <TextInput
            label="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Window seat, near kitchen, etc."
          />
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title={`Change Status — Table ${statusModal?.table.table_number}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setStatusModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleStatusChange}>Apply</Button>
          </>
        }
      >
        {statusModal && (
          <Select
            label="New Status"
            value={statusModal.status}
            onChange={value => setStatusModal(s => s ? { ...s, status: value } : null)}
            options={STATUS_OPTIONS}
          />
        )}
      </Modal>
    </div>
  )
}
