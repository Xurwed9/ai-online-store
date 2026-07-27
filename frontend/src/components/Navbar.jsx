import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { orders as ordersApi } from '../api/client'
import { Sun, Moon, LogOut, ShoppingCart, Package, CreditCard, Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const isLanding = location.pathname === '/'
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const isActive = (p) => location.pathname === p

  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (isAdmin) {
      ordersApi.pendingCount().then(r => setPendingCount(r.data.count)).catch(() => {})
    }
  }, [isAdmin, location.pathname])

  const isDark = theme === 'dark'

  const navPad = isLanding && !scrolled ? 'py-4' : 'py-2.5'
  const navBg = isLanding
    ? scrolled
      ? 'bg-[#090B16]/80 backdrop-blur-xl border-b border-white/[0.04]'
      : 'bg-transparent'
    : isDark
      ? 'bg-bg/85 backdrop-blur-xl border-b border-border'
      : 'bg-bg/85 backdrop-blur-xl border-b border-border'

  return (
    <nav
      className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 ${navPad} ${navBg} transition-all duration-500`}
    >
      <Link to="/" className="flex items-center gap-3 no-underline text-text">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #ff7850, #ff6b6b)',
            boxShadow: '0 0 20px rgba(255,120,80,0.2)',
          }}
        >
          <span className="text-[11px] font-bold tracking-tight text-white">AI</span>
        </div>
        <span className={`text-[16px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-text'}`}>{t('app_name')}</span>
      </Link>

      {isLanding && (
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <span className="text-[12px] font-medium text-white/30 tracking-widest uppercase">{t('landing.footer.tagline')}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {user ? (
          <>
            {isAdmin && <Link to="/dashboard" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/dashboard') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}>{t('nav.dashboard')}</Link>}
            <Link to="/products" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/products') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}>{t('nav.products')}</Link>
            <Link to="/categories" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/categories') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}>{t('nav.categories')}</Link>
            <Link to="/cart" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all flex items-center gap-1 ${isActive('/cart') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}><ShoppingCart size={14} />{t('nav.cart')}</Link>
            <Link to="/favorites" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all flex items-center gap-1 ${isActive('/favorites') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}><Heart size={14} />{t('nav.favorites')}</Link>
            <Link to="/orders" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all flex items-center gap-1 ${isActive('/orders') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}>
              <Package size={14} />{t('nav.orders')}
              {isAdmin && pendingCount > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-neon-red text-white text-[10px] font-bold leading-none">{pendingCount}</span>}
            </Link>
            <Link to="/payments" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all flex items-center gap-1 ${isActive('/payments') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}><CreditCard size={14} />{t('nav.payments')}</Link>
            <Link to="/profile" className={`px-3 py-1.5 rounded-lg text-[13px] font-medium no-underline transition-all ${isActive('/profile') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}>{t('nav.profile')}</Link>
            <button onClick={logout} className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-neon-red border border-neon-red/20 bg-neon-red/10 hover:bg-neon-red/15 cursor-pointer transition-all flex items-center gap-1.5"><LogOut size={14} />{t('nav.logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login" className={`px-4 py-2 rounded-xl text-[13px] font-medium no-underline transition-all ${isActive('/login') ? 'text-accent bg-accent/10' : isDark ? 'text-white/50 hover:text-white hover:bg-white/[0.05]' : 'text-text-muted hover:text-text hover:bg-black/[0.05]'}`}>{t('nav.login')}</Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-xl text-[13px] font-semibold no-underline text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,120,80,0.2)]"
              style={{ background: 'linear-gradient(135deg, #ff7850, #ff6b6b)' }}
            >
              {t('nav.register')}
            </Link>
          </>
        )}
        <LanguageSwitcher />
        <button onClick={toggle} className={`w-[34px] h-[34px] rounded-lg border flex items-center justify-center cursor-pointer transition-all ${isDark ? 'border-white/[0.06] bg-white/[0.03] text-white/40 hover:border-accent/20 hover:text-white hover:bg-white/[0.05]' : 'border-black/[0.08] bg-black/[0.03] text-text-muted hover:border-accent/30 hover:text-text hover:bg-black/[0.05]'}`} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </nav>
  )
}
