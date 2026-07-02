import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { apiGet, apiPost, apiPatch, apiDelete, formatIDR } from '../../lib/api'
import Icon from '../../components/Icon'
import Badge from '../../components/Badge'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Button, Select, Textarea } from '../../components/ui'
import type { Column } from '../../components/Table'

interface MenuItem {
  id: string
  name: string
  price: number
  category: string | null
  available: boolean
}

interface RestaurantTable {
  id: string
  table_number: number
  status: string
}

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  price_at_purchase: number
  menu_item?: { name: string }
}

interface Order {
  id: string
  customer_name: string | null
  status: string
  total_price: number | null
  notes: string | null
  table_id: string | null
  created_at: string
  order_items?: OrderItem[]
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function statusVariant(status: string) {
  switch (status) {
    case 'pending': return 'neutral' as const
    case 'preparing': return 'warning' as const
    case 'ready': return 'primary' as const
    case 'completed': return 'primary' as const
    case 'cancelled': return 'danger' as const
    default: return 'neutral' as const
  }
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export default function OrdersPage() {
  const { user, employeeRole } = useAuth()
  const isAdmin = employeeRole === 'admin' || employeeRole === 'manager'

  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [statusModal, setStatusModal] = useState<{ order: Order; status: string } | null>(null)

  const [form, setForm] = useState({ tableId: '', notes: '' })
  const [cart, setCart] = useState<CartItem[]>([])
  const [saving, setSaving] = useState(false)

  const [filterStatus, setFilterStatus] = useState('all')

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [ordersData, tablesData, menuData] = await Promise.all([
        apiGet<Order[]>('/orders'),
        apiGet<RestaurantTable[]>('/tables'),
        apiGet<MenuItem[]>('/menu'),
      ])
      setOrders(ordersData)
      setTables(tablesData)
      setMenuItems(menuData.filter(m => m.available))
    } catch {
      // silently fail, show empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function openCreate() {
    setForm({ tableId: '', notes: '' })
    setCart([])
    setCreateOpen(true)
  }

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === item.id)
      if (existing) return prev.map(c => c.menuItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { menuItem: item, quantity: 1 }]
    })
  }

  function removeFromCart(itemId: string) {
    setCart(prev => {
      const existing = prev.find(c => c.menuItem.id === itemId)
      if (!existing) return prev
      if (existing.quantity === 1) return prev.filter(c => c.menuItem.id !== itemId)
      return prev.map(c => c.menuItem.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.menuItem.price * c.quantity, 0)

  async function handleCreate() {
    if (!user || cart.length === 0) return
    setSaving(true)
    try {
      await apiPost('/orders', {
        userId: user.id,
        tableId: form.tableId || null,
        notes: form.notes || null,
        items: cart.map(c => ({ menuItemId: c.menuItem.id, quantity: c.quantity })),
      })
      setCreateOpen(false)
      await fetchAll()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error creating order')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange() {
    if (!statusModal) return
    try {
      await apiPatch(`/orders/${statusModal.order.id}/status`, { status: statusModal.status })
      setStatusModal(null)
      await fetchAll()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error updating status')
    }
  }

  async function handleDelete(order: Order) {
    if (!confirm(`Cancel order ${order.id.slice(0, 8)}?`)) return
    try {
      await apiDelete(`/orders/${order.id}`)
      await fetchAll()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error')
    }
  }

  function getTableLabel(tableId: string | null) {
    if (!tableId) return 'Takeaway'
    const t = tables.find(t => t.id === tableId)
    return t ? `T-${String(t.table_number).padStart(2, '0')}` : 'Takeaway'
  }

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)

  const columns: Column<Order>[] = [
    {
      key: 'id', label: 'Order ID',
      className: 'font-mono text-xs text-text-main whitespace-nowrap',
      render: o => <span className="font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'table_id', label: 'Table',
      className: 'text-sm text-text-main whitespace-nowrap',
      render: o => <span>{getTableLabel(o.table_id)}</span>,
    },
    {
      key: 'order_items', label: 'Items',
      className: 'text-sm text-text-muted whitespace-nowrap',
      render: o => {
        const items = o.order_items ?? []
        if (items.length === 0) return <span className="text-text-muted">—</span>
        const preview = items.slice(0, 2).map(i => `${i.quantity}x ${i.menu_item?.name ?? '?'}`).join(', ')
        return <span>{preview}{items.length > 2 ? ` +${items.length - 2}` : ''}</span>
      },
    },
    {
      key: 'total_price', label: 'Total',
      headerClassName: 'text-right',
      className: 'text-sm font-bold text-right text-text-main whitespace-nowrap tabular-nums',
      render: o => <span>{o.total_price != null ? formatIDR(o.total_price) : '—'}</span>,
    },
    {
      key: 'status', label: 'Status',
      className: 'whitespace-nowrap',
      render: o => <Badge variant={statusVariant(o.status)}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</Badge>,
    },
    {
      key: 'created_at', label: 'Time',
      className: 'text-text-muted text-sm whitespace-nowrap',
      render: o => <span>{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>,
    },
    {
      key: 'id' as keyof Order, label: '',
      className: 'whitespace-nowrap',
      render: o => (
        <div className="flex gap-1 justify-end">
          <button onClick={() => setDetailOrder(o)} className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
            <Icon name="ri-eye-line" className="text-sm" />
          </button>
          <button onClick={() => setStatusModal({ order: o, status: o.status })} className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors">
            <Icon name="ri-arrow-left-right-line" className="text-sm" />
          </button>
          {isAdmin && (
            <button onClick={() => handleDelete(o)} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
              <Icon name="ri-delete-bin-6-line" className="text-sm" />
            </button>
          )}
        </div>
      ),
    },
  ]

  const tableOptions = [
    { value: '', label: 'No table (takeaway)' },
    ...tables.map(t => ({ value: t.id, label: `Table ${t.table_number} (${t.status})` })),
  ]

  const statusFilterOptions = [
    { value: 'all', label: 'All Statuses' },
    ...STATUS_OPTIONS,
  ]

  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Orders</h1>
          <p className="text-sm text-text-muted mt-0.5">{orders.length} orders total</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Icon name="ri-add-line" className="text-base" />
          New Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
        {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map(s => {
          const count = orders.filter(o => o.status === s).length
          return (
            <div key={s} className="card-bg rounded-2xl border border-outline p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1 capitalize">{s}</p>
              <p className="text-2xl font-bold text-text-main">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Filters + Table */}
      <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline flex items-center justify-between bg-surface/50">
          <h3 className="font-bold text-text-main">Order List</h3>
          <div className="w-44">
            <Select
              value={filterStatus}
              onChange={value => setFilterStatus(value)}
              options={statusFilterOptions}
            />
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center text-text-muted">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-text-muted">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table columns={columns} data={filtered} />
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Order"
        subtitle="Select a table and add items to the cart"
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving || cart.length === 0}>
              {saving ? 'Placing...' : `Place Order${cart.length > 0 ? ` (${formatIDR(cartTotal)})` : ''}`}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Select
            label="Table"
            value={form.tableId}
            onChange={value => setForm(f => ({ ...f, tableId: value }))}
            options={tableOptions}
          />

          <Textarea
            label="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Allergen info, special requests…"
            rows={2}
          />

          {/* Cart */}
          {cart.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Cart</p>
              <div className="space-y-1.5">
                {cart.map(c => (
                  <div key={c.menuItem.id} className="flex items-center justify-between rounded-xl bg-surface-variant px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-text-main">{c.menuItem.name}</span>
                      <span className="text-xs text-text-muted ml-2">{formatIDR(c.menuItem.price)} ea.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(c.menuItem.id)} className="w-6 h-6 rounded-lg bg-outline/50 text-text-muted hover:text-danger flex items-center justify-center text-sm font-bold transition-colors">−</button>
                      <span className="text-sm font-bold text-text-main w-4 text-center">{c.quantity}</span>
                      <button onClick={() => addToCart(c.menuItem)} className="w-6 h-6 rounded-lg bg-outline/50 text-text-muted hover:text-primary flex items-center justify-center text-sm font-bold transition-colors">+</button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-outline">
                  <span className="text-sm font-bold text-text-muted">Total</span>
                  <span className="text-sm font-bold text-primary">{formatIDR(cartTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Menu items */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Menu</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="flex items-center justify-between rounded-xl border border-outline bg-surface px-3 py-2.5 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main truncate">{item.name}</p>
                    <p className="text-xs text-text-muted capitalize">{item.category ?? 'Other'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-primary">{formatIDR(item.price)}</span>
                    <Icon name="ri-add-circle-line" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity text-lg" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
        title={`Order ${detailOrder?.id.slice(0, 8).toUpperCase()}`}
        subtitle={detailOrder ? `Table: ${getTableLabel(detailOrder.table_id)} • ${new Date(detailOrder.created_at).toLocaleString()}` : undefined}
      >
        {detailOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariant(detailOrder.status)}>{detailOrder.status.charAt(0).toUpperCase() + detailOrder.status.slice(1)}</Badge>
              <span className="text-lg font-bold text-primary">{detailOrder.total_price != null ? formatIDR(detailOrder.total_price) : '—'}</span>
            </div>
            {detailOrder.notes && (
              <div className="rounded-xl bg-surface-variant p-3">
                <p className="text-xs font-bold text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text-main">{detailOrder.notes}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">Items</p>
              <div className="space-y-1.5">
                {(detailOrder.order_items ?? []).map(item => (
                  <div key={item.id} className="flex justify-between rounded-xl bg-surface-variant px-3 py-2">
                    <span className="text-sm text-text-main">{item.quantity}× {item.menu_item?.name ?? item.menu_item_id.slice(0, 8)}</span>
                    <span className="text-sm font-bold text-text-main">{formatIDR(item.price_at_purchase * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Change Modal */}
      <Modal
        open={!!statusModal}
        onClose={() => setStatusModal(null)}
        title="Update Order Status"
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
