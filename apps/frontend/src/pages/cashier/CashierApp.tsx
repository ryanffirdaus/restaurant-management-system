import { useState, useEffect, useCallback, useRef } from 'react'
import { apiGet, apiPost, formatIDR } from '../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Step = 'select-method' | 'confirm-cash' | 'code-waiting' | 'success'

type ChannelGroup = 'qris' | 'ewallet' | 'virtual_account'

interface PaymentChannel {
  id: string
  label: string
  group: ChannelGroup
  kind: 'qr' | 'code'
  icon: string
  instructions: string
}

const GROUP_LABELS: Record<ChannelGroup, string> = {
  qris: 'QRIS',
  ewallet: 'E-Wallet',
  virtual_account: 'Virtual Account',
}

const GROUP_ORDER: ChannelGroup[] = ['qris', 'ewallet', 'virtual_account']

interface ChannelPayment {
  invoiceNumber: string
  channel: string
  channelLabel: string
  instructions: string
  kind: 'qr' | 'code'
  paymentCode: string | null
  qrUrl: string | null
  expiresAt: string | null
}

interface OrderItem {
  id: string
  quantity: number
  price_at_purchase: number
  item_status: string
  menu_item?: { name: string }
}

interface Order {
  id: string
  status: string
  total_price: number | null
  table_id: string | null
  customer_name: string | null
  notes: string | null
  paid_at: string | null
  created_at: string
  order_items?: OrderItem[]
  table?: { table_number: number }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function tableLabel(order: Order) {
  if (order.table?.table_number) return `Table ${order.table.table_number}`
  if (order.customer_name) return order.customer_name
  return 'Takeaway'
}

function elapsed(createdAt: string) {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`
}

// Group numeric codes in blocks of 4 for readability (leave mixed codes as-is)
function formatPaymentCode(code: string) {
  if (!/^\d+$/.test(code)) return code
  return code.replace(/(.{4})/g, '$1 ').trim()
}

function expiryLabel(expiresAt: string | null) {
  if (!expiresAt) return null
  const mins = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 60000))
  return `Expires in ${mins} min`
}

// ---------------------------------------------------------------------------
// Order list (left panel)
// ---------------------------------------------------------------------------
function OrderList({
  orders,
  selectedId,
  onSelect,
  loading,
}: {
  orders: Order[]
  selectedId: string | null
  onSelect: (o: Order) => void
  loading: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-outline shrink-0">
        <h1 className="text-lg font-bold text-text-main">Cashier</h1>
        <p className="text-xs text-text-muted mt-0.5">
          {orders.length} order{orders.length !== 1 ? 's' : ''} pending payment
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-text-muted text-sm">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center gap-2 text-text-muted">
            <i className="ri-checkbox-circle-line text-4xl text-primary/60" />
            <p className="text-sm font-medium">All orders paid</p>
          </div>
        ) : (
          orders.map(o => {
            const isSelected = o.id === selectedId
            const itemCount = o.order_items?.length ?? 0
            return (
              <button
                key={o.id}
                onClick={() => onSelect(o)}
                className={`w-full text-left px-4 py-4 border-b border-outline transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-surface-variant/40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-text-main">{tableLabel(o)}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {itemCount} item{itemCount !== 1 ? 's' : ''} • {elapsed(o.created_at)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums shrink-0 ml-2">
                    {formatIDR(o.total_price ?? 0)}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Cashier App
// ---------------------------------------------------------------------------
export default function CashierApp() {
  const [orders, setOrders] = useState<Order[]>([])
  const [channels, setChannels] = useState<PaymentChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [method, setMethod] = useState<string>('cash') // 'cash' | channel id
  const [step, setStep] = useState<Step>('select-method')
  const [processing, setProcessing] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [payment, setPayment] = useState<ChannelPayment | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const payPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---- fetch orders ----
  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiGet<Order[]>('/orders')
      const unpaid = data.filter(
        o => !o.paid_at && o.status !== 'cancelled' && o.total_price != null,
      )
      setOrders(unpaid)
      setSelected(prev => (prev ? unpaid.find(o => o.id === prev.id) ?? null : prev))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    apiGet<PaymentChannel[]>('/midtrans/channels').then(setChannels).catch(() => setChannels([]))
    pollRef.current = setInterval(fetchOrders, 10_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (payPollRef.current) clearInterval(payPollRef.current)
    }
  }, [fetchOrders])

  // ---- select an order ----
  function selectOrder(o: Order) {
    setSelected(o)
    setStep('select-method')
    setMethod('cash')
    setCashReceived('')
    setPayment(null)
    setCopied(false)
    if (payPollRef.current) clearInterval(payPollRef.current)
  }

  function resetPayment() {
    setStep('select-method')
    setPayment(null)
    setCashReceived('')
    setCopied(false)
    if (payPollRef.current) clearInterval(payPollRef.current)
  }

  // ---- cash ----
  async function handleCashConfirm() {
    if (!selected) return
    setProcessing(true)
    try {
      await apiPost(`/payments/order/${selected.id}`, {
        amount: selected.total_price,
        method: 'cash',
      })
      setStep('success')
      await fetchOrders()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  // ---- Midtrans inline payment (QR / payment code) ----
  async function handleChannelInit(channelId: string) {
    if (!selected) return
    setProcessing(true)
    try {
      const result = await apiPost<ChannelPayment>('/midtrans/payment', {
        orderId: selected.id,
        channel: channelId,
      })
      setPayment(result)
      setStep('code-waiting')

      // Poll every 5s for the Midtrans webhook to mark the order paid
      const orderId = selected.id
      payPollRef.current = setInterval(async () => {
        try {
          const fresh = await apiGet<Order[]>('/orders')
          const thisOrder = fresh.find(o => o.id === orderId)
          if (thisOrder?.paid_at) {
            if (payPollRef.current) clearInterval(payPollRef.current)
            setStep('success')
            await fetchOrders()
          }
        } catch {
          // keep polling
        }
      }, 5_000)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not create payment code')
    } finally {
      setProcessing(false)
    }
  }

  // Manual confirm — fallback for dev/testing when the webhook can't reach the server
  async function handleManualConfirm() {
    if (!selected) return
    setProcessing(true)
    try {
      await apiPost(`/payments/order/${selected.id}`, {
        amount: selected.total_price,
        method: 'other',
        referenceId: payment?.invoiceNumber ?? 'ONLINE-MANUAL',
      })
      if (payPollRef.current) clearInterval(payPollRef.current)
      setStep('success')
      await fetchOrders()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Confirmation failed')
    } finally {
      setProcessing(false)
    }
  }

  function handleDone() {
    if (payPollRef.current) clearInterval(payPollRef.current)
    setSelected(null)
    setStep('select-method')
  }

  async function copyCode() {
    if (!payment?.paymentCode) return
    try {
      await navigator.clipboard.writeText(payment.paymentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable
    }
  }

  // ---- derived ----
  const total = selected?.total_price ?? 0
  const cashNum = parseFloat(cashReceived) || 0
  const change = cashNum - total
  const activeChannel = channels.find(c => c.id === method)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Left — order list */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={`w-80 shrink-0 border-r border-outline card-bg flex flex-col ${
          selected ? 'hidden md:flex' : 'flex'
        }`}
      >
        <OrderList
          orders={orders}
          selectedId={selected?.id ?? null}
          onSelect={selectOrder}
          loading={loading}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right — payment panel */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
            <i className="ri-bill-line text-5xl opacity-30" />
            <p className="text-sm">Select an order to process payment</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-8 max-w-lg mx-auto w-full">
            {/* Mobile back */}
            <button
              onClick={() => { setSelected(null); resetPayment() }}
              className="md:hidden mb-4 flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main"
            >
              <i className="ri-arrow-left-line" /> All Orders
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-text-main">{tableLabel(selected)}</h2>
              <p className="text-sm text-text-muted">
                {elapsed(selected.created_at)} • #{selected.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Order summary */}
            <div className="card-bg rounded-2xl border border-outline p-4 mb-6 space-y-2">
              {(selected.order_items ?? []).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-text-muted">
                    {item.quantity}× {item.menu_item?.name ?? '?'}
                  </span>
                  <span className="text-text-main font-medium tabular-nums">
                    {formatIDR(item.price_at_purchase * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-outline flex justify-between font-bold text-sm">
                <span className="text-text-main">Total</span>
                <span className="text-primary tabular-nums text-base">{formatIDR(total)}</span>
              </div>
            </div>

            {/* ---- step: select method ---- */}
            {step === 'select-method' && (
              <div className="space-y-5">
                {/* Cash */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                    Cash
                  </p>
                  <button
                    onClick={() => setMethod('cash')}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all text-left ${
                      method === 'cash'
                        ? 'border-primary bg-primary/10'
                        : 'border-outline hover:border-primary/40 hover:bg-surface-variant/30'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        method === 'cash' ? 'bg-primary text-white' : 'bg-surface-variant text-text-muted'
                      }`}
                    >
                      <i className="ri-money-dollar-circle-line" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-main">Cash</p>
                      <p className="text-xs text-text-muted">Accept physical cash payment</p>
                    </div>
                    {method === 'cash' && (
                      <i className="ri-check-line ml-auto text-primary text-lg shrink-0" />
                    )}
                  </button>
                </div>

                {/* Midtrans channels — grouped by payment type */}
                {GROUP_ORDER.map(group => {
                  const groupChannels = channels.filter(c => c.group === group)
                  if (groupChannels.length === 0) return null
                  return (
                    <div key={group} className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                        {GROUP_LABELS[group]}
                      </p>
                      {groupChannels.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setMethod(c.id)}
                          className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all text-left ${
                            method === c.id
                              ? 'border-primary bg-primary/10'
                              : 'border-outline hover:border-primary/40 hover:bg-surface-variant/30'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                              method === c.id ? 'bg-primary text-white' : 'bg-surface-variant text-text-muted'
                            }`}
                          >
                            <i className={c.icon} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-text-main">{c.label}</p>
                            <p className="text-xs text-text-muted truncate">
                              {c.kind === 'qr' ? 'Scan QR code' : c.instructions}
                            </p>
                          </div>
                          {method === c.id && (
                            <i className="ri-check-line ml-auto text-primary text-lg shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )
                })}

                <button
                  onClick={() => {
                    if (method === 'cash') setStep('confirm-cash')
                    else handleChannelInit(method)
                  }}
                  disabled={processing}
                  className="w-full mt-4 py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {processing
                    ? 'Processing…'
                    : `Continue with ${method === 'cash' ? 'Cash' : activeChannel?.label ?? '…'}`}
                </button>
              </div>
            )}

            {/* ---- step: cash ---- */}
            {step === 'confirm-cash' && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Cash Payment
                </p>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Amount Received (IDR)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder={String(Math.ceil(total))}
                    className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 text-text-main text-lg font-bold focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>

                {/* Quick amount buttons — exact total + round-ups */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    Math.ceil(total),
                    Math.ceil(total / 5000) * 5000,
                    Math.ceil(total / 10000) * 10000,
                  ]
                    .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
                    .map(v => (
                      <button
                        key={v}
                        onClick={() => setCashReceived(String(v))}
                        className="py-2 rounded-lg bg-surface-variant text-xs font-semibold text-text-muted hover:bg-outline/40 transition-colors"
                      >
                        {formatIDR(v)}
                      </button>
                    ))}
                </div>

                {cashNum > 0 && (
                  <div
                    className={`rounded-xl p-4 text-sm space-y-1.5 ${
                      change >= 0
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="text-text-muted">Total</span>
                      <span className="font-bold text-text-main tabular-nums">{formatIDR(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Received</span>
                      <span className="font-bold text-text-main tabular-nums">{formatIDR(cashNum)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-outline/50">
                      <span className={`font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? 'Change' : 'Short'}
                      </span>
                      <span
                        className={`font-bold tabular-nums ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {formatIDR(Math.abs(change))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetPayment}
                    className="flex-1 py-3 rounded-xl border border-outline text-sm font-semibold text-text-muted hover:bg-surface-variant transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCashConfirm}
                    disabled={processing || (cashNum > 0 && change < 0)}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Processing…' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            )}

            {/* ---- step: payment waiting (inline QR / payment code) ---- */}
            {step === 'code-waiting' && payment && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  {payment.channelLabel}
                </p>

                {/* Payment card */}
                <div className="rounded-2xl border border-outline p-6 flex flex-col items-center gap-4 text-center card-bg">
                  <p className="text-xs text-text-muted">{payment.instructions}</p>

                  {payment.kind === 'qr' && payment.qrUrl ? (
                    <div className="bg-white rounded-xl p-4">
                      <img
                        src={payment.qrUrl}
                        alt={`${payment.channelLabel} QR code`}
                        className="w-56 h-56 object-contain"
                      />
                    </div>
                  ) : payment.paymentCode ? (
                    <button
                      onClick={copyCode}
                      className="group w-full rounded-xl bg-surface-variant border border-outline px-4 py-5 hover:border-primary/50 transition-colors"
                      title="Tap to copy"
                    >
                      <p className="font-mono text-2xl md:text-3xl font-bold text-text-main tracking-wider tabular-nums break-all">
                        {formatPaymentCode(payment.paymentCode)}
                      </p>
                      <p className="text-[11px] mt-2 text-text-muted group-hover:text-primary transition-colors">
                        {copied ? (
                          <span className="text-primary font-semibold">
                            <i className="ri-check-line" /> Copied!
                          </span>
                        ) : (
                          <span><i className="ri-file-copy-line" /> Tap to copy</span>
                        )}
                      </p>
                    </button>
                  ) : null}

                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="font-bold text-primary text-sm tabular-nums">{formatIDR(total)}</span>
                    {payment.expiresAt && <span>{expiryLabel(payment.expiresAt)}</span>}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <i className="ri-loader-4-line animate-spin text-blue-400" />
                    Waiting for payment — confirms automatically
                  </div>
                </div>

                <p className="text-xs text-text-muted text-center">
                  If the webhook is not reachable (development/testing), use the manual confirm below.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetPayment}
                    className="flex-1 py-3 rounded-xl border border-outline text-sm font-semibold text-text-muted hover:bg-surface-variant transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualConfirm}
                    disabled={processing}
                    className="flex-1 py-3 rounded-xl bg-orange-500/80 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Processing…' : 'Confirm Manually'}
                  </button>
                </div>
              </div>
            )}

            {/* ---- step: success ---- */}
            {step === 'success' && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center">
                  <i className="ri-checkbox-circle-fill text-5xl text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-main">Payment Received</h3>
                  <p className="text-sm text-text-muted mt-1">
                    {tableLabel(selected)} • {formatIDR(total)}
                  </p>
                </div>
                {method === 'cash' && cashNum > 0 && change >= 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-4 w-full">
                    <p className="text-sm text-green-400 font-semibold">Change for customer</p>
                    <p className="text-3xl font-bold text-green-400 tabular-nums mt-1">
                      {formatIDR(change)}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleDone}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors mt-2"
                >
                  Next Order
                </button>
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  )
}
