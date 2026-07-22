import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { products as productsApi, categories as categoriesApi, orders as ordersApi } from '../api/client'
import { toast } from 'react-hot-toast'
import { ShoppingCart, FolderOpen, Package, Clock, CheckCircle, Truck } from 'lucide-react'

const statusStyles = {
  pending: 'bg-yellow/10 text-yellow',
  confirmed: 'bg-accent/10 text-accent',
  shipped: 'bg-blue/10 text-blue',
  delivered: 'bg-green/10 text-green',
  cancelled: 'bg-red/10 text-red',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ products: 0, categories: 0, pendingOrders: 0 })
  const [pendingOrders, setPendingOrders] = useState([])

  useEffect(() => {
    productsApi.getAll().then(r => setStats(s => ({ ...s, products: r.data.length }))).catch(() => {})
    categoriesApi.getAll().then(r => setStats(s => ({ ...s, categories: r.data.length }))).catch(() => {})
    ordersApi.getAllAdmin().then(r => {
      const pending = r.data.filter(o => o.status === 'pending')
      setStats(s => ({ ...s, pendingOrders: pending.length }))
      setPendingOrders(pending.slice(0, 5))
    }).catch(() => {})
  }, [])

  const handleStatus = async (id, status) => {
    try { await ordersApi.updateStatus(id, status); toast.success('Status updated'); window.location.reload() }
    catch (err) { toast.error(err?.response?.data?.detail || 'Update failed') }
  }

  const cards = [
    { icon: <ShoppingCart size={18} />, value: stats.products, label: 'Total Products', color: 'bg-accent/10 text-accent border-accent/12' },
    { icon: <FolderOpen size={18} />, value: stats.categories, label: 'Categories', color: 'bg-green/10 text-green border-green/12' },
    { icon: <Clock size={18} />, value: stats.pendingOrders, label: 'Pending Orders', color: 'bg-yellow/10 text-yellow border-yellow/12' },
    { icon: <Package size={18} />, value: <Link to="/orders" className="text-accent underline">View All</Link>, label: 'Order Management', color: 'bg-blue/10 text-blue border-blue/12' },
  ]

  return (
    <div className="flex-1 px-8 py-10 max-w-[1100px] mx-auto w-full">
      <div className="mb-9 animate-[slideUp_0.4s_ease]">
        <h1 className="font-display text-[34px] tracking-[-0.5px] mb-1">Welcome, <span className="text-accent">{user?.username || 'User'}</span></h1>
        <p className="text-[15px] text-text-secondary">Manage your store with AI-powered tools</p>
      </div>
      <div className="grid grid-cols-4 gap-3.5 mb-10 animate-[slideUp_0.5s_ease]">
        {cards.map((c, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 transition-all hover:border-border-strong hover:shadow-md hover:-translate-y-0.5">
            <div className={`w-[38px] h-[38px] rounded-[10px] border flex items-center justify-center text-lg mb-3.5 ${c.color}`}>{c.icon}</div>
            <div className="text-[26px] font-bold tracking-[-0.5px] mb-0.5">{c.value}</div>
            <div className="text-[13px] text-text-secondary">{c.label}</div>
          </div>
        ))}
      </div>

      {pendingOrders.length > 0 && (
        <div className="mb-10 animate-[slideUp_0.6s_ease]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl">Pending Orders</h2>
            <Link to="/orders" className="text-[13px] text-accent no-underline hover:text-accent-hover">View all &rarr;</Link>
          </div>
          <div className="space-y-2">
            {pendingOrders.map(o => (
              <div key={o.id} className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3 transition-all hover:border-border-strong">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">#{o.id}</span>
                  <span className="text-[13px] text-text-secondary">{o.username || `User #${o.user_id}`}</span>
                  <span className="text-[12px] text-text-muted">{o.items?.length || 0} items</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">${Number(o.total_price).toFixed(2)}</span>
                  <select
                    value={o.status}
                    onChange={e => handleStatus(o.id, e.target.value)}
                    className="text-[12px] px-2 py-1 rounded-lg bg-bg border border-border text-text cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="font-display text-xl mb-4 animate-[slideUp_0.7s_ease]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 animate-[slideUp_0.7s_ease]">
        <Link to="/products" className="flex items-center gap-3.5 px-4 py-4 bg-surface border border-border rounded-xl no-underline text-text transition-all hover:border-border-strong hover:shadow-sm hover:-translate-y-px">
          <div className="w-[38px] h-[38px] rounded-[10px] border flex items-center justify-center text-lg bg-accent/10 text-accent border-accent/12"><ShoppingCart size={18} /></div>
          <div>
            <div className="text-sm font-medium">Products</div>
            <div className="text-xs text-text-muted mt-0.5">View & manage inventory</div>
          </div>
        </Link>
        <Link to="/categories" className="flex items-center gap-3.5 px-4 py-4 bg-surface border border-border rounded-xl no-underline text-text transition-all hover:border-border-strong hover:shadow-sm hover:-translate-y-px">
          <div className="w-[38px] h-[38px] rounded-[10px] border flex items-center justify-center text-lg bg-green/10 text-green border-green/12"><FolderOpen size={18} /></div>
          <div>
            <div className="text-sm font-medium">Categories</div>
            <div className="text-xs text-text-muted mt-0.5">Organize product types</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
