import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { apiGet, apiPost, apiPatch, formatIDR } from '../../lib/api'
import Icon from '../../components/Icon'
import { Textarea } from '../../components/ui'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestaurantTable {
  id: string
  table_number: number
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  notes: string | null
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: string | null
  available: boolean
}

type ItemStatus = 'pending' | 'preparing' | 'ready'

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  price_at_purchase: number
  item_status: ItemStatus
  menu_item?: { name: string }
}

interface Order {
  id: string
  status: string
  total_price: number | null
  notes: string | null
  table_id: string | null
  created_at: string
  order_items?: OrderItem[]
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tableStyle(status: string) {
  switch (status) {
    case 'available': return { border: 'border-primary/50', bg: 'bg-primary/10', numBg: 'bg-primary/20', numText: 'text-primary', dot: 'bg-primary', dotLabel: 'text-primary', label: 'Available' }
    case 'occupied':  return { border: 'border-orange-400/50', bg: 'bg-orange-500/10', numBg: 'bg-orange-500/20', numText: 'text-orange-400', dot: 'bg-orange-400', dotLabel: 'text-orange-400', label: 'Occupied' }
    case 'reserved':  return { border: 'border-blue-400/50', bg: 'bg-blue-500/10', numBg: 'bg-blue-500/20', numText: 'text-blue-400', dot: 'bg-blue-400', dotLabel: 'text-blue-400', label: 'Reserved' }
    case 'cleaning':  return { border: 'border-danger/50', bg: 'bg-danger/10', numBg: 'bg-danger/20', numText: 'text-danger', dot: 'bg-danger', dotLabel: 'text-danger', label: 'Cleaning' }
    default:          return { border: 'border-outline', bg: 'bg-surface-variant', numBg: 'bg-surface-variant', numText: 'text-text-muted', dot: 'bg-text-muted', dotLabel: 'text-text-muted', label: status }
  }
}

function orderStatusStyle(status: string) {
  switch (status) {
    case 'pending':   return { bg: 'bg-surface-variant', text: 'text-text-muted' }
    case 'preparing': return { bg: 'bg-orange-500/15', text: 'text-orange-400' }
    case 'ready':     return { bg: 'bg-primary/15', text: 'text-primary' }
    case 'completed': return { bg: 'bg-blue-500/15', text: 'text-blue-400' }
    case 'cancelled': return { bg: 'bg-danger/15', text: 'text-danger' }
    default:          return { bg: 'bg-surface-variant', text: 'text-text-muted' }
  }
}

const CATEGORY_COLOR: Record<string, string> = {
  'Main Courses': 'text-emerald-400', 'main': 'text-emerald-400',
  'Appetizers': 'text-amber-400', 'appetizer': 'text-amber-400',
  'Beverages': 'text-sky-400', 'drinks': 'text-sky-400',
  'Desserts': 'text-pink-400', 'dessert': 'text-pink-400',
  'Pizza': 'text-red-400',
  'Snacks': 'text-orange-400', 'snacks': 'text-orange-400',
}

// Waiter can only: cancel a pending order, or mark a ready order as served.
// pending→preparing and preparing→ready are kitchen-only actions.
const WAITER_ACTION: Record<string, { label: string; status: string; cls: string } | null> = {
  pending:   null,
  preparing: null,
  ready:     { label: 'Mark Served', status: 'completed', cls: 'bg-blue-500/15 text-blue-400 border-blue-400/30' },
}

// Informational label shown to waiter for kitchen-controlled statuses
const STATUS_INFO: Record<string, { icon: string; label: string; cls: string }> = {
  pending:   { icon: 'ri-time-line',       label: 'Waiting for kitchen…', cls: 'text-text-muted bg-surface-variant' },
  preparing: { icon: 'ri-restaurant-line', label: 'Kitchen is cooking…',  cls: 'text-orange-400 bg-orange-500/10' },
}

function StatusPill({ status }: { status: string }) {
  const s = orderStatusStyle(status)
  return (
    <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide ${s.bg} ${s.text}`}>
      {status}
    </span>
  )
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ table, activeOrders, onClick }: {
  table: RestaurantTable
  activeOrders: Order[]
  onClick: () => void
}) {
  const s = tableStyle(table.status)
  // Count at item level for accurate badges
  const allItems = activeOrders.flatMap(o => o.order_items ?? [])
  const readyCount = allItems.filter(i => i.item_status === 'ready').length
  const cookingCount = allItems.filter(i => i.item_status === 'preparing').length
  const hasAlert = readyCount > 0

  return (
    <button
      onClick={onClick}
      className={`relative rounded-2xl border-2 ${s.border} ${s.bg} p-4 flex flex-col gap-2.5 text-left active:scale-[0.97] transition-transform touch-manipulation w-full min-h-[120px]`}
    >
      {/* Alert dot for ready */}
      {hasAlert && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/40" />
      )}

      {/* Number badge */}
      <div className={`w-12 h-12 rounded-xl ${s.numBg} flex items-center justify-center`}>
        <span className={`text-lg font-black ${s.numText}`}>{table.table_number}</span>
      </div>

      {/* Label */}
      <div>
        <p className="font-bold text-text-main text-sm leading-tight">
          T-{String(table.table_number).padStart(2, '0')}
        </p>
        <p className="text-[11px] text-text-muted">{table.capacity} seats</p>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1 mt-auto">
        {readyCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded-md leading-none">
            <Icon name="ri-checkbox-circle-line" className="text-[10px]" />
            {readyCount} ready
          </span>
        )}
        {cookingCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded-md leading-none">
            <Icon name="ri-restaurant-line" className="text-[10px]" />
            {cookingCount} cooking
          </span>
        )}
        {!readyCount && !cookingCount && (
          <span className={`flex items-center gap-1 text-[10px] font-bold ${s.dotLabel}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
        )}
      </div>
    </button>
  )
}

// ─── Item status badge ────────────────────────────────────────────────────────

function ItemStatusDot({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, { dot: string; label: string; text: string }> = {
    pending:   { dot: 'bg-text-muted',  label: 'Queued',  text: 'text-text-muted' },
    preparing: { dot: 'bg-orange-400',  label: 'Cooking', text: 'text-orange-400' },
    ready:     { dot: 'bg-primary',     label: 'Ready',   text: 'text-primary' },
  }
  const s = map[status]
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot} ${status === 'ready' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  )
}

// ─── Order Card (in session panel) ───────────────────────────────────────────

function OrderCard({ order, onStatusChange }: {
  order: Order
  onStatusChange: (id: string, status: string) => void
}) {
  const [loading, setLoading] = useState(false)

  const items = order.order_items ?? []
  const allReady = items.length > 0 && items.every(i => i.item_status === 'ready')
  const anyReady = items.some(i => i.item_status === 'ready')

  // Derive a visual accent from items collectively
  const accentBar = allReady ? 'bg-primary' : anyReady ? 'bg-primary/40' : order.status === 'pending' ? 'bg-text-muted/25' : 'bg-orange-400'

  async function markServed() {
    setLoading(true)
    await onStatusChange(order.id, 'completed')
    setLoading(false)
  }

  return (
    <div className="card-bg rounded-2xl border border-outline overflow-hidden">
      <div className={`h-1.5 w-full ${accentBar}`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-text-muted tracking-wide">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <StatusPill status={order.status} />
        </div>

        {/* Per-item rows with individual status */}
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              item.item_status === 'ready' ? 'bg-primary/8 border border-primary/20' :
              item.item_status === 'preparing' ? 'bg-orange-500/8 border border-orange-400/20' :
              'bg-surface-variant border border-transparent'
            }`}>
              <span className={`font-black text-base w-6 text-center shrink-0 ${
                item.item_status === 'ready' ? 'text-primary' :
                item.item_status === 'preparing' ? 'text-orange-400' : 'text-text-muted'
              }`}>{item.quantity}</span>
              <span className="text-sm text-text-main flex-1 min-w-0 truncate">
                {item.menu_item?.name ?? '?'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-text-muted tabular-nums">
                  {formatIDR(item.quantity * item.price_at_purchase)}
                </span>
                <ItemStatusDot status={item.item_status ?? 'pending'} />
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-warning/10 border border-warning/20 rounded-xl px-3 py-2 flex gap-2 items-start">
            <Icon name="ri-sticky-note-line" className="text-warning text-sm mt-0.5 shrink-0" />
            <p className="text-xs text-text-main italic">{order.notes}</p>
          </div>
        )}

        {/* Total + time */}
        <div className="flex justify-between items-center text-xs text-text-muted pt-1 border-t border-outline">
          <span className="font-bold text-text-main tabular-nums">
            {order.total_price != null ? formatIDR(order.total_price) : '—'}
          </span>
          <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Cancel (only while pending — no items started yet) */}
        {order.status === 'pending' && items.every(i => i.item_status === 'pending') && (
          <button
            onClick={() => onStatusChange(order.id, 'cancelled')}
            className="flex items-center gap-1.5 text-danger text-xs font-bold touch-manipulation self-start"
          >
            <Icon name="ri-close-circle-line" className="text-sm" />Cancel order
          </button>
        )}

        {/* Mark Served — only when ALL items are ready */}
        {allReady && (
          <button
            onClick={markServed}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-bold border border-blue-400/30 bg-blue-500/15 text-blue-400 transition-colors active:scale-[0.98] touch-manipulation"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Icon name="ri-loader-4-line" className="animate-spin" /> Updating…</span>
              : <span className="flex items-center justify-center gap-2"><Icon name="ri-service-line" className="text-base" />Mark Served</span>
            }
          </button>
        )}

        {/* Partial ready prompt */}
        {!allReady && anyReady && (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-variant rounded-xl px-3 py-2.5">
            <Icon name="ri-time-line" className="text-sm shrink-0" />
            Some items ready — waiting for rest from kitchen
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Session Screen (full-screen on mobile) ───────────────────────────────────

function SessionScreen({ table, orders, menuItems, userId, onBack, onRefresh }: {
  table: RestaurantTable
  orders: Order[]
  menuItems: MenuItem[]
  userId: string
  onBack: () => void
  onRefresh: () => Promise<void>
}) {
  const [tab, setTab] = useState<'orders' | 'menu'>('orders')
  const [cart, setCart] = useState<CartItem[]>([])
  const [notes, setNotes] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const menuScrollRef = useRef<HTMLDivElement>(null)

  const s = tableStyle(table.status)
  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'completed')
  const cartTotal = cart.reduce((s, c) => s + c.menuItem.price * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  const categories = ['all', ...Array.from(new Set(menuItems.map(m => m.category ?? 'Other')))]
  const filteredMenu = menuItems.filter(m => {
    const matchesCat = catFilter === 'all' || m.category === catFilter
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase())
    return matchesCat && matchesSearch
  })

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const ex = prev.find(c => c.menuItem.id === item.id)
      if (ex) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  function setQty(itemId: string, qty: number) {
    if (qty === 0) setCart(prev => prev.filter(c => c.menuItem.id !== itemId))
    else setCart(prev => prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: qty } : c))
  }

  async function placeOrder() {
    if (cart.length === 0) return
    setSaving(true)
    try {
      await apiPost('/orders', {
        userId,
        tableId: table.id,
        notes: notes || null,
        items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
      })
      await apiPatch(`/tables/${table.id}/status`, { status: 'occupied' })
      setCart([])
      setNotes('')
      setCartOpen(false)
      setTab('orders')
      await onRefresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(orderId: string, status: string) {
    await apiPatch(`/orders/${orderId}/status`, { status }).catch(() => {})
    await onRefresh()
  }

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-outline bg-surface/60 backdrop-blur-sm shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted active:bg-surface-variant touch-manipulation"
        >
          <Icon name="ri-arrow-left-line" className="text-xl" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-main leading-tight">Table {table.table_number}</p>
          <p className="text-[11px] text-text-muted">{table.capacity} seats</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl ${s.bg} border ${s.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className={`text-[10px] font-bold ${s.dotLabel}`}>{s.label}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-outline shrink-0">
        {[
          { key: 'orders' as const, icon: 'ri-bill-line', label: 'Orders', count: activeOrders.length },
          { key: 'menu' as const, icon: 'ri-restaurant-2-line', label: 'New Order', count: cartCount },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-bold border-b-2 transition-colors touch-manipulation ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted'
            }`}
          >
            <Icon name={t.icon} className="text-base" />
            {t.label}
            {t.count > 0 && (
              <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                tab === t.key ? 'bg-primary text-black' : 'bg-surface-variant text-text-muted'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'orders' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3 pb-safe">
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-text-muted">
              <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center">
                <Icon name="ri-bill-line" className="text-3xl opacity-40" />
              </div>
              <p className="text-sm font-medium">No active orders</p>
              <button
                onClick={() => setTab('menu')}
                className="px-5 py-2.5 rounded-xl bg-primary/15 text-primary text-sm font-bold touch-manipulation"
              >
                + Create order
              </button>
            </div>
          ) : activeOrders.map(order => (
            <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}

          {/* Closed orders */}
          {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length > 0 && (
            <details className="group">
              <summary className="text-xs text-text-muted py-3 flex items-center gap-1.5 cursor-pointer select-none list-none touch-manipulation">
                <Icon name="ri-arrow-right-s-line" className="text-sm group-open:rotate-90 transition-transform" />
                {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length} closed
              </summary>
              <div className="mt-1 space-y-2">
                {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').map(order => (
                  <div key={order.id} className="rounded-xl border border-outline p-3 opacity-50 flex justify-between items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <StatusPill status={order.status} />
                    <span className="text-xs text-text-muted tabular-nums ml-auto">
                      {order.total_price != null ? formatIDR(order.total_price) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search + category */}
          <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
            <div className="relative">
              <Icon name="ri-search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-base pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="w-full pl-9 pr-3 py-2.5 bg-surface-variant border border-outline rounded-xl text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors touch-manipulation ${
                    catFilter === cat ? 'bg-primary text-black' : 'bg-surface-variant text-text-muted'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu list */}
          <div ref={menuScrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-28 space-y-2">
            {filteredMenu.map(item => {
              const inCart = cart.find(c => c.menuItem.id === item.id)
              const catColor = CATEGORY_COLOR[item.category ?? ''] ?? 'text-text-muted'
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    inCart ? 'border-primary/50 bg-primary/5' : 'border-outline bg-surface'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-main truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold ${catColor}`}>{item.category ?? 'Other'}</span>
                      <span className="text-xs font-bold text-primary tabular-nums">{formatIDR(item.price)}</span>
                    </div>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setQty(item.id, inCart.quantity - 1)} className="w-8 h-8 rounded-xl bg-surface-variant flex items-center justify-center font-bold text-text-muted active:bg-danger/10 active:text-danger touch-manipulation">−</button>
                      <span className="w-7 text-center text-sm font-black text-text-main">{inCart.quantity}</span>
                      <button onClick={() => setQty(item.id, inCart.quantity + 1)} className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center font-bold text-primary touch-manipulation">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 active:scale-95 touch-manipulation"
                    >
                      <Icon name="ri-add-line" className="text-xl font-bold" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Cart FAB / bottom bar */}
          {cartCount > 0 && !cartOpen && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-outline">
              <button
                onClick={() => setCartOpen(true)}
                className="w-full bg-primary text-black font-bold text-base py-4 rounded-2xl flex items-center justify-between px-5 active:scale-[0.98] touch-manipulation shadow-lg shadow-primary/30"
              >
                <span className="w-7 h-7 rounded-xl bg-black/20 flex items-center justify-center text-sm font-black">{cartCount}</span>
                <span>View Order</span>
                <span className="tabular-nums">{formatIDR(cartTotal)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cart bottom sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col justify-end">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="bg-background rounded-t-3xl border-t border-outline max-h-[85vh] flex flex-col">
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-outline" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <p className="text-base font-bold text-text-main">Your Order</p>
              <button onClick={() => setCartOpen(false)} className="text-text-muted p-1 touch-manipulation">
                <Icon name="ri-close-line" className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 space-y-2 pb-2">
              {/* Cart items */}
              {cart.map(c => (
                <div key={c.menuItem.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setQty(c.menuItem.id, c.quantity - 1)} className="w-8 h-8 rounded-xl bg-surface-variant flex items-center justify-center font-bold text-text-muted touch-manipulation">−</button>
                    <span className="w-6 text-center text-sm font-black text-text-main">{c.quantity}</span>
                    <button onClick={() => setQty(c.menuItem.id, c.quantity + 1)} className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center font-bold text-primary touch-manipulation">+</button>
                  </div>
                  <span className="flex-1 text-sm text-text-main truncate">{c.menuItem.name}</span>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0">{formatIDR(c.menuItem.price * c.quantity)}</span>
                </div>
              ))}

              {/* Notes */}
              <div className="pt-2">
                <Textarea
                  label="Notes (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Allergies, special requests…"
                  rows={2}
                />
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-3 border-t border-outline">
                <span className="font-semibold text-text-muted">Total</span>
                <span className="text-xl font-black text-primary tabular-nums">{formatIDR(cartTotal)}</span>
              </div>
            </div>

            {/* Place order button */}
            <div className="px-5 py-4 border-t border-outline shrink-0">
              <button
                onClick={placeOrder}
                disabled={saving}
                className="w-full bg-primary text-black font-bold text-base py-4 rounded-2xl active:scale-[0.98] touch-manipulation shadow-lg shadow-primary/30 disabled:opacity-50"
              >
                {saving ? 'Placing order…' : `Place Order · ${formatIDR(cartTotal)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Waiter App ──────────────────────────────────────────────────────────

export default function WaiterApp() {
  const { user, profile, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()

  const displayName = (profile?.name as string) ?? user?.email ?? 'Waiter'

  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null)
  const [filterStatus, setFilterStatus] = useState('all')

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const [tablesData, ordersData, menuData] = await Promise.all([
        apiGet<RestaurantTable[]>('/tables'),
        apiGet<Order[]>('/orders'),
        apiGet<MenuItem[]>('/menu'),
      ])
      setTables(tablesData)
      setAllOrders(ordersData)
      setMenuItems(menuData.filter(m => m.available))
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll(true) }, [fetchAll])
  useEffect(() => {
    const t = setInterval(() => fetchAll(true), 10_000)
    return () => clearInterval(t)
  }, [fetchAll])

  function getTableOrders(tableId: string) {
    return allOrders.filter(o => o.table_id === tableId)
  }

  const filtered = (filterStatus === 'all' ? tables : tables.filter(t => t.status === filterStatus))
    .slice()
    .sort((a, b) => {
      // Sort by tables that have ready items first
      const allItemsA = getTableOrders(a.id).flatMap(o => o.order_items ?? [])
      const allItemsB = getTableOrders(b.id).flatMap(o => o.order_items ?? [])
      const ar = allItemsA.filter(i => i.item_status === 'ready').length
      const br = allItemsB.filter(i => i.item_status === 'ready').length
      if (br !== ar) return br - ar
      return a.table_number - b.table_number
    })

  const allActiveItems = allOrders.flatMap(o => o.order_items ?? [])
  const readyCount = allActiveItems.filter(i => i.item_status === 'ready').length
  const activeCount = allOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length

  const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Free' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'cleaning', label: 'Cleaning' },
  ]

  // If a table is selected, show the session screen
  if (selectedTable && user) {
    const tableOrders = allOrders.filter(o => o.table_id === selectedTable.id)
    return (
      <SessionScreen
        table={selectedTable}
        orders={tableOrders}
        menuItems={menuItems}
        userId={user.id}
        onBack={() => setSelectedTable(null)}
        onRefresh={async () => {
          await fetchAll(true)
          const fresh = await apiGet<RestaurantTable[]>('/tables')
          const updated = fresh.find(t => t.id === selectedTable.id)
          if (updated) setSelectedTable(updated)
        }}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur-sm border-b border-outline flex items-center px-4 gap-3">
        {/* Logo */}
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black font-black text-sm shrink-0 shadow-lg shadow-primary/30">
          S
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-main leading-tight truncate">{displayName}</p>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest leading-none">Waiter</p>
        </div>

        {/* Ready badge */}
        {readyCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/30">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black text-primary">{readyCount} ready</span>
          </div>
        )}

        <button onClick={toggleTheme} className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted touch-manipulation">
          <Icon name={isDark ? 'ri-sun-line' : 'ri-moon-line'} className="text-lg" />
        </button>
        <button onClick={logout} className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-danger touch-manipulation">
          <Icon name="ri-logout-box-r-line" className="text-lg" />
        </button>
      </header>

      <div className="pt-14 flex-1 flex flex-col">
        {/* Stats row */}
        <div className="px-4 pt-4 pb-3 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Tables', value: tables.length, icon: 'ri-layout-grid-line', color: 'text-text-main' },
            { label: 'Active', value: activeCount, icon: 'ri-timer-line', color: 'text-orange-400' },
            { label: 'Ready', value: readyCount, icon: 'ri-checkbox-circle-line', color: 'text-primary' },
          ].map(s => (
            <div key={s.label} className="card-bg border border-outline rounded-2xl px-3 py-3 flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl bg-current/10 flex items-center justify-center shrink-0 ${s.color}`}>
                <Icon name={s.icon} className={`text-base ${s.color}`} />
              </div>
              <div>
                <p className={`text-lg font-black leading-none ${s.color}`}>{loading ? '–' : s.value}</p>
                <p className="text-[10px] text-text-muted font-medium">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {STATUS_FILTERS.map(f => {
            const cnt = f.value === 'all' ? tables.length : tables.filter(t => t.status === f.value).length
            return (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-colors touch-manipulation flex items-center gap-1.5 ${
                  filterStatus === f.value ? 'bg-primary text-black' : 'bg-surface-variant text-text-muted'
                }`}
              >
                {f.label}
                <span className={`text-[10px] font-black opacity-70 ${filterStatus === f.value ? 'text-black' : ''}`}>{cnt}</span>
              </button>
            )
          })}
        </div>

        {/* Table grid */}
        <div className="flex-1 px-4 pb-6">
          {/* Refresh indicator */}
          {refreshing && (
            <div className="flex items-center justify-center gap-2 py-2 text-text-muted text-xs mb-2">
              <Icon name="ri-loader-4-line" className="text-sm animate-spin" />
              Refreshing…
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Icon name="ri-loader-4-line" className="text-3xl text-text-muted animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-text-muted">
              <Icon name="ri-layout-grid-line" className="text-4xl opacity-30" />
              <p className="text-sm">No tables</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  activeOrders={getTableOrders(table.id).filter(o => o.status !== 'completed' && o.status !== 'cancelled')}
                  onClick={() => setSelectedTable(table)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
