import { useEffect, useState } from 'react'
import { orders as ordersApi } from '../api/client'
import { payments as paymentsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp, CreditCard } from 'lucide-react'

const statusConfig = {
  pending: { icon: <Clock size={14} />, label: 'Pending', color: 'bg-yellow/10 text-yellow border-yellow/15' },
  confirmed: { icon: <CheckCircle size={14} />, label: 'Confirmed', color: 'bg-accent/10 text-accent border-accent/15' },
  shipped: { icon: <Truck size={14} />, label: 'Shipped', color: 'bg-blue/10 text-blue border-blue/15' },
  delivered: { icon: <CheckCircle size={14} />, label: 'Delivered', color: 'bg-green/10 text-green border-green/15' },
  cancelled: { icon: <XCircle size={14} />, label: 'Cancelled', color: 'bg-red/10 text-red border-red/15' },
}

export default function Orders() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    try { const r = await ordersApi.getAll(); setItems(r.data) }
    catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this order?')) return
    try { await ordersApi.cancel(id); toast.success('Order cancelled'); load() }
    catch (err) { toast.error(err?.response?.data?.detail || 'Cancel failed') }
  }

  const handlePay = async (orderId) => {
    try {
      await paymentsApi.create({ order_id: orderId, method: 'card' })
      toast.success('Payment completed')
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Payment failed')
    }
  }

  const handleStatus = async (id, status) => {
    try { await ordersApi.updateStatus(id, status); toast.success('Status updated'); load() }
    catch (err) { toast.error(err?.response?.data?.detail || 'Update failed') }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">Loading...</div></div>

  return (
    <div className="flex-1 px-8 py-10 max-w-[900px] mx-auto w-full">
      <h1 className="font-display text-[26px] tracking-tight mb-7 animate-[slideUp_0.4s_ease]">My Orders</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 text-text-muted animate-[slideUp_0.5s_ease]">
          <Package size={44} className="mx-auto mb-3.5 opacity-50" />
          <p className="text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3 animate-[slideUp_0.5s_ease]">
          {items.map(o => {
            const st = statusConfig[o.status] || statusConfig.pending
            const isOpen = expanded === o.id
            return (
              <div key={o.id} className="bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-border-strong">
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : o.id)}>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">#{o.id}</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${st.color}`}>{st.icon}{st.label}</span>
                    <span className="text-[13px] text-text-muted">{o.items?.length || 0} items</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">${Number(o.total_price).toFixed(2)}</span>
                    {isAdmin ? (
                      <select
                        value={o.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleStatus(o.id, e.target.value)}
                        className="text-[12px] px-2 py-1 rounded-lg bg-bg border border-border text-text cursor-pointer"
                      >
                        {Object.keys(statusConfig).map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                      </select>
                    ) : (
                      isOpen ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    <div className="space-y-2 mb-3">
                      {o.items?.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-[13px]">
                          <span className="text-text-secondary">{item.product_name || `Product #${item.product_id}`}</span>
                          <span className="text-text-muted">x{item.quantity} &middot; ${Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-[12px] text-text-muted">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}
                      </span>
                      {["pending", "confirmed"].includes(o.status) && !isAdmin && (
                        <>
                          <button onClick={() => handleCancel(o.id)} className="text-[12px] px-3 py-1 rounded-lg bg-red/10 border border-red/15 text-red cursor-pointer hover:bg-red/15 transition-all">Cancel</button>
                          <button onClick={() => handlePay(o.id)} className="text-[12px] px-3 py-1 rounded-lg bg-green/10 border border-green/15 text-green cursor-pointer hover:bg-green/15 transition-all flex items-center gap-1"><CreditCard size={12} />Pay</button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
