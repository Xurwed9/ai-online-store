import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cart as cartApi, orders as ordersApi } from '../api/client'
import { toast } from 'react-hot-toast'
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react'

export default function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const load = async () => {
    try {
      const r = await cartApi.getAll()
      setItems(r.data)
    } catch { toast.error('Failed to load cart') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const updateQty = async (id, qty) => {
    if (qty < 1) return handleRemove(id)
    try { await cartApi.update(id, { quantity: qty }); load() }
    catch { toast.error('Update failed') }
  }

  const handleRemove = async (id) => {
    try { await cartApi.remove(id); toast.success('Removed'); load() }
    catch { toast.error('Remove failed') }
  }

  const handleClear = async () => {
    if (!confirm('Clear entire cart?')) return
    try { await cartApi.clear(); toast.success('Cart cleared'); setItems([]) }
    catch { toast.error('Clear failed') }
  }

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      await ordersApi.create()
      toast.success('Order placed!')
      navigate('/orders')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Checkout failed')
    } finally { setCheckoutLoading(false) }
  }

  const total = items.reduce((sum, i) => sum + (i.product_price || 0) * i.quantity, 0)

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">Loading...</div></div>

  return (
    <div className="flex-1 px-8 py-10 max-w-[900px] mx-auto w-full">
      <div className="flex justify-between items-center mb-7 animate-[slideUp_0.4s_ease]">
        <h1 className="font-display text-[26px] tracking-tight">Shopping Cart</h1>
        {items.length > 0 && (
          <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-red border border-red/20 bg-red/10 hover:bg-red/15 cursor-pointer transition-all"><Trash2 size={14} />Clear</button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-text-muted animate-[slideUp_0.5s_ease]">
          <ShoppingBag size={44} className="mx-auto mb-3.5 opacity-50" />
          <p className="text-sm">Your cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6 animate-[slideUp_0.5s_ease]">
            {items.map(i => (
              <div key={i.id} className="flex items-center gap-4 bg-surface border border-border rounded-xl p-4 transition-all hover:border-border-strong">
                <div className="w-16 h-16 bg-bg-warm rounded-lg overflow-hidden flex-shrink-0">
                  {i.product_image ? <img src={i.product_image} alt={i.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-text-muted text-lg">-</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{i.product_name}</div>
                  <div className="text-[13px] text-text-muted">${Number(i.product_price).toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(i.id, i.quantity - 1)} className="w-7 h-7 rounded-md bg-bg border border-border flex items-center justify-center cursor-pointer hover:bg-border transition-all"><Minus size={13} /></button>
                  <span className="w-8 text-center text-sm font-medium">{i.quantity}</span>
                  <button onClick={() => updateQty(i.id, i.quantity + 1)} className="w-7 h-7 rounded-md bg-bg border border-border flex items-center justify-center cursor-pointer hover:bg-border transition-all"><Plus size={13} /></button>
                </div>
                <div className="text-sm font-semibold w-16 text-right">${(Number(i.product_price) * i.quantity).toFixed(2)}</div>
                <button onClick={() => handleRemove(i.id)} className="w-7 h-7 rounded-md bg-red/10 border border-red/15 flex items-center justify-center text-red cursor-pointer hover:bg-red/15 transition-all"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 animate-[slideUp_0.6s_ease]">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-text-secondary">Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
              <span className="text-[13px] text-text-muted">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-5 pt-4 border-t border-border">
              <span className="font-display text-lg">Total</span>
              <span className="font-display text-xl">${total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} disabled={checkoutLoading} className="w-full py-3 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50">{checkoutLoading ? 'Placing order...' : 'Checkout'}</button>
          </div>
        </>
      )}
    </div>
  )
}
