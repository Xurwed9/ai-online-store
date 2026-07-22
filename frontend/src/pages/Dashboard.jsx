import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { products as productsApi, categories as categoriesApi } from '../api/client'
import { ShoppingCart, FolderOpen, DollarSign, CheckCircle, Package, Tags, LogOut } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ products: 0, categories: 0 })

  useEffect(() => {
    productsApi.getAll().then(r => setStats(s => ({ ...s, products: r.data.length }))).catch(() => {})
    categoriesApi.getAll().then(r => setStats(s => ({ ...s, categories: r.data.length }))).catch(() => {})
  }, [])

  const cards = [
    { icon: <ShoppingCart size={18} />, value: stats.products, label: 'Total Products', color: 'bg-accent/10 text-accent border-accent/12' },
    { icon: <FolderOpen size={18} />, value: stats.categories, label: 'Categories', color: 'bg-green/10 text-green border-green/12' },
    { icon: <DollarSign size={18} />, value: '--', label: 'Revenue', color: 'bg-yellow/10 text-yellow border-yellow/12' },
    { icon: <CheckCircle size={18} />, value: 'Active', label: 'Account Status', color: 'bg-green/10 text-green border-green/12' },
  ]

  const actions = [
    { to: '/products', icon: <ShoppingCart size={18} />, color: 'bg-accent/10 text-accent border-accent/12', title: 'Products', desc: 'View & manage inventory' },
    { to: '/categories', icon: <FolderOpen size={18} />, color: 'bg-green/10 text-green border-green/12', title: 'Categories', desc: 'Organize product types' },
  ]

  return (
    <div className="flex-1 px-8 py-10 max-w-[1100px] mx-auto w-full">
      <div className="mb-9 animate-[slideUp_0.4s_ease]">
        <h1 className="font-display text-[34px] tracking-[-0.5px] mb-1">Welcome, <span className="text-accent">{user?.name || 'User'}</span></h1>
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
      <h2 className="font-display text-xl mb-4 animate-[slideUp_0.6s_ease]">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 animate-[slideUp_0.6s_ease]">
        {actions.map((a, i) => (
          <Link key={i} to={a.to} className="flex items-center gap-3.5 px-4 py-4 bg-surface border border-border rounded-xl no-underline text-text transition-all hover:border-border-strong hover:shadow-sm hover:-translate-y-px">
            <div className={`w-[38px] h-[38px] rounded-[10px] border flex items-center justify-center text-lg ${a.color}`}>{a.icon}</div>
            <div>
              <div className="text-sm font-medium">{a.title}</div>
              <div className="text-xs text-text-muted mt-0.5">{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
