import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, formatIDR } from '../../lib/api'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import { Button, Select } from '../../components/ui'
import Table from '../../components/Table'
import type { Column } from '../../components/Table'

interface Payment {
  id: string
  order_id: string
  amount: number
  method: string
  reference_id: string | null
  cashier_id: string
  paid_at: string
  order?: {
    id: string
    total_price: number
    table_id: string | null
    status: string
    customer_name: string | null
  }
}

interface Order {
  id: string
  status: string
  total_price: number | null
  table_id: string | null
  customer_name: string | null
  paid_at: string | null
  created_at: string
  order_items?: { quantity: number; menu_item?: { name: string } }[]
}

interface RestaurantTable {
  id: string
  table_number: number
}

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'qris', label: 'QRIS' },
  { value: 'other', label: 'Other' },
]

const METHOD_ICON: Record<string, string> = {
  cash: 'ri-money-dollar-circle-line',
  debit_card: 'ri-bank-card-line',
  credit_card: 'ri-bank-card-line',
  qris: 'ri-qr-code-line',
  other: 'ri-more-2-fill',
}

function methodLabel(m: string) {
  return METHOD_OPTIONS.find(o => o.value === m)?.label ?? m
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [loading, setLoading] = useState(true)

  const [payModal, setPayModal] = useState<Order | null>(null)
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [paymentsData, ordersData, tablesData] = await Promise.all([
        apiGet<Payment[]>('/payments'),
        apiGet<Order[]>('/orders'),
        apiGet<RestaurantTable[]>('/tables'),
      ])
      setPayments(paymentsData)
      setTables(tablesData)
      setUnpaidOrders(
        ordersData.filter(o => !o.paid_at && o.status !== 'cancelled' && o.total_price != null)
      )
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function getTableLabel(tableId: string | null) {
    if (!tableId) return 'Takeaway'
    const t = tables.find(t => t.id === tableId)
    return t ? `Table ${t.table_number}` : '—'
  }

  async function handlePay() {
    if (!payModal) return
    setSaving(true)
    try {
      await apiPost(`/payments/order/${payModal.id}`, {
        amount: payModal.total_price,
        method,
      })
      setPayModal(null)
      await fetchAll()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setSaving(false)
    }
  }

  // Summary stats
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0)
  const todayStr = new Date().toDateString()
  const todayRevenue = payments
    .filter(p => new Date(p.paid_at).toDateString() === todayStr)
    .reduce((s, p) => s + Number(p.amount), 0)

  const byMethod = METHOD_OPTIONS.map(m => ({
    label: m.label,
    value: m.value,
    count: payments.filter(p => p.method === m.value).length,
    total: payments.filter(p => p.method === m.value).reduce((s, p) => s + Number(p.amount), 0),
  })).filter(m => m.count > 0)

  const columns: Column<Payment>[] = [
    {
      key: 'paid_at', label: 'Date & Time',
      render: p => (
        <span className="text-sm text-text-main whitespace-nowrap">
          {new Date(p.paid_at).toLocaleDateString()} {new Date(p.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'order_id', label: 'Order',
      render: p => (
        <span className="font-mono text-xs text-text-muted">{p.order_id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'method', label: 'Method',
      render: p => (
        <span className="flex items-center gap-1.5 text-sm text-text-main">
          <Icon name={METHOD_ICON[p.method] ?? 'ri-money-dollar-circle-line'} className="text-base text-text-muted" />
          {methodLabel(p.method)}
        </span>
      ),
    },
    {
      key: 'reference_id', label: 'Reference',
      render: p => <span className="text-sm text-text-muted">{p.reference_id ?? '—'}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      headerClassName: 'text-right',
      className: 'text-right font-bold text-sm text-primary tabular-nums whitespace-nowrap',
      render: p => <span>{formatIDR(Number(p.amount))}</span>,
    },
  ]

  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-main">Payments</h1>
        <p className="text-sm text-text-muted mt-0.5">{payments.length} transactions recorded</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {[
          { label: "Today's Revenue", value: formatIDR(todayRevenue), icon: 'ri-calendar-event-line', cls: 'text-primary bg-primary/10' },
          { label: 'Total Revenue', value: formatIDR(totalRevenue), icon: 'ri-money-dollar-circle-line', cls: 'text-blue-400 bg-blue-500/10' },
          { label: 'Transactions', value: String(payments.length), icon: 'ri-bill-line', cls: 'text-orange-400 bg-orange-500/10' },
          { label: 'Unpaid Orders', value: String(unpaidOrders.length), icon: 'ri-timer-line', cls: 'text-danger bg-danger/10' },
        ].map(k => (
          <div key={k.label} className="card-bg rounded-2xl border border-outline p-5 flex flex-col gap-3">
            <div className={`w-9 h-9 rounded-xl ${k.cls} flex items-center justify-center`}>
              <Icon name={k.icon} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-text-main">{loading ? '...' : k.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Unpaid orders */}
        <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline bg-surface/50">
            <h3 className="font-bold text-text-main">Unpaid Orders</h3>
            <p className="text-xs text-text-muted mt-0.5">Click to process payment</p>
          </div>
          <div className="divide-y divide-outline max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-text-muted text-sm">Loading...</div>
            ) : unpaidOrders.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm flex flex-col items-center gap-2">
                <Icon name="ri-checkbox-circle-line" className="text-3xl text-primary opacity-60" />
                All orders are paid
              </div>
            ) : unpaidOrders.map(o => {
              const items = o.order_items ?? []
              const preview = items.slice(0, 2).map(i => `${i.quantity}x ${i.menu_item?.name ?? '?'}`).join(', ')
              return (
                <button
                  key={o.id}
                  onClick={() => { setPayModal(o); setMethod('cash') }}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-variant/50 transition-colors text-left group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-main">{getTableLabel(o.table_id)}</p>
                    <p className="text-xs text-text-muted truncate max-w-[160px]">{preview || 'No items'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-bold text-text-main tabular-nums">
                      {o.total_price != null ? formatIDR(o.total_price) : '—'}
                    </span>
                    <Icon name="ri-arrow-right-s-line" className="text-xs text-text-muted group-hover:text-primary transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* By method breakdown */}
        <div className="card-bg rounded-2xl border border-outline shadow-sm p-5 flex flex-col gap-4">
          <h3 className="font-bold text-text-main">By Method</h3>
          {loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : byMethod.length === 0 ? (
            <p className="text-sm text-text-muted">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {byMethod.map(m => {
                const pct = totalRevenue > 0 ? (m.total / totalRevenue) * 100 : 0
                return (
                  <div key={m.value}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 font-medium text-text-main">
                        <Icon name={METHOD_ICON[m.value] ?? 'ri-money-dollar-circle-line'} className="text-base text-text-muted" />
                        {m.label}
                      </span>
                      <span className="font-bold text-text-main tabular-nums">{formatIDR(m.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-variant overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5">{m.count} transaction{m.count !== 1 ? 's' : ''} • {pct.toFixed(1)}%</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Placeholder for chart */}
        <div className="card-bg rounded-2xl border border-outline shadow-sm p-5 flex flex-col gap-3">
          <h3 className="font-bold text-text-main">Avg. Order Value</h3>
          <div className="flex-1 flex flex-col justify-center gap-2">
            <p className="text-4xl font-bold text-primary tabular-nums">
              {loading || payments.length === 0 ? '—' : formatIDR(totalRevenue / payments.length)}
            </p>
            <p className="text-xs text-text-muted">across {payments.length} transactions</p>
            <div className="h-px bg-outline/50 my-2" />
            <div className="space-y-1.5">
              {[
                { label: 'Highest', value: payments.length > 0 ? Math.max(...payments.map(p => Number(p.amount))) : 0 },
                { label: 'Lowest', value: payments.length > 0 ? Math.min(...payments.map(p => Number(p.amount))) : 0 },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-text-muted">{s.label} transaction</span>
                  <span className="font-bold text-text-main tabular-nums">{formatIDR(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All transactions table */}
      <div className="card-bg rounded-2xl border border-outline shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline bg-surface/50">
          <h3 className="font-bold text-text-main">All Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <Table columns={columns} data={payments} loading={loading} emptyText="No transactions yet." />
        </div>
      </div>

      {/* Pay modal */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title="Process Payment"
        subtitle={payModal ? `${getTableLabel(payModal.table_id)} • ${formatIDR(payModal.total_price ?? 0)}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayModal(null)}>Cancel</Button>
            <Button variant="primary" onClick={handlePay} disabled={saving}>
              {saving ? 'Processing...' : `Confirm Payment ${payModal ? formatIDR(payModal.total_price ?? 0) : ''}`}
            </Button>
          </>
        }
      >
        {payModal && (
          <div className="space-y-5">
            {/* Order summary */}
            <div className="rounded-xl bg-surface-variant p-4 space-y-1.5">
              {(payModal.order_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-muted">{item.quantity}× {item.menu_item?.name ?? '?'}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-outline flex justify-between font-bold text-sm">
                <span className="text-text-main">Total</span>
                <span className="text-primary tabular-nums">{formatIDR(payModal.total_price ?? 0)}</span>
              </div>
            </div>

            <Select
              label="Payment Method"
              value={method}
              onChange={setMethod}
              options={METHOD_OPTIONS}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
