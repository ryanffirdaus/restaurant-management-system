import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { apiGet, apiPatch } from '../../lib/api'
import Icon from '../../components/Icon'

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemStatus = 'pending' | 'preparing' | 'ready'

interface RawOrderItem {
  id: string
  order_id: string
  quantity: number
  item_status: ItemStatus
  created_at: string
  menu_item?: { name: string }
}

interface RawOrder {
  id: string
  status: string
  notes: string | null
  table_id: string | null
  created_at: string
  order_items?: RawOrderItem[]
  table?: { table_number: number } | null
}

// Flattened: one ticket per order_item
interface ItemTicket {
  itemId: string
  orderId: string
  orderCreatedAt: string
  orderNotes: string | null
  tableLabel: string
  itemName: string
  quantity: number
  itemStatus: ItemStatus
}

const NEXT: Record<ItemStatus, ItemStatus | null> = {
  pending: 'preparing',
  preparing: 'ready',
  ready: null,
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

function elapsedCls(createdAt: string, now: number, status: ItemStatus): string {
  if (status === 'ready') return 'text-primary bg-primary/15 border-primary/30'
  const m = (now - +new Date(createdAt)) / 60_000
  if (m < 5)  return 'text-text-muted bg-surface-variant border-outline'
  if (m < 10) return 'text-warning bg-warning/15 border-warning/30'
  return 'text-danger bg-danger/15 border-danger/30'
}

const COL_CONFIG = [
  { status: 'pending'   as ItemStatus, title: 'Queue',    icon: 'ri-timer-line',           color: 'text-text-muted',  bar: 'bg-surface-variant', empty: 'No items queued',     acceptFrom: null           as ItemStatus | null },
  { status: 'preparing' as ItemStatus, title: 'Cooking',  icon: 'ri-restaurant-line',      color: 'text-orange-400', bar: 'bg-orange-400',      empty: 'Nothing cooking',      acceptFrom: 'pending'      as ItemStatus | null },
  { status: 'ready'     as ItemStatus, title: 'Ready',    icon: 'ri-checkbox-circle-line', color: 'text-primary',    bar: 'bg-primary',         empty: 'Nothing plated yet',  acceptFrom: 'preparing'    as ItemStatus | null },
]

// ─── Item Ticket Card ─────────────────────────────────────────────────────────

function ItemTicket({ ticket, now, onAdvance, faded, onDragStart, onDragEnd }: {
  ticket: ItemTicket
  now: number
  onAdvance: (itemId: string) => void
  faded: boolean
  onDragStart: (itemId: string, status: ItemStatus) => void
  onDragEnd: () => void
}) {
  const [busy, setBusy] = useState(false)
  const next = NEXT[ticket.itemStatus]
  const canDrag = next !== null

  async function handleAdvance() {
    setBusy(true)
    await onAdvance(ticket.itemId)
    setBusy(false)
  }

  const bar = ticket.itemStatus === 'pending' ? 'bg-surface-variant' : ticket.itemStatus === 'preparing' ? 'bg-orange-400' : 'bg-primary'
  const qtyColor = ticket.itemStatus === 'preparing' ? 'text-orange-400' : ticket.itemStatus === 'ready' ? 'text-primary' : 'text-text-muted'

  return (
    <div
      draggable={canDrag}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', `${ticket.itemId}|${ticket.itemStatus}`)
        onDragStart(ticket.itemId, ticket.itemStatus)
      }}
      onDragEnd={onDragEnd}
      className={`bg-surface rounded-2xl border overflow-hidden flex flex-col select-none transition-all duration-150 ${
        faded ? 'opacity-30 scale-[0.97]' : 'border-outline'
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className={`h-1.5 shrink-0 ${bar}`} />

      {/* Header: table + order + time */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          {canDrag && <Icon name="ri-draggable" className="text-text-muted/30 text-sm mt-0.5 shrink-0" />}
          <div className="min-w-0">
            <p className="text-base font-black text-text-main leading-none">{ticket.tableLabel}</p>
            <p className="text-[10px] text-text-muted font-mono mt-0.5">#{ticket.orderId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border tabular-nums ${elapsedCls(ticket.orderCreatedAt, now, ticket.itemStatus)}`}>
            {elapsed(ticket.orderCreatedAt, now)}
          </span>
          <span className="text-[10px] text-text-muted">
            {new Date(ticket.orderCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Item */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <span className={`text-2xl font-black w-9 text-center shrink-0 leading-none ${qtyColor}`}>
          {ticket.quantity}
        </span>
        <span className="text-sm font-bold text-text-main leading-snug">{ticket.itemName}</span>
      </div>

      {/* Order notes */}
      {ticket.orderNotes && (
        <div className="mx-4 mb-3 bg-warning/10 border border-warning/25 rounded-xl px-3 py-2 flex gap-2 items-start">
          <Icon name="ri-alarm-warning-line" className="text-warning text-sm shrink-0 mt-0.5" />
          <p className="text-xs text-text-main italic leading-snug">{ticket.orderNotes}</p>
        </div>
      )}

      {/* Action */}
      <div className="px-4 pb-4 pt-2 border-t border-outline flex justify-end">
        {ticket.itemStatus === 'pending' && (
          <button onClick={handleAdvance} disabled={busy}
            className="flex items-center gap-1.5 bg-orange-500 text-white font-bold text-sm py-2 px-4 rounded-xl active:scale-95 disabled:opacity-50 shadow-md shadow-orange-500/20">
            {busy ? <Icon name="ri-loader-4-line" className="animate-spin" /> : <><Icon name="ri-restaurant-line" />Cook</>}
          </button>
        )}
        {ticket.itemStatus === 'preparing' && (
          <button onClick={handleAdvance} disabled={busy}
            className="flex items-center gap-1.5 bg-primary text-black font-bold text-sm py-2 px-4 rounded-xl active:scale-95 disabled:opacity-50 shadow-md shadow-primary/20">
            {busy ? <Icon name="ri-loader-4-line" className="animate-spin" /> : <><Icon name="ri-checkbox-circle-line" />Plated</>}
          </button>
        )}
        {ticket.itemStatus === 'ready' && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-bold">
            <Icon name="ri-walk-line" />Waiter picks up
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Drop Column ──────────────────────────────────────────────────────────────

function KitchenColumn({ col, tickets, now, onAdvance, onDrop, dragRef, onCardDragStart, onCardDragEnd }: {
  col: typeof COL_CONFIG[number]
  tickets: ItemTicket[]
  now: number
  onAdvance: (itemId: string) => void
  onDrop: (itemId: string, from: ItemStatus, to: ItemStatus) => void
  dragRef: React.RefObject<{ id: string; fromStatus: ItemStatus } | null>
  onCardDragStart: (id: string, status: ItemStatus) => void
  onCardDragEnd: () => void
}) {
  const [over, setOver] = useState(false)

  function canAccept() {
    const d = dragRef.current
    return d !== null && col.acceptFrom !== null && d.fromStatus === col.acceptFrom
  }

  function onDragOver(e: React.DragEvent) {
    if (!canAccept()) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOver(true)
  }

  function onDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
  }

  function onDropEvt(e: React.DragEvent) {
    e.preventDefault()
    setOver(false)
    const d = dragRef.current
    if (!d || !canAccept()) return
    onDrop(d.id, d.fromStatus, col.status)
  }

  const active = over && canAccept()

  return (
    <div
      className={`flex flex-col min-h-0 rounded-2xl transition-all duration-150 ${
        active ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5' :
        canAccept() ? 'ring-1 ring-primary/20 ring-offset-1 ring-offset-background' : ''
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
        {active && <span className="text-[10px] font-black text-primary ml-1 animate-pulse">Drop here ↓</span>}
        <span className={`ml-auto text-[11px] font-black px-2 py-0.5 rounded-lg bg-current/15 ${col.color}`}>
          {tickets.length}
        </span>
      </div>

      {active && <div className="h-0.5 mx-1 mb-2 rounded-full bg-primary shrink-0" />}

      {/* Tickets */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pb-2 min-h-0">
        {tickets.length === 0 && !active ? (
          <div className={`flex flex-col items-center gap-2 py-12 opacity-30 ${col.color}`}>
            <Icon name={col.icon} className="text-3xl" />
            <p className="text-xs font-medium text-text-muted">{col.empty}</p>
          </div>
        ) : (
          <>
            {tickets.map(t => (
              <ItemTicket
                key={t.itemId}
                ticket={t}
                now={now}
                onAdvance={onAdvance}
                faded={dragRef.current?.id === t.itemId}
                onDragStart={onCardDragStart}
                onDragEnd={onCardDragEnd}
              />
            ))}
            {active && (
              <div className="rounded-2xl border-2 border-dashed border-primary/50 h-16 flex items-center justify-center bg-primary/5">
                <p className="text-primary text-xs font-bold">Release to move here</p>
              </div>
            )}
          </>
        )}
        {tickets.length === 0 && active && (
          <div className="rounded-2xl border-2 border-dashed border-primary/60 h-24 flex items-center justify-center bg-primary/5">
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

  const [tickets, setTickets] = useState<ItemTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const dragRef = useRef<{ id: string; fromStatus: ItemStatus } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const prevPendingCount = useRef(0)

  function ordersToTickets(orders: RawOrder[]): ItemTicket[] {
    const result: ItemTicket[] = []
    for (const order of orders) {
      if (!['pending', 'preparing', 'ready'].includes(order.status)) continue
      const tableLabel = order.table
        ? `T-${String(order.table.table_number).padStart(2, '0')}`
        : 'Takeaway'
      for (const item of order.order_items ?? []) {
        result.push({
          itemId: item.id,
          orderId: order.id,
          orderCreatedAt: item.created_at ?? order.created_at,
          orderNotes: order.notes,
          tableLabel,
          itemName: item.menu_item?.name ?? '?',
          quantity: item.quantity,
          itemStatus: item.item_status ?? 'pending',
        })
      }
    }
    return result
  }

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiGet<RawOrder[]>('/orders')
      const t = ordersToTickets(data)
      const newPending = t.filter(x => x.itemStatus === 'pending').length
      if (newPending > prevPendingCount.current && prevPendingCount.current !== 0) {
        if (Notification.permission === 'granted') {
          new Notification('New items', { body: `${newPending} item${newPending > 1 ? 's' : ''} queued`, icon: '/favicon.ico' })
        }
      }
      prevPendingCount.current = newPending
      setTickets(t)
      setLastRefresh(new Date())
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => {
    const t = setInterval(fetchOrders, 5_000)
    return () => clearInterval(t)
  }, [fetchOrders])

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  async function advance(itemId: string) {
    const ticket = tickets.find(t => t.itemId === itemId)
    if (!ticket) return
    const next = NEXT[ticket.itemStatus]
    if (!next) return
    await moveTo(itemId, ticket.itemStatus, next)
  }

  async function moveTo(itemId: string, from: ItemStatus, to: ItemStatus) {
    // Optimistic
    setTickets(prev => prev.map(t => t.itemId === itemId ? { ...t, itemStatus: to } : t))
    try {
      await apiPatch(`/orders/items/${itemId}/status`, { item_status: to })
    } catch {
      setTickets(prev => prev.map(t => t.itemId === itemId ? { ...t, itemStatus: from } : t))
    }
  }

  function handleDrop(itemId: string, from: ItemStatus, to: ItemStatus) {
    if (NEXT[from] !== to) return
    dragRef.current = null
    setDraggingId(null)
    moveTo(itemId, from, to)
  }

  // Sort: oldest order first (longest wait at top)
  const byAge = (a: ItemTicket, b: ItemTicket) => +new Date(a.orderCreatedAt) - +new Date(b.orderCreatedAt)
  const byStatus = (s: ItemStatus) => tickets.filter(t => t.itemStatus === s).sort(byAge)

  const queued   = byStatus('pending')
  const cooking  = byStatus('preparing')
  const ready    = byStatus('ready')
  const byCol: Record<ItemStatus, ItemTicket[]> = { pending: queued, preparing: cooking, ready }

  const timeStr = lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-14 bg-background border-b border-outline flex items-center px-4 gap-3">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-orange-500/30">
          <Icon name="ri-restaurant-line" className="text-base" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-main leading-tight">Kitchen Display</p>
          <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest leading-none">{displayName}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {queued.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-variant text-text-muted text-xs font-bold">
              <Icon name="ri-timer-line" className="text-sm" />{queued.length} queued
            </span>
          )}
          {cooking.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-bold">
              <Icon name="ri-restaurant-line" className="text-sm" />{cooking.length} cooking
            </span>
          )}
          {ready.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold animate-pulse">
              <Icon name="ri-checkbox-circle-line" className="text-sm" />{ready.length} ready
            </span>
          )}
        </div>

        <button onClick={fetchOrders} className="hidden sm:flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-main font-mono">
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
          <Icon name="ri-timer-line" className="text-xs" />{queued.length}
        </span>
        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-500/10 text-orange-400 text-xs font-bold">
          <Icon name="ri-restaurant-line" className="text-xs" />{cooking.length}
        </span>
        {ready.length > 0 && (
          <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold animate-pulse">
            <Icon name="ri-checkbox-circle-line" className="text-xs" />{ready.length}
          </span>
        )}
        <button onClick={fetchOrders} className="shrink-0 ml-auto flex items-center gap-1 text-[10px] text-text-muted font-mono">
          <Icon name="ri-refresh-line" className="text-xs" />{timeStr}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon name="ri-loader-4-line" className="text-4xl animate-spin text-orange-400" />
            <p className="text-sm font-medium text-text-muted">Loading…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 min-h-0 overflow-hidden p-3 gap-3">
          {COL_CONFIG.map((col, i) => (
            <div key={col.status} className={`flex flex-col min-h-0 overflow-hidden ${i < 2 ? 'border-r border-outline pr-3' : ''}`}>
              <KitchenColumn
                col={col}
                tickets={byCol[col.status]}
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
    </div>
  )
}
