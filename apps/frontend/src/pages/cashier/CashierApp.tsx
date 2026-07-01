import { useState, useEffect, useCallback, useRef } from 'react'
import { apiGet, apiPost, formatUSD } from '../../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type PaymentMethod = 'cash' | 'qris' | 'doku'
type Step =
  | 'select-method'
  | 'confirm-cash'
  | 'confirm-qris'
  | 'doku-waiting'
  | 'success'

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
                    {formatUSD(o.total_price ?? 0)}
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
const METHODS: { id: PaymentMethod; icon: string; label: string; desc: string }[] = [
  { id: 'cash', icon: 'ri-money-dollar-circle-line', label: 'Cash', desc: 'Terima pembayaran tunai' },
  { id: 'qris', icon: 'ri-qr-code-line', label: 'QRIS', desc: 'GoPay, OVO, DANA, ShopeePay, dll.' },
  { id: 'doku', icon: 'ri-bank-card-line', label: 'DOKU Online', desc: 'Virtual Account, kartu kredit/debit' },
]

export default function CashierApp() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [step, setStep] = useState<Step>('select-method')
  const [processing, setProcessing] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [dokuUrl, setDokuUrl] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dokuPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---- fetch orders ----
  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiGet<Order[]>('/orders')
      const unpaid = data.filter(
        o =>
          !o.paid_at &&
          o.status !== 'cancelled' &&
          o.total_price != null,
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
    pollRef.current = setInterval(fetchOrders, 10_000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchOrders])

  // ---- select an order ----
  function selectOrder(o: Order) {
    setSelected(o)
    setStep('select-method')
    setMethod('cash')
    setCashReceived('')
    setDokuUrl(null)
    if (dokuPollRef.current) clearInterval(dokuPollRef.current)
  }

  function resetPayment() {
    setStep('select-method')
    setDokuUrl(null)
    setCashReceived('')
    if (dokuPollRef.current) clearInterval(dokuPollRef.current)
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
      alert(e instanceof Error ? e.message : 'Pembayaran gagal')
    } finally {
      setProcessing(false)
    }
  }

  // ---- qris (manual confirm) ----
  async function handleQrisConfirm() {
    if (!selected) return
    setProcessing(true)
    try {
      await apiPost(`/payments/order/${selected.id}`, {
        amount: selected.total_price,
        method: 'qris',
      })
      setStep('success')
      await fetchOrders()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Pembayaran gagal')
    } finally {
      setProcessing(false)
    }
  }

  // ---- doku checkout ----
  async function handleDokuInit() {
    if (!selected) return
    setProcessing(true)
    try {
      const result = await apiPost<{ checkoutUrl: string; invoiceNumber: string }>(
        '/doku/checkout',
        { orderId: selected.id },
      )
      setDokuUrl(result.checkoutUrl)
      setStep('doku-waiting')
      window.open(result.checkoutUrl, '_blank', 'noopener')

      // Poll every 5s for paid_at to appear on this order
      dokuPollRef.current = setInterval(async () => {
        await fetchOrders()
        // fetchOrders updates `selected` via setSelected, but we check directly
        const fresh = await apiGet<Order[]>('/orders')
        const thisOrder = fresh.find(o => o.id === selected.id)
        if (thisOrder?.paid_at) {
          if (dokuPollRef.current) clearInterval(dokuPollRef.current)
          setStep('success')
        }
      }, 5_000)
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Gagal membuat DOKU checkout')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDokuManualConfirm() {
    // Cashier can manually confirm if webhook didn't fire (e.g. sandbox/ngrok issues)
    if (!selected) return
    setProcessing(true)
    try {
      await apiPost(`/payments/order/${selected.id}`, {
        amount: selected.total_price,
        method: 'other',
        referenceId: `DOKU-MANUAL`,
      })
      if (dokuPollRef.current) clearInterval(dokuPollRef.current)
      setStep('success')
      await fetchOrders()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Konfirmasi gagal')
    } finally {
      setProcessing(false)
    }
  }

  function handleDone() {
    if (dokuPollRef.current) clearInterval(dokuPollRef.current)
    setSelected(null)
    setStep('select-method')
  }

  // ---- derived ----
  const total = selected?.total_price ?? 0
  const cashNum = parseFloat(cashReceived) || 0
  const change = cashNum - total

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
            <p className="text-sm">Pilih pesanan untuk proses pembayaran</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-lg mx-auto w-full">
            {/* Mobile back */}
            <button
              onClick={() => { setSelected(null); resetPayment() }}
              className="md:hidden mb-4 flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main"
            >
              <i className="ri-arrow-left-line" /> Semua Pesanan
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
                    {formatUSD(item.price_at_purchase * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-outline flex justify-between font-bold text-sm">
                <span className="text-text-main">Total</span>
                <span className="text-primary tabular-nums text-base">{formatUSD(total)}</span>
              </div>
            </div>

            {/* ---- step: select method ---- */}
            {step === 'select-method' && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                  Metode Pembayaran
                </p>
                {METHODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl border transition-all text-left ${
                      method === m.id
                        ? 'border-primary bg-primary/10'
                        : 'border-outline hover:border-primary/40 hover:bg-surface-variant/30'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                        method === m.id ? 'bg-primary text-white' : 'bg-surface-variant text-text-muted'
                      }`}
                    >
                      <i className={m.icon} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-main">{m.label}</p>
                      <p className="text-xs text-text-muted">{m.desc}</p>
                    </div>
                    {method === m.id && (
                      <i className="ri-check-line ml-auto text-primary text-lg shrink-0" />
                    )}
                  </button>
                ))}

                <button
                  onClick={() => {
                    if (method === 'cash') setStep('confirm-cash')
                    else if (method === 'qris') setStep('confirm-qris')
                    else handleDokuInit()
                  }}
                  disabled={processing}
                  className="w-full mt-4 py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {processing
                    ? 'Memproses…'
                    : `Lanjut dengan ${METHODS.find(m2 => m2.id === method)?.label}`}
                </button>
              </div>
            )}

            {/* ---- step: cash ---- */}
            {step === 'confirm-cash' && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Pembayaran Tunai
                </p>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Uang Diterima (IDR)</label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder={String(Math.ceil(total))}
                    className="w-full bg-surface-variant border border-outline rounded-xl px-4 py-3 text-text-main text-lg font-bold focus:outline-none focus:border-primary"
                    autoFocus
                  />
                </div>

                {/* Quick denomination buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[50_000, 100_000, 200_000].map(v => (
                    <button
                      key={v}
                      onClick={() => setCashReceived(String(v))}
                      className="py-2 rounded-lg bg-surface-variant text-xs font-semibold text-text-muted hover:bg-outline/40 transition-colors"
                    >
                      {formatUSD(v)}
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
                      <span className="font-bold text-text-main tabular-nums">{formatUSD(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Diterima</span>
                      <span className="font-bold text-text-main tabular-nums">{formatUSD(cashNum)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-outline/50">
                      <span
                        className={`font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {change >= 0 ? 'Kembalian' : 'Kurang'}
                      </span>
                      <span
                        className={`font-bold tabular-nums ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {formatUSD(Math.abs(change))}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetPayment}
                    className="flex-1 py-3 rounded-xl border border-outline text-sm font-semibold text-text-muted hover:bg-surface-variant transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleCashConfirm}
                    disabled={processing || (cashNum > 0 && change < 0)}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Memproses…' : 'Konfirmasi Bayar'}
                  </button>
                </div>
              </div>
            )}

            {/* ---- step: qris ---- */}
            {step === 'confirm-qris' && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Pembayaran QRIS
                </p>
                <div className="flex flex-col items-center gap-4 py-6 border border-outline rounded-2xl bg-white">
                  {/* Replace this with your actual static QRIS image: <img src="/qris.png" alt="QRIS" className="w-48 h-48" /> */}
                  <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                    <i className="ri-qr-code-line text-7xl text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Scan dengan GoPay, OVO, DANA, dll.</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatUSD(total)}</p>
                </div>
                <p className="text-xs text-text-muted text-center">
                  Setelah pelanggan scan dan bayar, klik Konfirmasi di bawah.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetPayment}
                    className="flex-1 py-3 rounded-xl border border-outline text-sm font-semibold text-text-muted hover:bg-surface-variant transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleQrisConfirm}
                    disabled={processing}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Memproses…' : 'Konfirmasi Sudah Bayar'}
                  </button>
                </div>
              </div>
            )}

            {/* ---- step: doku waiting ---- */}
            {step === 'doku-waiting' && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  DOKU Online Payment
                </p>
                <div className="rounded-2xl border border-outline p-6 flex flex-col items-center gap-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center animate-pulse">
                    <i className="ri-loader-4-line text-3xl text-blue-400 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">Menunggu pembayaran…</p>
                    <p className="text-xs text-text-muted mt-1">
                      Halaman DOKU telah dibuka di tab baru. Sistem otomatis terkonfirmasi setelah pelanggan selesai bayar.
                    </p>
                  </div>
                  {dokuUrl && (
                    <a
                      href={dokuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary underline"
                    >
                      Buka ulang halaman DOKU →
                    </a>
                  )}
                </div>
                <p className="text-xs text-text-muted text-center">
                  Jika webhook tidak berfungsi (development/testing), klik tombol manual di bawah.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetPayment}
                    className="flex-1 py-3 rounded-xl border border-outline text-sm font-semibold text-text-muted hover:bg-surface-variant transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDokuManualConfirm}
                    disabled={processing}
                    className="flex-1 py-3 rounded-xl bg-orange-500/80 text-white text-sm font-bold hover:bg-orange-500 disabled:opacity-50 transition-colors"
                  >
                    {processing ? 'Memproses…' : 'Konfirmasi Manual'}
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
                  <h3 className="text-xl font-bold text-text-main">Pembayaran Diterima</h3>
                  <p className="text-sm text-text-muted mt-1">
                    {tableLabel(selected)} • {formatUSD(total)}
                  </p>
                </div>
                {method === 'cash' && cashNum > 0 && change >= 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-4 w-full">
                    <p className="text-sm text-green-400 font-semibold">Kembalian untuk pelanggan</p>
                    <p className="text-3xl font-bold text-green-400 tabular-nums mt-1">
                      {formatUSD(change)}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleDone}
                  className="w-full py-4 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors mt-2"
                >
                  Pesanan Berikutnya
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
