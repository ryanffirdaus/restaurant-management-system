import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPatch } from '../../lib/api'
import Icon from '../../components/Icon'
import Button from '../../components/ui/Button'
import { tones, itemStatus, type Tone } from '../../lib/status'

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

// Ticket age chip. Thresholds are this screen's own (5 / 10 min); colours follow ageTone's mapping.
function elapsedTone(createdAt: string, now: number, status: ItemStatus): Tone {
  if (status === 'ready') return 'ready'
  const m = (now - +new Date(createdAt)) / 60_000
  if (m < 5)  return 'neutral'
  if (m < 10) return 'progress'
  return 'danger'
}

function elapsedCls(createdAt: string, now: number, status: ItemStatus): string {
  const t = tones[elapsedTone(createdAt, now, status)]
  return `${t.text} ${t.soft} ${t.border}`
}

const COL_CONFIG = [
  { status: 'pending'   as ItemStatus, empty: 'No items queued',    acceptFrom: null        as ItemStatus | null },
  { status: 'preparing' as ItemStatus, empty: 'Nothing cooking',    acceptFrom: 'pending'   as ItemStatus | null },
  { status: 'ready'     as ItemStatus, empty: 'Nothing plated yet', acceptFrom: 'preparing' as ItemStatus | null },
].map(c => ({ ...c, ...itemStatus[c.status], t: tones[itemStatus[c.status].tone] }))

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

  const tone = tones[itemStatus[ticket.itemStatus].tone]

  return (
    <div
      draggable={canDrag}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', `${ticket.itemId}|${ticket.itemStatus}`)
        onDragStart(ticket.itemId, ticket.itemStatus)
      }}
      onDragEnd={onDragEnd}
      className={`bg-surface rounded-xl border border-line overflow-hidden flex flex-col select-none transition-all duration-150 ${
        faded ? 'opacity-30 scale-[0.97]' : ''
      } ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className={`h-1 shrink-0 ${tone.solid}`} />

      {/* Header: table + order + time */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          {canDrag && <Icon name="ri-draggable" className="text-ink-3 text-base mt-1 shrink-0" />}
          <div className="min-w-0">
            <p className="text-2xl font-semibold text-ink leading-none num">{ticket.tableLabel}</p>
            <p className="text-xs text-ink-3 font-mono mt-1">#{ticket.orderId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-sm font-semibold num px-2 py-0.5 rounded border ${elapsedCls(ticket.orderCreatedAt, now, ticket.itemStatus)}`}>
            {elapsed(ticket.orderCreatedAt, now)}
          </span>
          <span className="text-xs text-ink-3 num">
            {new Date(ticket.orderCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Item */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <span className={`text-2xl font-semibold num w-10 text-center shrink-0 leading-none ${tone.text}`}>
          {ticket.quantity}×
        </span>
        <span className="text-lg font-semibold text-ink leading-snug">{ticket.itemName}</span>
      </div>

      {/* Order notes */}
      {ticket.orderNotes && (
        <div className={`mx-4 mb-3 ${tones.progress.soft} border ${tones.progress.border} rounded px-3 py-2 flex gap-2 items-start`}>
          <Icon name="ri-alarm-warning-line" className={`${tones.progress.text} text-base shrink-0 mt-0.5`} />
          <p className="text-sm font-medium text-ink leading-snug">{ticket.orderNotes}</p>
        </div>
      )}

      {/* Action */}
      <div className="px-4 pb-4 pt-3 border-t border-line flex">
        {ticket.itemStatus === 'pending' && (
          <Button variant="primary" size="lg" onClick={handleAdvance} disabled={busy} className="w-full">
            {busy ? <Icon name="ri-loader-4-line" className="animate-spin" /> : <><Icon name="ri-fire-line" />Cook</>}
          </Button>
        )}
        {ticket.itemStatus === 'preparing' && (
          <Button variant="primary" size="lg" onClick={handleAdvance} disabled={busy} className="w-full">
            {busy ? <Icon name="ri-loader-4-line" className="animate-spin" /> : <><Icon name="ri-checkbox-circle-line" />Plated</>}
          </Button>
        )}
        {ticket.itemStatus === 'ready' && (
          <div className={`w-full h-12 flex items-center justify-center gap-2 rounded border ${tone.soft} ${tone.border} ${tone.text} text-base font-semibold`}>
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
      className={`flex flex-col min-h-0 rounded-xl transition-all duration-150 ${
        active ? 'ring-2 ring-brand-ink ring-offset-2 ring-offset-background bg-brand/5' :
        canAccept() ? 'ring-1 ring-brand-ink/30 ring-offset-1 ring-offset-background' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDropEvt}
    >
      {/* Header */}
      <div className={`flex items-center gap-3 px-3 py-2.5 mb-3 shrink-0 rounded-xl border ${col.t.soft} ${col.t.border}`}>
        <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${col.t.solid}`}>
          <Icon name={col.icon} className="text-xl text-canvas" />
        </div>
        <h2 className={`font-semibold text-xl ${col.t.text}`}>{col.label}</h2>
        {active && <span className="text-sm font-semibold text-brand-ink ml-1 animate-pulse">Drop here ↓</span>}
        <span className={`ml-auto min-w-[2.25rem] h-9 px-2 flex items-center justify-center rounded text-xl font-semibold num text-canvas ${col.t.solid}`}>
          {tickets.length}
        </span>
      </div>

      {active && <div className="h-1 mx-1 mb-2 rounded-full bg-brand shrink-0" />}

      {/* Tickets */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-2 min-h-0">
        {tickets.length === 0 && !active ? (
          <div className="flex flex-col items-center gap-2 py-12 text-ink-3">
            <Icon name={col.icon} className="text-4xl" />
            <p className="text-base font-medium">{col.empty}</p>
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
              <div className="rounded-xl border-2 border-dashed border-brand-ink/60 h-16 flex items-center justify-center bg-brand/5">
                <p className="text-brand-ink text-base font-semibold">Release to move here</p>
              </div>
            )}
          </>
        )}
        {tickets.length === 0 && active && (
          <div className="rounded-xl border-2 border-dashed border-brand-ink/60 h-24 flex items-center justify-center bg-brand/5">
            <p className="text-brand-ink text-base font-semibold">Release to move here</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Kitchen App ─────────────────────────────────────────────────────────

export default function KitchenApp() {
  const { profile, user, logout } = useAuth()
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
      <header className="shrink-0 h-16 bg-sidebar border-b border-sidebar-line flex items-center px-4 gap-3">
        <img src="/logo-wordmark-dark.svg" alt="Servio" className="h-6 w-auto shrink-0" />
        <span className="w-px h-7 bg-sidebar-line shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-sidebar-ink leading-tight">Kitchen Display</p>
          <p className="text-xs text-sidebar-ink-2 uppercase font-mono tracking-mono leading-none mt-0.5">{displayName}</p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          {queued.length > 0 && (
            <span className={`flex items-center gap-2 h-10 px-3 rounded border text-base font-semibold bg-surface border-transparent ${tones.pending.text}`}>
              <Icon name={itemStatus.pending.icon} className="text-lg" /><span className="num">{queued.length}</span> {itemStatus.pending.label.toLowerCase()}
            </span>
          )}
          {cooking.length > 0 && (
            <span className={`flex items-center gap-2 h-10 px-3 rounded border text-base font-semibold bg-surface border-transparent ${tones.progress.text}`}>
              <Icon name={itemStatus.preparing.icon} className="text-lg" /><span className="num">{cooking.length}</span> {itemStatus.preparing.label.toLowerCase()}
            </span>
          )}
          {ready.length > 0 && (
            <span className={`flex items-center gap-2 h-10 px-3 rounded border text-base font-semibold bg-surface border-transparent ${tones.ready.text}`}>
              <span className="status-pulse is-live" />
              <Icon name={itemStatus.ready.icon} className="text-lg" /><span className="num">{ready.length}</span> {itemStatus.ready.label.toLowerCase()}
            </span>
          )}
        </div>

        <button onClick={fetchOrders} className="hidden sm:flex items-center gap-1.5 h-10 px-2 rounded text-sm text-sidebar-ink-2 hover:text-sidebar-ink hover:bg-sidebar-raised font-mono num transition-colors duration-150">
          <Icon name="ri-refresh-line" className="text-base" />{timeStr}
        </button>
        <button onClick={logout} aria-label="Log out" className="w-12 h-12 rounded flex items-center justify-center text-sidebar-ink-2 hover:text-sidebar-ink hover:bg-sidebar-raised transition-colors duration-150">
          <Icon name="ri-logout-box-r-line" className="text-xl" />
        </button>
      </header>

      {/* Mobile stats */}
      <div className="sm:hidden flex items-center gap-2 px-4 py-2 bg-surface border-b border-line overflow-x-auto no-scrollbar shrink-0">
        <span className={`shrink-0 flex items-center gap-1.5 h-9 px-2.5 rounded border text-sm font-semibold ${tones.pending.soft} ${tones.pending.border} ${tones.pending.text}`}>
          <Icon name={itemStatus.pending.icon} className="text-base" /><span className="num">{queued.length}</span>
        </span>
        <span className={`shrink-0 flex items-center gap-1.5 h-9 px-2.5 rounded border text-sm font-semibold ${tones.progress.soft} ${tones.progress.border} ${tones.progress.text}`}>
          <Icon name={itemStatus.preparing.icon} className="text-base" /><span className="num">{cooking.length}</span>
        </span>
        {ready.length > 0 && (
          <span className={`shrink-0 flex items-center gap-1.5 h-9 px-2.5 rounded border text-sm font-semibold ${tones.ready.soft} ${tones.ready.border} ${tones.ready.text}`}>
            <span className="status-pulse is-live" />
            <Icon name={itemStatus.ready.icon} className="text-base" /><span className="num">{ready.length}</span>
          </span>
        )}
        <button onClick={fetchOrders} className="shrink-0 ml-auto flex items-center gap-1 text-xs text-ink-2 font-mono num">
          <Icon name="ri-refresh-line" className="text-sm" />{timeStr}
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon name="ri-loader-4-line" className="text-4xl animate-spin text-ink-2" />
            <p className="text-base font-medium text-ink-2">Loading…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 min-h-0 overflow-hidden p-3 gap-3">
          {COL_CONFIG.map((col, i) => (
            <div key={col.status} className={`flex flex-col min-h-0 overflow-hidden ${i < 2 ? 'border-r border-line pr-3' : ''}`}>
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
