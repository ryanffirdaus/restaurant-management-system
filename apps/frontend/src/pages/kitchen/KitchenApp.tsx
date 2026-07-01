import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { apiGet, apiPatch } from '../../lib/api'
import Icon from '../../components/Icon'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending' | 'preparing' | 'ready'

interface OrderItem {
  id: string
  quantity: number
  menu_item?: { name: string }
}

interface Order {
  id: string
  status: OrderStatus
  notes: string | null
  table_id: string | null
  created_at: string
  order_items?: OrderItem[]
  table?: { table_number: number } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useNow(ms = 5_000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t) }, [ms])
  return now
}

function elapsed(createdAt: string, now: number): string {
  const s = Math.floor((now - +new Date(createdAt)) / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

function elapsedCls(createdAt: string, now: number, status: OrderStatus): string {
  if (status === 'ready') return 'text-primary bg-primary/15 border-primary/30'
  const m = (now - +new Date(createdAt)) / 60_000
  if (m < 5)  return 'text-text-muted bg-surface-variant border-outline'
  if (m < 10) return 'text-warning bg-warning/15 border-warning/30'
  return 'text-danger bg-danger/15 border-danger/30'
}

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: null,
}

// Column config — acceptFrom = which status cards can be dragged here
const COLUMNS = [
  { status: 'pending'   as OrderStatus, title: 'New Orders', icon: 'ri-timer-line',          color: 'text-text-muted', accentBar: 'bg-surface-variant', empty: 'No new orders',    acceptFrom: null           as OrderStatus | null },
  { status: 'preparing' as OrderStatus, title: 'Cooking',    icon: 'ri-restaurant-line',     color: 'text-orange-400', accentBar: 'bg-orange-400',      empty: 'Nothing cooking',  acceptFrom: 'pending'      as OrderStatus | null },
  { status: 'ready'     as OrderStatus, title: 'Ready',      icon: 'ri-checkbox-circle-line', color: 'text-primary',    accentBar: 'bg-primary',         empty: 'Nothing ready yet', acceptFrom: 'preparing'   as OrderStatus | null },
]

// ─── Ticket Card ──────────────────────────────────────────────────────────────

function TicketCard({ order, now, onAdvance, faded, onDragStart, onDragEnd }: {
  order: Order
  now: number
  onAdvance: (id: string) => void
  faded: boolean
  onDragStart: (id: string, status: OrderStatus) => void
  onDragEnd: () => void
}) {
  const [busy, setBusy] = useState(false)
  const canDrag = NEXT[order.status] !== null

  async function handleAdvance() {
    setBusy(true)
    await onAdvance(order.id)
    setBusy(false)
  }

  const tableLabel = order.table
    ? `T-${String(order.table.table_number).padStart(2, '0')}`
    : 'Takeaway'

  const totalItems = (order.order_items ?? []).reduce((s, i) => s + i.quantity, 0)
  const accentBar  = order.status === 'pending' ? 'bg-surface-variant' : order.status === 'preparing' ? 'bg-orange-400' : 'bg-primary'

  return (
    <div
      draggable={canDrag}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', `${order.id}|${order.status}`)
        onDragStart(order.id, order.status)
      }}
      onDragEnd={onDragEnd}
      className={`bg-surface rounded-2xl border overflow-hidden flex flex-col select-none transition-all duration-150 ${
        faded ? 'opacity-30 scale-[0.97]' : 'border-outline'
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className={`h-1.5 w-full shrink-0 ${accentBar}`} />

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          {canDrag && (
            <Icon name="ri-draggable" className="text-text-muted/30 text-base mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-base font-black text-text-main leading-none">{tableLabel}</p>
            <p className="text-[11px] text-text-muted font-mono mt-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border tabular-nums ${elapsedCls(order.created_at, now, order.status)}`}>
            {elapsed(order.created_at, now)}
          </span>
          <span className="text-[10px] text-text-muted">
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-3 space-y-1.5 flex-1">
        {(order.order_items ?? []).map(item => (
          <div key={item.id} className="flex items-center gap-2.5">
            <span className={`text-base font-black w-7 text-center shrink-0 leading-none ${
              order.status === 'preparing' ? 'text-orange-400' :
              order.status === 'ready'     ? 'text-primary'    : 'text-text-muted'
            }`}>{item.quantity}</span>
            <span className="text-sm font-semibold text-text-main leading-tight">
              {item.menu_item?.name ?? '?'}
            </span>
          </div>
        ))}
        {order.notes && (
          <div className="mt-2 bg-warning/10 border border-warning/25 rounded-xl px-3 py-2 flex gap-2 items-start">
            <Icon name="ri-alarm-warning-line" className="text-warning text-sm shrink-0 mt-0.5" />
            <p className="text-xs text-text-main italic leading-snug">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-3 border-t border-outline flex items-center justify-between gap-2">
        <span className="text-[11px] text-text-muted">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>

        {order.status === 'pending' && (
          <button onClick={handleAdvance} disabled={busy}
            className="flex items-center gap-1.5 bg-orange-500 text-white font-bold text-sm py-2 px-4 rounded-xl active:scale-95 disabled:opacity-50 shadow-md shadow-orange-500/25">
            {busy ? <Icon name="ri-loader-4-line" className="animate-spin" /> : <><Icon name="ri-restaurant-line" />Start Cooking</>}
          </button>
        )}
        {order.status === 'preparing' && (
          <button onClick={handleAdvance} disabled={busy}
            className="flex items-center gap-1.5 bg-primary text-black font-bold text-sm py-2 px-4 rounded-xl active:scale-95 disabled:opacity-50 shadow-md shadow-primary/25">
            {busy ? <Icon name="ri-loader-4-line" className="animate-spin" /> : <><Icon name="ri-checkbox-circle-line" />Mark Ready</>}
          </button>
        )}
        {order.status === 'ready' && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-bold">
            <Icon name="ri-walk-line" />Waiter picks up
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Kitchen Column (drop zone) ───────────────────────────────────────────────

function KitchenColumn({ col, orders, now, onAdvance, onDrop, dragRef, onCardDragStart, onCardDragEnd }: {
  col: typeof COLUMNS[number]
  orders: Order[]
  now: number
  onAdvance: (id: string) => void
  onDrop: (orderId: string, fromStatus: OrderStatus, toStatus: OrderStatus) => void
  dragRef: React.RefObject<{ id: string; fromStatus: OrderStatus } | null>
  onCardDragStart: (id: string, status: OrderStatus) => void
  onCardDragEnd: () => void
}) {
  const [over, setOver] = useState(false)

  function canAccept(): boolean {
    const drag = dragRef.current
    return drag !== null && col.acceptFrom !== null && drag.fromStatus === col.acceptFrom
  }

  function onDragOver(e: React.DragEvent) {
    if (!canAccept()) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
  }

  function onDropEvt(e: React.DragEvent) {
    e.preventDefault()
    setOver(false)
    if (!canAccept()) return
    const drag = dragRef.current
    if (!drag) return
    onDrop(drag.id, drag.fromStatus, col.status)
  }

  const isDropTarget = over && canAccept()

  return (
    <div
      className={`flex flex-col min-h-0 rounded-2xl transition-all duration-150 ${
        isDropTarget
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5'
          : canAccept()
          ? 'ring-1 ring-primary/20 ring-offset-1 ring-offset-background'
          : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDropEvt}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-3 shrink-0">
        <div className={`w-8 h-8 rounded-xl bg-current/15 flex items-center justify-center shrink-0 ${col.color}`}>
          <Icon name={col.icon} className={`text-base ${col.color}`} />
        </div>
        <h2 className="font-black text-text-main text-base">{col.title}</h2>
        {isDropTarget && (
          <span className="text-[10px] font-black text-primary ml-1 animate-pulse">Drop here ↓</span>
        )}
        <span className={`ml-auto text-[11px] font-black px-2 py-0.5 rounded-lg bg-current/15 ${col.color}`}>
          {orders.length}
        </span>
      </div>

      {/* Drop landing strip */}
      {isDropTarget && (
        <div className="h-1 mx-1 mb-2 rounded-full bg-primary shrink-0" />
      )}

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-2 min-h-0">
        {orders.length === 0 && !isDropTarget ? (
          <div className={`flex flex-col items-center gap-2 py-12 ${col.color} opacity-30`}>
            <Icon name={col.icon} className="text-3xl" />
            <p className="text-xs font-medium text-text-muted">{col.empty}</p>
          </div>
        ) : (
          <>
            {orders.map(order => (
              <TicketCard
                key={order.id}
                order={order}
                now={now}
                onAdvance={onAdvance}
                faded={dragRef.current?.id === order.id}
                onDragStart={onCardDragStart}
                onDragEnd={onCardDragEnd}
              />
            ))}
            {/* Empty drop placeholder when dragging into an occupied column */}
            {isDropTarget && (
              <div className="rounded-2xl border-2 border-dashed border-primary/50 h-20 flex items-center justify-center bg-primary/5">
                <p className="text-primary text-xs font-bold">Release to move here</p>
              </div>
            )}
          </>
        )}
        {/* Empty column drop placeholder */}
        {orders.length === 0 && isDropTarget && (
          <div className="rounded-2xl border-2 border-dashed border-primary/60 h-28 flex items-center justify-center bg-primary/5">
            <p className="text-primary text-sm font-bold">Release to move here</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Kitchen App ─────────────────────────────────────────────────────────

export default function KitchenApp() {
  const { profile, user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const now = useNow(5_000)

  const displayName = (profile?.name as string) ?? user?.email ?? 'Kitchen'

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Drag state in a ref — synchronously readable during dragover (no async lag)
  const dragRef = useRef<{ id: string; fromStatus: OrderStatus } | null>(null)
  // Also keep React state for visual feedback on the dragged card itself
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const prevPendingCount = useRef(0)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiGet<Array<Order & { status: string }>>('/orders')
      const active = data.filter(
        (o): o is Order =>
          o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
      )
      // New order notification
      const newPending = active.filter(o => o.status === 'pending').length
      if (newPending > prevPendingCount.current && prevPendingCount.current !== 0) {
        if (Notification.permission === 'granted') {
          new Notification('New Order', {
            body: `${newPending} order${newPending > 1 ? 's' : ''} waiting`,
            icon: '/favicon.ico',
          })
        }
      }
      prevPendingCount.current = newPending
      setOrders(active)
      setLastRefresh(new Date())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load + live polling every 5 seconds
  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => {
    const t = setInterval(fetchOrders, 5_000)
    return () => clearInterval(t)
  }, [fetchOrders])

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  // Advance via button click
  async function advance(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    const next = NEXT[order.status]
    if (!next) return
    await moveTo(orderId, order.status, next)
  }

  // Shared optimistic move
  async function moveTo(orderId: string, from: OrderStatus, to: OrderStatus) {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: to } : o))
    try {
      await apiPatch(`/orders/${orderId}/status`, { status: to })
    } catch {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: from } : o))
    }
  }

  // Drop handler from column
  function handleDrop(orderId: string, from: OrderStatus, to: OrderStatus) {
    if (NEXT[from] !== to) return
    setDraggingId(null)
    dragRef.current = null
    moveTo(orderId, from, to)
  }

  // Sort: oldest at top (ascending created_at)
  function byAge(a: Order, b: Order) { return +new Date(a.created_at) - +new Date(b.created_at) }

  const byStatus = (s: OrderStatus) => orders.filter(o => o.status === s).sort(byAge)

  const pending   = byStatus('pending')
  const preparing = byStatus('preparing')
  const ready     = byStatus('ready')

  const ordersByStatus: Record<OrderStatus, Order[]> = { pending, preparing, ready }

  const timeStr = lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="shrink-0 h-14 bg-background border-b border-outline flex items-center px-4 gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-orange-500/30">
          <Icon name="ri-restaurant-line" className="text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-main leading-tight">Kitchen Display</p>
          <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest leading-none">{displayName}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {pending.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-variant text-text-muted text-xs font-bold">
              <Icon name="ri-timer-line" className="text-sm" />{pending.length} new
            </span>
          )}
          {preparing.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-bold">
              <Icon name="ri-restaurant-line" className="text-sm" />{preparing.length} cooking
            </span>
          )}
          {ready.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold animate-pulse">
              <Icon name="ri-checkbox-circle-line" className="text-sm" />{ready.length} ready
            </span>
          )}
        </div>

        <button
          onClick={fetchOrders}
          className="hidden sm:flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-main font-mono"
        >
          <Icon name="ri-refresh-line" className="text-sm" />{timeStr}
        </button>

        <button onClick={toggleTheme} className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted">
          <Icon name={isDark ? 'ri-sun-line' : 'ri-moon-line'} className="text-lg" />
        </button>
        <button onClick={logout} className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-danger">
          <Icon name="ri-logout-box-r-line" className="text-lg" />
        </button>
      </header>

      {/* Mobile stats */}
      <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-outline overflow-x-auto no-scrollbar shrink-0">
        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-variant text-text-muted text-xs font-bold">
          <Icon name="ri-timer-line" className="text-xs" />{pending.length} new
        </span>
        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-bold">
          <Icon name="ri-restaurant-line" className="text-xs" />{preparing.length} cooking
        </span>
        {ready.length > 0 && (
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold animate-pulse">
            <Icon name="ri-checkbox-circle-line" className="text-xs" />{ready.length} ready
          </span>
        )}
        <button onClick={fetchOrders} className="shrink-0 ml-auto flex items-center gap-1 text-[10px] text-text-muted font-mono">
          <Icon name="ri-refresh-line" className="text-xs" />{timeStr}
        </button>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-text-muted">
            <Icon name="ri-loader-4-line" className="text-4xl animate-spin text-orange-400" />
            <p className="text-sm font-medium">Loading orders…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 min-h-0 overflow-hidden p-3 gap-3">
          {COLUMNS.map((col, i) => (
            <div
              key={col.status}
              className={`flex flex-col min-h-0 overflow-hidden ${i < 2 ? 'border-r border-outline pr-3' : ''}`}
            >
              <KitchenColumn
                col={col}
                orders={ordersByStatus[col.status]}
                now={now}
                onAdvance={advance}
                onDrop={handleDrop}
                dragRef={dragRef}
                onCardDragStart={(id, status) => {
                  dragRef.current = { id, fromStatus: status }
                  setDraggingId(id)
                }}
                onCardDragEnd={() => {
                  dragRef.current = null
                  setDraggingId(null)
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Global drag listeners to update ref + React state */}
      {/* These are attached via the card's onDragStart/onDragEnd forwarded from TicketCard */}
    </div>
  )
}
