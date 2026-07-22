import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sun, Moon, LogOut, LayoutDashboard, ShoppingCart, Package } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const isActive = (p) => location.pathname === p

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-bg/85 backdrop-blur-xl border-b border-border">
      <Link to="/" className="flex items-center gap-2.5 no-underline text-text">
        <div className="w-8 h-8 rounded-lg bg-text text-bg flex items-center justify-center text-xs font-bold tracking-tight">AI</div>
        <span className="text-[15px] font-semibold tracking-tight">AI Store</span>
      </Link>
      <div className="flex items-center gap-1.5">
        {user ? (
          <>
            {isAdmin && <Link to="/dashboard" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/dashboard') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}>Dashboard</Link>}
            <Link to="/products" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/products') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}>Products</Link>
            <Link to="/categories" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/categories') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}>Categories</Link>
            <Link to="/cart" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all flex items-center gap-1 ${isActive('/cart') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}><ShoppingCart size={14} />Cart</Link>
            <Link to="/orders" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all flex items-center gap-1 ${isActive('/orders') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}><Package size={14} />Orders</Link>
            <Link to="/profile" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/profile') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}>Profile</Link>
            <button onClick={logout} className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-red border border-red/20 bg-red/10 hover:bg-red/15 cursor-pointer transition-all flex items-center gap-1.5"><LogOut size={14} />Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/login') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}>Login</Link>
            <Link to="/register" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/register') ? 'text-accent bg-accent/10' : 'text-text-secondary hover:text-text hover:bg-border'}`}>Register</Link>
          </>
        )}
        <button onClick={toggle} className="w-[34px] h-[34px] rounded-lg border border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text hover:bg-bg flex items-center justify-center cursor-pointer transition-all" title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </nav>
  )
}
