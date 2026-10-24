import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPost, apiPatch, formatIDR } from '../../lib/api'
import Icon from '../../components/Icon'
import StatusPill from '../../components/StatusPill'
import { Textarea } from '../../components/ui'
import { tones, itemStatus, orderStatus, tableStatus, statusMeta } from '../../lib/status'

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
  image_url?: string | null
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

const CATEGORY_ICON: Record<string, string> = {
  'main courses': 'ri-restaurant-2-line', main: 'ri-restaurant-2-line',
  appetizers: 'ri-bowl-line', appetizer: 'ri-bowl-line',
  beverages: 'ri-cup-line', drinks: 'ri-cup-line',
  desserts: 'ri-cake-3-line', dessert: 'ri-cake-3-line',
  pizza: 'ri-restaurant-line',
  snacks: 'ri-bowl-line',
}

function categoryIcon(category: string | null) {
  return CATEGORY_ICON[(category ?? '').toLowerCase()] ?? 'ri-restaurant-line'
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({ table, activeOrders, onClick }: {
  table: RestaurantTable
  activeOrders: Order[]
  onClick: () => void
}) {
  const t = tones[statusMeta(tableStatus, table.status).tone]
  // Count at item level for accurate badges
  const allItems = activeOrders.flatMap(o => o.order_items ?? [])
  const readyCount = allItems.filter(i => i.item_status === 'ready').length
  const cookingCount = allItems.filter(i => i.item_status === 'preparing').length
  const hasAlert = readyCount > 0

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border bg-surface ${hasAlert ? 'border-ready/60' : 'border-line'} pt-5 px-4 pb-4 flex flex-col gap-3 text-left active:scale-[0.97] transition-transform touch-manipulation w-full min-h-[136px]`}
    >
      {/* Status bar */}
      <span className={`absolute top-0 left-0 right-0 h-1 ${t.solid}`} />

      {/* Alert dot for ready */}
      {hasAlert && (
        <span className="absolute top-4 right-4 text-ready">
          <span className="status-pulse is-live" />
        </span>
      )}

      {/* Table number */}
      <div>
        <p className="num text-2xl font-semibold text-ink leading-none">
          T-{String(table.table_number).padStart(2, '0')}
        </p>
        <p className="text-sm text-ink-2 mt-1">
          <span className="num">{table.capacity}</span> seats
        </p>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {readyCount > 0 && (
          <span className={`inline-flex items-center gap-1 h-7 px-2 rounded-full border text-xs font-semibold ${tones.ready.text} ${tones.ready.soft} ${tones.ready.border}`}>
            <Icon name={itemStatus.ready.icon} className="text-sm" />
            <span className="num">{readyCount}</span> ready
          </span>
        )}
        {cookingCount > 0 && (
          <span className={`inline-flex items-center gap-1 h-7 px-2 rounded-full border text-xs font-medium ${tones.progress.text} ${tones.progress.soft} ${tones.progress.border}`}>
            <Icon name={itemStatus.preparing.icon} className="text-sm" />
            <span className="num">{cookingCount}</span> cooking
          </span>
        )}
        {!readyCount && !cookingCount && (
          <StatusPill map={tableStatus} status={table.status} />
        )}
      </div>
    </button>
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
  const accentBar = allReady ? tones.ready.solid : anyReady ? 'bg-ready/50' : order.status === 'pending' ? tones.pending.solid : tones.progress.solid

  async function markServed() {
    setLoading(true)
    await onStatusChange(order.id, 'completed')
    setLoading(false)
  }

  return (
    <div className={`bg-surface rounded-xl border ${allReady ? 'border-ready/60' : 'border-line'} overflow-hidden`}>
      <div className={`h-1 w-full ${accentBar}`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-ink-3 tracking-mono">
            #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <StatusPill map={orderStatus} status={order.status} />
        </div>

        {/* Per-item rows with individual status */}
        <div className="space-y-2">
          {items.map(item => {
            const st = item.item_status ?? 'pending'
            const it = tones[statusMeta(itemStatus, st).tone]
            return (
              <div key={item.id} className="relative overflow-hidden flex items-center gap-3 rounded-lg bg-raised pl-4 pr-3 py-2.5 min-h-touch">
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${it.solid}`} />
                <span className="num font-semibold text-base text-ink w-6 text-center shrink-0">{item.quantity}</span>
                <span className="text-sm text-ink flex-1 min-w-0 truncate">
                  {item.menu_item?.name ?? '?'}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="num text-xs text-ink-2">
                    {formatIDR(item.quantity * item.price_at_purchase)}
                  </span>
                  {st === 'ready' ? (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${tones.ready.text}`}>
                      <span className="status-pulse is-live" />
                      {itemStatus.ready.label}
                    </span>
                  ) : (
                    <StatusPill map={itemStatus} status={st} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-raised border border-line rounded-lg px-3 py-2 flex gap-2 items-start">
            <Icon name="ri-sticky-note-line" className="text-ink-2 text-sm mt-0.5 shrink-0" />
            <p className="text-sm text-ink italic">{order.notes}</p>
          </div>
        )}

        {/* Total + time */}
        <div className="flex justify-between items-center text-xs text-ink-3 pt-2 border-t border-line">
          <span className="num text-base font-semibold text-ink">
            {order.total_price != null ? formatIDR(order.total_price) : '—'}
          </span>
          <span className="num">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {/* Cancel (only while pending — no items started yet) */}
        {order.status === 'pending' && items.every(i => i.item_status === 'pending') && (
          <button
            onClick={() => onStatusChange(order.id, 'cancelled')}
            className="inline-flex items-center gap-1.5 h-11 px-3 -ml-3 rounded text-danger text-sm font-medium hover:bg-danger/10 transition-colors touch-manipulation self-start"
          >
            <Icon name="ri-close-circle-line" className="text-base" />Cancel order
          </button>
        )}

        {/* Mark Served — only when ALL items are ready */}
        {allReady && (
          <button
            onClick={markServed}
            disabled={loading}
            className="w-full h-14 rounded text-base font-semibold bg-brand text-brand-foreground hover:bg-brand-hover transition-colors active:scale-[0.98] touch-manipulation disabled:opacity-40"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Icon name="ri-loader-4-line" className="animate-spin" /> Updating…</span>
              : <span className="flex items-center justify-center gap-2"><Icon name="ri-service-line" className="text-lg" />Mark Served</span>
            }
          </button>
        )}

        {/* Partial ready prompt */}
        {!allReady && anyReady && (
          <div className="flex items-center gap-2 text-sm text-ink-2 bg-raised rounded-lg px-3 py-2.5">
            <Icon name="ri-time-line" className="text-base shrink-0" />
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
      <div className="flex items-center gap-3 px-4 h-16 border-b border-line bg-surface shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to tables"
          className="w-11 h-11 -ml-2 rounded flex items-center justify-center text-ink-2 hover:text-ink active:bg-raised touch-manipulation"
        >
          <Icon name="ri-arrow-left-line" className="text-2xl" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="num text-xl font-semibold text-ink leading-tight">Table {table.table_number}</p>
          <p className="text-xs text-ink-2"><span className="num">{table.capacity}</span> seats</p>
        </div>
        <StatusPill map={tableStatus} status={table.status} size="md" />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-line bg-surface shrink-0">
        {[
          { key: 'orders' as const, icon: 'ri-bill-line', label: 'Orders', count: activeOrders.length },
          { key: 'menu' as const, icon: 'ri-restaurant-2-line', label: 'New Order', count: cartCount },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-colors duration-150 touch-manipulation ${
              tab === t.key
                ? 'border-brand-ink text-brand-ink'
                : 'border-transparent text-ink-2'
            }`}
          >
            <Icon name={t.icon} className="text-base" />
            {t.label}
            {t.count > 0 && (
              <span className={`num min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-semibold flex items-center justify-center ${
                tab === t.key ? 'bg-brand text-brand-foreground' : 'bg-raised text-ink-2'
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
            <div className="flex flex-col items-center gap-4 py-20 text-ink-2">
              <div className="w-16 h-16 rounded-xl bg-raised flex items-center justify-center">
                <Icon name="ri-bill-line" className="text-3xl opacity-40" />
              </div>
              <p className="text-base">No active orders</p>
              <button
                onClick={() => setTab('menu')}
                className="h-14 px-6 rounded bg-brand text-brand-foreground text-base font-semibold hover:bg-brand-hover transition-colors touch-manipulation"
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
              <summary className="text-sm text-ink-2 min-h-touch flex items-center gap-1.5 cursor-pointer select-none list-none touch-manipulation">
                <Icon name="ri-arrow-right-s-line" className="text-base group-open:rotate-90 transition-transform" />
                <span className="num">{orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length}</span> closed
              </summary>
              <div className="mt-1 space-y-2">
                {orders.filter(o => o.status === 'completed' || o.status === 'cancelled').map(order => (
                  <div key={order.id} className="rounded-xl border border-line bg-surface p-3 flex justify-between items-center gap-2">
                    <span className="font-mono text-xs text-ink-3">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <StatusPill map={orderStatus} status={order.status} />
                    <span className="num text-sm text-ink-2 ml-auto">
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
              <Icon name="ri-search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 text-lg pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu…"
                className="w-full h-11 pl-10 pr-3 bg-raised border border-line-strong rounded text-base text-ink placeholder:text-ink-3 focus:outline-none focus:border-brand-ink transition-colors duration-150"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`shrink-0 h-11 px-4 rounded text-sm font-medium transition-colors duration-150 touch-manipulation ${
                    catFilter === cat ? 'bg-brand text-brand-foreground' : 'bg-raised text-ink-2'
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
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border bg-surface p-3 transition-colors duration-150 ${
                    inCart ? 'border-brand-ink' : 'border-line'
                  }`}
                >
                  <div className="w-20 aspect-[4/3] rounded-lg overflow-hidden bg-raised shrink-0 flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name={categoryIcon(item.category)} className="text-2xl text-ink-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-ink truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="num text-sm font-semibold text-ink">{formatIDR(item.price)}</span>
                      <span className="text-xs text-ink-3 truncate">{item.category ?? 'Other'}</span>
                    </div>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setQty(item.id, inCart.quantity - 1)} aria-label="Decrease" className="w-11 h-11 rounded bg-raised flex items-center justify-center text-lg font-semibold text-ink-2 active:bg-danger/10 active:text-danger touch-manipulation">−</button>
                      <span className="num w-7 text-center text-base font-semibold text-ink">{inCart.quantity}</span>
                      <button onClick={() => setQty(item.id, inCart.quantity + 1)} aria-label="Increase" className="w-11 h-11 rounded bg-raised border border-line-strong flex items-center justify-center text-lg font-semibold text-ink touch-manipulation">+</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      aria-label={`Add ${item.name}`}
                      className="w-11 h-11 rounded bg-raised border border-line-strong text-ink flex items-center justify-center shrink-0 active:scale-95 touch-manipulation"
                    >
                      <Icon name="ri-add-line" className="text-xl" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Cart FAB / bottom bar */}
          {cartCount > 0 && !cartOpen && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-line">
              <button
                onClick={() => setCartOpen(true)}
                className="w-full h-14 bg-brand text-brand-foreground hover:bg-brand-hover font-semibold text-base rounded flex items-center justify-between px-5 transition-colors active:scale-[0.98] touch-manipulation"
              >
                <span className="num min-w-[28px] h-7 px-1.5 rounded bg-brand-foreground/15 flex items-center justify-center text-sm font-semibold">{cartCount}</span>
                <span>View Order</span>
                <span className="num">{formatIDR(cartTotal)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cart bottom sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col justify-end">
          <div className="flex-1 bg-canvas/70" onClick={() => setCartOpen(false)} />
          <div className="bg-surface rounded-t-3xl border-t border-line shadow-pop max-h-[85vh] flex flex-col">
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-line-strong" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 shrink-0">
              <p className="text-lg font-semibold text-ink">Your Order</p>
              <button onClick={() => setCartOpen(false)} aria-label="Close" className="w-11 h-11 -mr-2 rounded flex items-center justify-center text-ink-2 hover:text-ink active:bg-raised touch-manipulation">
                <Icon name="ri-close-line" className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 space-y-2 pb-2">
              {/* Cart items */}
              {cart.map(c => (
                <div key={c.menuItem.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setQty(c.menuItem.id, c.quantity - 1)} aria-label="Decrease" className="w-11 h-11 rounded bg-raised flex items-center justify-center text-lg font-semibold text-ink-2 active:bg-danger/10 active:text-danger touch-manipulation">−</button>
                    <span className="num w-7 text-center text-base font-semibold text-ink">{c.quantity}</span>
                    <button onClick={() => setQty(c.menuItem.id, c.quantity + 1)} aria-label="Increase" className="w-11 h-11 rounded bg-raised border border-line-strong flex items-center justify-center text-lg font-semibold text-ink touch-manipulation">+</button>
                  </div>
                  <span className="flex-1 text-base text-ink truncate">{c.menuItem.name}</span>
                  <span className="num text-sm font-semibold text-ink shrink-0">{formatIDR(c.menuItem.price * c.quantity)}</span>
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
              <div className="flex justify-between items-center py-3 border-t border-line">
                <span className="font-medium text-ink-2">Total</span>
                <span className="num text-2xl font-semibold text-ink">{formatIDR(cartTotal)}</span>
              </div>
            </div>

            {/* Place order button */}
            <div className="px-5 py-4 border-t border-line shrink-0">
              <button
                onClick={placeOrder}
                disabled={saving}
                className="num w-full h-14 bg-brand text-brand-foreground hover:bg-brand-hover font-semibold text-base rounded transition-colors active:scale-[0.98] touch-manipulation disabled:opacity-40"
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
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-sidebar border-b border-sidebar-line flex items-center px-4 gap-3">
        {/* Logo */}
        <img src="/logo-wordmark-dark.svg" alt="Servio" className="h-6 w-auto shrink-0" />
        <span className="w-px h-7 bg-sidebar-line shrink-0" aria-hidden="true" />

        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-sidebar-ink leading-tight truncate">{displayName}</p>
          <p className="text-xs text-sidebar-ink-2 uppercase font-mono tracking-mono leading-none mt-0.5">Waiter</p>
        </div>

        {/* Ready badge */}
        {readyCount > 0 && (
          <div className={`flex items-center gap-2 h-9 px-3 rounded-full border bg-surface border-transparent ${tones.ready.text}`}>
            <span className="status-pulse is-live" />
            <span className="text-sm font-semibold"><span className="num">{readyCount}</span> ready</span>
          </div>
        )}

        <button onClick={logout} aria-label="Log out" className="w-11 h-11 -mr-2 rounded flex items-center justify-center text-sidebar-ink-2 hover:text-sidebar-ink active:bg-sidebar-raised touch-manipulation">
          <Icon name="ri-logout-box-r-line" className="text-xl" />
        </button>
      </header>

      <div className="pt-16 flex-1 flex flex-col">
        {/* Stats row */}
        <div className="px-4 pt-4 pb-3 grid grid-cols-3 gap-2.5">
          {[
            { label: 'Tables', value: tables.length, icon: 'ri-layout-grid-line', color: 'text-ink-2' },
            { label: 'Active', value: activeCount, icon: 'ri-timer-line', color: tones.progress.text },
            { label: 'Ready', value: readyCount, icon: itemStatus.ready.icon, color: tones.ready.text },
          ].map(s => (
            <div key={s.label} className="bg-surface border border-line rounded-xl px-3 py-3 flex items-center gap-2.5">
              <Icon name={s.icon} className={`text-xl shrink-0 ${s.color}`} />
              <div>
                <p className="num text-xl font-semibold leading-none text-ink">{loading ? '–' : s.value}</p>
                <p className="text-xs text-ink-2 mt-1">{s.label}</p>
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
                className={`shrink-0 h-11 px-4 rounded text-sm font-medium transition-colors duration-150 touch-manipulation flex items-center gap-1.5 ${
                  filterStatus === f.value ? 'bg-brand text-brand-foreground' : 'bg-raised text-ink-2'
                }`}
              >
                {f.label}
                <span className="num text-xs font-semibold opacity-70">{cnt}</span>
              </button>
            )
          })}
        </div>

        {/* Table grid */}
        <div className="flex-1 px-4 pb-6">
          {/* Refresh indicator */}
          {refreshing && (
            <div className="flex items-center justify-center gap-2 py-2 text-ink-3 text-xs mb-2">
              <Icon name="ri-loader-4-line" className="text-sm animate-spin" />
              Refreshing…
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Icon name="ri-loader-4-line" className="text-3xl text-ink-3 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-ink-2">
              <Icon name="ri-layout-grid-line" className="text-4xl opacity-30" />
              <p className="text-base">No tables</p>
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
