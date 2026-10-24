import { useState, useEffect, useCallback } from 'react'
import { apiGet, apiPost, formatIDR } from '../../lib/api'
import Icon from '../../components/Icon'
import Modal from '../../components/Modal'
import MetricCard from '../../components/MetricCard'
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
        <span className="text-sm text-ink whitespace-nowrap">
          {new Date(p.paid_at).toLocaleDateString()} {new Date(p.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'order_id', label: 'Order',
      render: p => (
        <span className="font-mono text-xs text-ink-2">{p.order_id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'method', label: 'Method',
      render: p => (
        <span className="flex items-center gap-1.5 text-sm text-ink">
          <Icon name={METHOD_ICON[p.method] ?? 'ri-money-dollar-circle-line'} className="text-base text-ink-2" />
          {methodLabel(p.method)}
        </span>
      ),
    },
    {
      key: 'reference_id', label: 'Reference',
      render: p => <span className="text-sm text-ink-2">{p.reference_id ?? '—'}</span>,
    },
    {
      key: 'amount', label: 'Amount',
      headerClassName: 'text-right',
      className: 'text-right font-semibold text-sm text-ink num whitespace-nowrap',
      render: p => <span>{formatIDR(Number(p.amount))}</span>,
    },
  ]

  return (
    <div className="mt-16 p-container-margin space-y-gutter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-ink">Payments</h1>
        <p className="text-sm text-ink-2 mt-0.5">{payments.length} transactions recorded</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {[
          { label: "Today's Revenue", value: formatIDR(todayRevenue), icon: 'ri-calendar-event-line', tone: 'neutral' as const },
          { label: 'Total Revenue', value: formatIDR(totalRevenue), icon: 'ri-money-dollar-circle-line', tone: 'neutral' as const },
          { label: 'Transactions', value: String(payments.length), icon: 'ri-bill-line', tone: 'pending' as const },
          { label: 'Unpaid Orders', value: String(unpaidOrders.length), icon: 'ri-timer-line', tone: 'danger' as const },
        ].map(k => (
          <MetricCard key={k.label} title={k.label} value={loading ? '...' : k.value} icon={k.icon} tone={k.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Unpaid orders */}
        <div className="bg-surface rounded-xl border border-line overflow-hidden">
          <div className="p-5 border-b border-line">
            <h3 className="font-semibold text-ink">Unpaid Orders</h3>
            <p className="text-xs text-ink-2 mt-0.5">Click to process payment</p>
          </div>
          <div className="divide-y divide-line max-h-96 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-ink-2 text-sm">Loading...</div>
            ) : unpaidOrders.length === 0 ? (
              <div className="p-8 text-center text-ink-2 text-sm flex flex-col items-center gap-2">
                <Icon name="ri-checkbox-circle-line" className="text-3xl text-ready" />
                All orders are paid
              </div>
            ) : unpaidOrders.map(o => {
              const items = o.order_items ?? []
              const preview = items.slice(0, 2).map(i => `${i.quantity}x ${i.menu_item?.name ?? '?'}`).join(', ')
              return (
                <button
                  key={o.id}
                  onClick={() => { setPayModal(o); setMethod('cash') }}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-raised transition-colors text-left group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{getTableLabel(o.table_id)}</p>
                    <p className="text-xs text-ink-2 truncate max-w-[160px]">{preview || 'No items'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-sm font-semibold text-ink num">
                      {o.total_price != null ? formatIDR(o.total_price) : '—'}
                    </span>
                    <Icon name="ri-arrow-right-s-line" className="text-base text-ink-3 group-hover:text-ink transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* By method breakdown */}
        <div className="bg-surface rounded-xl border border-line p-5 flex flex-col gap-4">
          <h3 className="font-semibold text-ink">By Method</h3>
          {loading ? (
            <p className="text-sm text-ink-2">Loading...</p>
          ) : byMethod.length === 0 ? (
            <p className="text-sm text-ink-2">No payments yet</p>
          ) : (
            <div className="space-y-3">
              {byMethod.map(m => {
                const pct = totalRevenue > 0 ? (m.total / totalRevenue) * 100 : 0
                return (
                  <div key={m.value}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 font-normal text-ink">
                        <Icon name={METHOD_ICON[m.value] ?? 'ri-money-dollar-circle-line'} className="text-base text-ink-2" />
                        {m.label}
                      </span>
                      <span className="font-semibold text-ink num">{formatIDR(m.total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-raised overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-ink-3 mt-1 num">{m.count} transaction{m.count !== 1 ? 's' : ''} • {pct.toFixed(1)}%</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Placeholder for chart */}
        <div className="bg-surface rounded-xl border border-line p-5 flex flex-col gap-3">
          <h3 className="font-semibold text-ink">Avg. Order Value</h3>
          <div className="flex-1 flex flex-col justify-center gap-2">
            <p className="text-4xl font-semibold text-ink num">
              {loading || payments.length === 0 ? '—' : formatIDR(totalRevenue / payments.length)}
            </p>
            <p className="text-xs text-ink-2">across {payments.length} transactions</p>
            <div className="h-px bg-line my-2" />
            <div className="space-y-1.5">
              {[
                { label: 'Highest', value: payments.length > 0 ? Math.max(...payments.map(p => Number(p.amount))) : 0 },
                { label: 'Lowest', value: payments.length > 0 ? Math.min(...payments.map(p => Number(p.amount))) : 0 },
              ].map(s => (
                <div key={s.label} className="flex justify-between text-sm">
                  <span className="text-ink-2">{s.label} transaction</span>
                  <span className="font-semibold text-ink num">{formatIDR(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All transactions table */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        <div className="p-5 border-b border-line">
          <h3 className="font-semibold text-ink">All Transactions</h3>
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
            <div className="rounded-xl bg-raised p-4 space-y-1.5">
              {(payModal.order_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-ink-2">{item.quantity}× {item.menu_item?.name ?? '?'}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-line flex justify-between font-medium text-sm">
                <span className="text-ink">Total</span>
                <span className="text-ink font-semibold num">{formatIDR(payModal.total_price ?? 0)}</span>
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
