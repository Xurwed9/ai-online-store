import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { products as productsApi, categories as categoriesApi, orders as ordersApi, payments as paymentsApi, chat as chatApi } from '../api/client'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BarChart3, Package, Grid3X3, ShoppingBag, Users,
  CreditCard, Brain, Bot, Star, Ticket, Settings, LogOut,
  ChevronLeft, ChevronRight, Search, Bell, TrendingUp,
  ArrowUpRight, ArrowDownRight, Activity, DollarSign, Clock,
  RefreshCw, Sparkles, Target, Send, X, Menu,
} from 'lucide-react'

function getNavSections(t) {
  return [
    { label: t('sidebar.sections.overview'), items: [
      { icon: LayoutDashboard, label: t('sidebar.nav.dashboard'), key: 'dashboard' },
      { icon: BarChart3, label: t('sidebar.nav.analytics'), key: 'analytics' },
    ]},
    { label: t('sidebar.sections.management'), items: [
      { icon: Package, label: t('sidebar.nav.products'), key: 'products', route: '/products' },
      { icon: Grid3X3, label: t('sidebar.nav.categories'), key: 'categories', route: '/categories' },
      { icon: ShoppingBag, label: t('sidebar.nav.orders'), key: 'orders', route: '/orders' },
      { icon: Users, label: t('sidebar.nav.customers'), key: 'customers' },
      { icon: CreditCard, label: t('sidebar.nav.payments'), key: 'payments', route: '/payments' },
    ]},
    { label: t('sidebar.sections.ai_tools'), items: [
      { icon: Brain, label: t('sidebar.nav.ai_analytics'), key: 'ai-analytics' },
      { icon: Bot, label: t('sidebar.nav.ai_assistant'), key: 'ai-assistant' },
      { icon: Package, label: t('sidebar.nav.inventory'), key: 'inventory' },
      { icon: Star, label: t('sidebar.nav.reviews'), key: 'reviews' },
    ]},
    { label: t('sidebar.sections.system'), items: [
      { icon: Ticket, label: t('sidebar.nav.coupons'), key: 'coupons' },
      { icon: Settings, label: t('sidebar.nav.settings'), key: 'settings' },
    ]},
  ]
}

const statusColors = {
  pending: { bg: 'rgba(212,168,32,0.12)', text: '#d4a820', border: 'rgba(212,168,32,0.2)' },
  confirmed: { bg: 'rgba(255,120,80,0.12)', text: '#ff7850', border: 'rgba(255,120,80,0.2)' },
  shipped: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
  delivered: { bg: 'rgba(92,184,106,0.12)', text: '#5cb86a', border: 'rgba(92,184,106,0.2)' },
  cancelled: { bg: 'rgba(224,96,96,0.12)', text: '#e06060', border: 'rgba(224,96,96,0.2)' },
}

function fmt(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${Number(n).toFixed(2)}`
}
function fmtNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
function genSpark(seed, n = 7) {
  const arr = []; let v = 40 + (seed % 60)
  for (let i = 0; i < n; i++) { v += Math.sin(seed * (i + 1) * 0.7) * 15 + Math.cos(seed * i * 0.3) * 10; arr.push(Math.max(5, Math.min(95, v))) }
  return arr
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—' }
function initials(name) { return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }
const ease = [0.16, 1, 0.3, 1]

function Sparkline({ data, color, w = 80, h = 32 }) {
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`).join(' ')
  const uid = color.replace('#', '')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs><linearGradient id={`sp${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sp${uid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AreaChart({ data, labels, color = '#ff7850', height = 200, title }) {
  const { colors } = useTheme()
  const W = 600, pad = { t: 20, r: 20, b: 30, l: 50 }, cw = W - pad.l - pad.r, ch = height - pad.t - pad.b
  const max = Math.max(...data) * 1.1 || 100, range = max
  const points = data.map((v, i) => ({ x: pad.l + (i / Math.max(data.length - 1, 1)) * cw, y: pad.t + ch - (v / range) * ch }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${points[points.length - 1].x},${pad.t + ch} L${points[0].x},${pad.t + ch} Z`
  const uid = color.replace('#', '')
  return (
    <div style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, padding: 20 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 16 }}>{title}</div>}
      <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }}>
        <defs><linearGradient id={`ag${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <g key={i}><line x1={pad.l} y1={pad.t + ch * (1 - pct)} x2={W - pad.r} y2={pad.t + ch * (1 - pct)} stroke={colors.borderLight} />
            <text x={pad.l - 8} y={pad.t + ch * (1 - pct) + 4} textAnchor="end" fill={colors.textMuted} fontSize="9">{fmtNum(Math.round(range * pct))}</text></g>
        ))}
        <motion.path d={area} fill={`url(#ag${uid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
        <motion.path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} />
        {points.map((p, i) => <motion.circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke={colors.bg} strokeWidth="1.5" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, delay: 1.2 + i * 0.06 }} />)}
        {labels.map((l, i) => <text key={i} x={pad.l + (i / Math.max(labels.length - 1, 1)) * cw} y={height - 4} textAnchor="middle" fill={colors.textMuted} fontSize="9">{l}</text>)}
      </svg>
    </div>
  )
}

function BarChart({ items, height = 200, title }) {
  const { colors } = useTheme()
  const max = Math.max(...items.map(i => i.value)) || 1
  return (
    <div style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, padding: 20 }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 16 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: height - 40, padding: '0 4px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${(item.value / max) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.08, ease }}
              style={{ width: '100%', borderRadius: 6, background: `linear-gradient(to top, ${item.color}40, ${item.color})`, position: 'relative', minHeight: 4 }}>
              <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: 10, fontWeight: 600, color: item.color, whiteSpace: 'nowrap' }}>{fmtNum(item.value)}</div>
            </motion.div>
            <span style={{ fontSize: 9, color: colors.textMuted, textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DonutChart({ segments, size = 180, title }) {
  const { colors } = useTheme()
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  const r = (size - 20) / 2, circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 16, alignSelf: 'flex-start' }}>{title}</div>}
      <svg width={size} height={size}>
        {segments.map((seg, i) => { const len = (seg.value / total) * circ; const cur = offset; offset += len; return (
          <motion.circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-cur} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: i * 0.1 }} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        )})}
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill={colors.text} fontSize="18" fontWeight="700">{fmtNum(total)}</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fill={colors.textMuted} fontSize="9">Total</text>
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, justifyContent: 'center' }}>
        {segments.map((seg, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color }} /><span style={{ fontSize: 10, color: colors.textMuted }}>{seg.label}</span></div>)}
      </div>
    </div>
  )
}

function Sidebar({ collapsed, onToggle, activeSection, onNavigate, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const navSections = getNavSections(t)
  const handleNav = (item) => {
    if (item.key === 'ai-assistant') { onNavigate(item); return }
    if (item.route) { navigate(item.route); if (mobileOpen) onMobileClose(); return }
    if (item.key) { onNavigate(item); if (mobileOpen) onMobileClose() }
  }
  const content = (
    <>
      <div style={{ padding: collapsed ? '20px 12px' : '20px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 15px rgba(255,120,80,0.25)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AI</span>
        </div>
        {!collapsed && <span style={{ fontSize: 15, fontWeight: 600, color: colors.text, whiteSpace: 'nowrap' }}>{t('sidebar.ai_store')}</span>}
      </div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed ? '0 8px' : '0 12px' }}>
        {navSections.map((section, si) => (
          <div key={si} style={{ marginBottom: 20 }}>
            {!collapsed && <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', color: colors.textMuted, padding: '0 12px', marginBottom: 6 }}>{section.label}</div>}
            {section.items.map((item) => {
              const Icon = item.icon, isActive = activeSection === item.key
              return (
                <motion.button key={item.key} whileTap={{ scale: 0.97 }} onClick={() => handleNav(item)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '9px 0' : '9px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? 'rgba(255,120,80,0.08)' : 'transparent', color: isActive ? '#ff7850' : colors.textMuted, transition: 'all 0.2s', position: 'relative', marginBottom: 1 }}>
                  {isActive && <motion.div layoutId="sidebar-active" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 2, background: '#ff7850' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <Icon size={17} />
                  {!collapsed && <span style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 400 }}>{item.label}</span>}
                </motion.button>
              )
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding: collapsed ? '12px 8px' : '12px 14px', borderTop: `1px solid ${colors.borderLight}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px', borderRadius: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #ff7850, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{initials(user?.username)}</span>
          </div>
          {!collapsed && <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 11, fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div><div style={{ fontSize: 9, color: colors.textMuted }}>{user?.role}</div></div>}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          <button onClick={onToggle} style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}</button>
          <button onClick={() => { logout(); navigate('/'); }} style={{ flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11 }}><LogOut size={13} />{!collapsed && t('sidebar.out')}</button>
        </div>
      </div>
    </>
  )
  return (
    <>
      <motion.aside initial={false} animate={{ width: collapsed ? 64 : 240 }} transition={{ duration: 0.3, ease }} className="dashboard-sidebar"
        style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40, background: colors.glass, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRight: `1px solid ${colors.glassBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {content}
      </motion.aside>
      <AnimatePresence>
        {mobileOpen && (<>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} className="dashboard-mobile-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 45, display: 'none' }} />
          <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.3, ease }} className="dashboard-mobile-sidebar"
            style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 50, background: colors.bg, backdropFilter: 'blur(24px)', borderRight: `1px solid ${colors.glassBorder}`, display: 'none', flexDirection: 'column', overflow: 'hidden' }}>
            <button onClick={onMobileClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', zIndex: 1 }}><X size={16} /></button>
            {content}
          </motion.aside>
        </>)}
      </AnimatePresence>
    </>
  )
}

function TopBar({ onMenuToggle }) {
  const [sf, setSf] = useState(false)
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30, background: `${colors.bg}dd`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${colors.borderLight}`, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={onMenuToggle} className="dashboard-hamburger" style={{ display: 'none', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 6 }}><Menu size={18} /></button>
      <h1 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginRight: 'auto' }}>{t('topbar.dashboard')}</h1>
      <div style={{ position: 'relative', width: sf ? 280 : 200, transition: 'width 0.3s', maxWidth: '40vw' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
        <input onFocus={() => setSf(true)} onBlur={() => setSf(false)} placeholder={t('topbar.search_placeholder')} style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 8, border: `1px solid ${sf ? 'rgba(255,120,80,0.2)' : colors.borderLight}`, background: colors.glass, color: colors.text, fontSize: 12, outline: 'none', transition: 'all 0.3s' }} />
      </div>
      <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(255,120,80,0.15)', background: 'rgba(255,120,80,0.06)', color: '#ff7850', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={15} /></button>
      <button style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}><Bell size={15} /><div style={{ position: 'absolute', top: 5, right: 5, width: 6, height: 6, borderRadius: '50%', background: '#ff6b6b' }} /></button>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #ff7850, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><span style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>A</span></div>
    </div>
  )
}

function StatCard({ label, value, change, data, color, icon: Icon, delay = 0 }) {
  const { colors } = useTheme()
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }} whileHover={{ y: -3 }}
      style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 14, padding: 20, position: 'relative', overflow: 'hidden', transition: 'border-color 0.3s, box-shadow 0.3s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.boxShadow = `0 8px 30px ${color}10` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.glassBorder; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`, filter: 'blur(15px)' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, border: `1px solid ${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} style={{ color }} /></div>
        <Sparkline data={data} color={color} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: colors.text, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: colors.textMuted }}>{label}</span>
        {change !== undefined && <span style={{ fontSize: 10, fontWeight: 600, color: change >= 0 ? '#5cb86a' : '#e06060', display: 'flex', alignItems: 'center', gap: 2 }}>{change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}{Math.abs(change)}%</span>}
      </div>
    </motion.div>
  )
}

function OrdersTable({ orders }) {
  const [page, setPage] = useState(0), perPage = 8
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const sorted = useMemo(() => [...orders].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)), [orders])
  const paged = sorted.slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil(sorted.length / perPage)
  return (
    <div style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t('orders_table.recent_orders')}</div>
        <div style={{ fontSize: 10, color: colors.textMuted }}>{t('orders_table.total', { count: orders.length })}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{[t('orders_table.col_order'), t('orders_table.col_customer'), t('orders_table.col_items'), t('orders_table.col_total'), t('orders_table.col_status'), t('orders_table.col_date')].map((h, i) => <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${colors.borderLight}` }}>{h}</th>)}</tr></thead>
          <tbody>{paged.map((o, i) => { const sc = statusColors[o.status] || statusColors.pending; return (
            <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              style={{ borderBottom: `1px solid ${colors.borderLight}`, transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = colors.glassHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: colors.text }}>#{o.id}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textSecondary }}>{o.username || t('orders_table.user', { id: o.user_id })}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: colors.textMuted }}>{o.items?.length || 0}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: colors.text }}>{fmt(Number(o.total_price) || 0)}</td>
              <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>{o.status}</span></td>
              <td style={{ padding: '12px 16px', fontSize: 11, color: colors.textMuted }}>{fmtDate(o.created_at)}</td>
            </motion.tr>
          )})}</tbody>
        </table>
      </div>
      {totalPages > 1 && <div style={{ padding: '10px 20px', borderTop: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.textMuted, cursor: 'pointer', fontSize: 11, opacity: page === 0 ? 0.3 : 1 }}>Prev</button>
        <span style={{ fontSize: 11, color: colors.textMuted, padding: '0 8px' }}>{page + 1}/{totalPages}</span>
        <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.textMuted, cursor: 'pointer', fontSize: 11, opacity: page >= totalPages - 1 ? 0.3 : 1 }}>Next</button>
      </div>}
    </div>
  )
}

function TopProducts({ products }) {
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const top = useMemo(() => [...products].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 6), [products])
  return (
    <div style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.borderLight}`, fontSize: 13, fontWeight: 600, color: colors.text }}>{t('top_products.title')}</div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {top.map((p, i) => { const sp = Math.min(100, ((p.stock || 0) / 100) * 100); const sc = sp > 50 ? '#5cb86a' : sp > 20 ? '#d4a820' : '#e06060'; return (
          <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = colors.glassHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: colors.glass, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={14} style={{ color: colors.textMuted }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: colors.borderLight, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${sp}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} style={{ height: '100%', borderRadius: 2, background: sc }} />
                </div>
                <span style={{ fontSize: 9, color: colors.textMuted, flexShrink: 0 }}>x{p.stock || 0}</span>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, flexShrink: 0 }}>{fmt(Number(p.price) || 0)}</div>
          </motion.div>
        )})}
      </div>
    </div>
  )
}

function CustomerList({ orders }) {
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const customers = useMemo(() => {
    const map = {}
    orders.forEach(o => { const k = o.user_id; if (!map[k]) map[k] = { id: k, name: o.username || t('orders_table.user', { id: k }), orders: 0, spent: 0 }; map[k].orders++; map[k].spent += Number(o.total_price) || 0 })
    return Object.values(map).sort((a, b) => b.spent - a.spent).slice(0, 8)
  }, [orders, t])
  const accentColors = ['#ff7850', '#3b82f6', '#8b5cf6', '#5cb86a', '#d4a820', '#ff6b6b', '#06b6d4', '#f472b6']
  return (
    <div style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.borderLight}`, fontSize: 13, fontWeight: 600, color: colors.text }}>Recent Customers</div>
      <div style={{ padding: 8 }}>
        {customers.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, transition: 'background 0.2s', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = colors.glassHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accentColors[i % accentColors.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: accentColors[i % accentColors.length] }}>{initials(c.name)}</span>
              </div>
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#5cb86a', border: `2px solid ${colors.bg}` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{c.name}</div><div style={{ fontSize: 10, color: colors.textMuted }}>{c.orders} order{c.orders !== 1 ? 's' : ''}</div></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{fmt(c.spent)}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function AIInsights({ products, orders, payments }) {
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const revenue = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const delivered = orders.filter(o => o.status === 'delivered').length
  const avgRating = products.length ? (products.reduce((s, p) => s + (p.rating || 4), 0) / products.length).toFixed(1) : '4.5'
  const insights = [
    { icon: Sparkles, color: '#ff7850', title: t('ai_insights.recommendations_title'), desc: t('ai_insights.recommendations_desc', { count: orders.length, products: products.slice(0, 2).map(p => p.name).join(' & ') || 'top products' }), metric: t('ai_insights.recommendations_metric', { count: delivered }) },
    { icon: Target, color: '#3b82f6', title: t('ai_insights.behavior_title'), desc: t('ai_insights.behavior_desc', { value: fmt(revenue / Math.max(orders.length, 1)) }), metric: t('ai_insights.behavior_metric', { count: orders.length }) },
    { icon: TrendingUp, color: '#5cb86a', title: t('ai_insights.demand_title'), desc: t('ai_insights.demand_desc', { count: products.filter(p => (p.stock || 0) < 10).length }), metric: t('ai_insights.demand_metric', { count: products.length }) },
    { icon: Activity, color: '#8b5cf6', title: t('ai_insights.forecast_title'), desc: t('ai_insights.forecast_desc', { value: fmt(revenue * 1.15), percent: Math.round(delivered / Math.max(orders.length, 1) * 100) }), metric: t('ai_insights.forecast_metric', { rating: avgRating }) },
  ]
  return (
    <div id="section-ai-analytics">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Brain size={16} style={{ color: '#8b5cf6' }} /><span style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>{t('ai_insights.title')}</span>
        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.15)' }}>{t('ai_insights.powered')}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        {insights.map((ins, i) => { const Icon = ins.icon; return (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease }}
            style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 14, padding: 20, transition: 'border-color 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${ins.color}25`} onMouseLeave={e => e.currentTarget.style.borderColor = colors.glassBorder}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ins.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} style={{ color: ins.color }} /></div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{ins.title}</div>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: colors.textMuted, margin: '0 0 12px' }}>{ins.desc}</p>
            <span style={{ fontSize: 12, fontWeight: 600, color: ins.color }}>{ins.metric}</span>
          </motion.div>
        )})}
      </div>
    </div>
  )
}

function InventoryWidget({ products }) {
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const low = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10)
  const out = products.filter(p => (p.stock || 0) === 0)
  const recent = [...products].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4)
  return (
    <div id="section-inventory" style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.borderLight}`, fontSize: 13, fontWeight: 600, color: colors.text }}>{t('inventory.title')}</div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(212,168,32,0.06)', border: '1px solid rgba(212,168,32,0.1)' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#d4a820' }}>{low.length}</div><div style={{ fontSize: 10, color: colors.textMuted }}>{t('inventory.low_stock')}</div></div>
          <div style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(224,96,96,0.06)', border: '1px solid rgba(224,96,96,0.1)' }}><div style={{ fontSize: 20, fontWeight: 700, color: '#e06060' }}>{out.length}</div><div style={{ fontSize: 10, color: colors.textMuted }}>{t('inventory.out_of_stock')}</div></div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t('inventory.recently_added')}</div>
        {recent.map(p => <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: (p.stock || 0) > 10 ? '#5cb86a' : (p.stock || 0) > 0 ? '#d4a820' : '#e06060' }} /><span style={{ flex: 1, fontSize: 11, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span><span style={{ fontSize: 10, color: colors.textMuted }}>x{p.stock || 0}</span></div>)}
      </div>
    </div>
  )
}

function AIAssistant({ open, onClose }) {
  const { t } = useTranslation('dashboard')
  const [messages, setMessages] = useState([{ role: 'assistant', content: t('ai_assistant.welcome') }])
  const [input, setInput] = useState(''), [loading, setLoading] = useState(false)
  const { colors } = useTheme()
  const scrollRef = useRef(null)
  const quickActions = [{ label: t('ai_assistant.generate_report'), icon: BarChart3 }, { label: t('ai_assistant.find_products'), icon: Package }, { label: t('ai_assistant.analyze_sales'), icon: TrendingUp }, { label: t('ai_assistant.forecast_revenue'), icon: Target }]
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])
  const send = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg]); setInput(''); setLoading(true)
    try {
      const { data } = await chatApi.send([...messages, userMsg].map(m => ({ role: m.role, content: m.content })))
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.message || 'I received your request.' }])
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: t('ai_assistant.error') }]) }
    finally { setLoading(false) }
  }
  return (
    <AnimatePresence>{open && (
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.3, ease }}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 360, maxHeight: 480, zIndex: 100, borderRadius: 16, border: `1px solid ${colors.glassBorder}`, background: `${colors.bg}f5`, backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #ff7850, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bot size={14} style={{ color: '#fff' }} /></div>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t('ai_assistant.title')}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300 }}>
          {messages.map((m, i) => <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px', background: m.role === 'user' ? 'rgba(255,120,80,0.12)' : colors.glass, border: `1px solid ${m.role === 'user' ? 'rgba(255,120,80,0.15)' : colors.borderLight}` }}>
              <div style={{ fontSize: 11, lineHeight: 1.5, color: m.role === 'user' ? '#ffccaa' : colors.textSecondary }}>{m.content}</div>
            </div>
          </div>)}
          {loading && <div style={{ fontSize: 10, color: colors.textMuted, padding: '4px 8px' }}>{t('ai_assistant.thinking')}</div>}
        </div>
        <div style={{ padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {quickActions.map((a, i) => { const Icon = a.icon; return (
            <button key={i} onClick={() => send(a.label)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.textMuted, cursor: 'pointer', fontSize: 9, transition: 'all 0.2s' }}><Icon size={10} />{a.label}</button>
          )})}
        </div>
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${colors.borderLight}`, display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder={t('ai_assistant.input_placeholder')} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.glass, color: colors.text, fontSize: 11, outline: 'none' }} />
          <button onClick={() => send(input)} disabled={!input.trim() || loading} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: input.trim() ? 'linear-gradient(135deg, #ff7850, #ff6b6b)' : colors.glass, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={13} /></button>
        </div>
      </motion.div>
    )}</AnimatePresence>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { colors } = useTheme()
  const { t } = useTranslation('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [aiOpen, setAiOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allProducts, setAllProducts] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [allPayments, setAllPayments] = useState([])
  const [allCategories, setAllCategories] = useState([])

  useEffect(() => {
    Promise.all([
      productsApi.getAll().catch(() => ({ data: [] })),
      ordersApi.getAllAdmin().catch(() => ({ data: [] })),
      paymentsApi.getAllAdmin().catch(() => ({ data: [] })),
      categoriesApi.getAll().catch(() => ({ data: [] })),
    ]).then(([p, o, pay, c]) => { setAllProducts(p.data || []); setAllOrders(o.data || []); setAllPayments(pay.data || []); setAllCategories(c.data || []) })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const revenue = allPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    return { revenue, totalOrders: allOrders.length, totalProducts: allProducts.length, uniqueCustomers: new Set(allOrders.map(o => o.user_id)).size, pendingOrders: allOrders.filter(o => o.status === 'pending').length, avgOrderValue: allOrders.length > 0 ? revenue / allOrders.length : 0 }
  }, [allProducts, allOrders, allPayments])

  const handleNavigate = useCallback((item) => {
    if (item.key === 'ai-assistant') { setAiOpen(true); return }
    if (item.route) { navigate(item.route); return }
    setActiveSection(item.key)
    const el = document.getElementById(`section-${item.key}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [navigate])

  const chartColors = ['#ff7850', '#3b82f6', '#8b5cf6', '#5cb86a', '#d4a820', '#ff6b6b']

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: colors.bg }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw size={22} style={{ color: '#ff7850' }} /></motion.div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: colors.bg }} className="dashboard-root">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} activeSection={activeSection} onNavigate={handleNavigate} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div style={{ flex: 1, marginLeft: sidebarCollapsed ? 64 : 240, transition: 'margin-left 0.3s', minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="dashboard-main">
        <TopBar onMenuToggle={() => setMobileOpen(true)} />
        <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: 4 }}>{t('welcome.title', { name: user?.username })}</h2>
            <p style={{ fontSize: 13, color: colors.textMuted }}>{t('welcome.subtitle')}</p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" style={{ gap: 12 }}>
            <StatCard icon={DollarSign} label={t('stats.revenue')} value={fmt(stats.revenue)} change={12.5} data={genSpark(1)} color="#ff7850" delay={0.05} />
            <StatCard icon={ShoppingBag} label={t('stats.orders')} value={fmtNum(stats.totalOrders)} change={8.2} data={genSpark(2)} color="#3b82f6" delay={0.1} />
            <StatCard icon={Package} label={t('stats.products')} value={fmtNum(stats.totalProducts)} change={5.1} data={genSpark(3)} color="#8b5cf6" delay={0.15} />
            <StatCard icon={Users} label={t('stats.customers')} value={fmtNum(stats.uniqueCustomers)} change={15.3} data={genSpark(4)} color="#5cb86a" delay={0.2} />
            <StatCard icon={TrendingUp} label={t('stats.avg_order')} value={fmt(stats.avgOrderValue)} change={-2.4} data={genSpark(5)} color="#ff6b6b" delay={0.25} />
            <StatCard icon={Clock} label={t('stats.pending')} value={String(stats.pendingOrders)} change={-8.0} data={genSpark(6)} color="#d4a820" delay={0.3} />
          </div>

          <div id="section-analytics" className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 12 }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <AreaChart title={t('charts.sales_trend')} data={[stats.revenue * 0.6, stats.revenue * 0.75, stats.revenue * 0.5, stats.revenue * 0.85, stats.revenue * 0.9, stats.revenue * 0.95, stats.revenue]} labels={[t('chart_labels.mon'), t('chart_labels.tue'), t('chart_labels.wed'), t('chart_labels.thu'), t('chart_labels.fri'), t('chart_labels.sat'), t('chart_labels.sun')]} color="#ff7850" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <BarChart title={t('charts.revenue_by_category')} height={200} items={allCategories.slice(0, 6).map((c, i) => ({ label: c.name?.slice(0, 8) || `Cat ${i + 1}`, value: Math.round(500 + Math.random() * 2000), color: chartColors[i % chartColors.length] }))} />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: 12 }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
              <DonutChart title={t('charts.order_status')} size={170} segments={[
                { label: t('donut_delivered'), value: allOrders.filter(o => o.status === 'delivered').length || 1, color: '#5cb86a' },
                { label: t('donut_shipped'), value: allOrders.filter(o => o.status === 'shipped').length || 1, color: '#3b82f6' },
                { label: t('donut_pending'), value: allOrders.filter(o => o.status === 'pending').length || 1, color: '#d4a820' },
                { label: t('donut_cancelled'), value: allOrders.filter(o => o.status === 'cancelled').length || 1, color: '#e06060' },
              ]} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }} className="lg:col-span-2">
              <AreaChart title={t('charts.monthly_revenue')} data={[stats.revenue * 0.3, stats.revenue * 0.5, stats.revenue * 0.45, stats.revenue * 0.7, stats.revenue * 0.65, stats.revenue * 0.85, stats.revenue * 0.8, stats.revenue]} labels={[t('chart_labels.jan'), t('chart_labels.feb'), t('chart_labels.mar'), t('chart_labels.apr'), t('chart_labels.may'), t('chart_labels.jun'), t('chart_labels.jul'), t('chart_labels.aug')]} color="#3b82f6" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5" style={{ gap: 12 }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="xl:col-span-3"><OrdersTable orders={allOrders} /></motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.65 }} className="xl:col-span-2"><TopProducts products={allProducts} /></motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }}><AIInsights products={allProducts} orders={allOrders} payments={allPayments} /></motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: 12 }}>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.8 }}><CustomerList orders={allOrders} /></motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.85 }}><InventoryWidget products={allProducts} /></motion.div>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.9 }} id="section-reviews"
              style={{ background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Star size={14} style={{ color: '#d4a820' }} /><span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t('quick_actions.title')}</span></div>
              {[
                { label: t('quick_actions.manage_products'), sub: t('quick_actions.manage_products_sub'), route: '/products', color: '#ff7850' },
                { label: t('quick_actions.view_categories'), sub: t('quick_actions.view_categories_sub'), route: '/categories', color: '#3b82f6' },
                { label: t('quick_actions.process_orders'), sub: t('quick_actions.process_orders_sub'), route: '/orders', color: '#5cb86a' },
                { label: t('quick_actions.payment_history'), sub: t('quick_actions.payment_history_sub'), route: '/payments', color: '#8b5cf6' },
              ].map((a, i) => (
                <motion.div key={i} whileHover={{ x: 3 }} onClick={() => navigate(a.route)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s', marginBottom: 4 }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.glassHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color }} />
                  <div><div style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{a.label}</div><div style={{ fontSize: 10, color: colors.textMuted }}>{a.sub}</div></div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <footer style={{ textAlign: 'center', padding: '16px 0 8px', borderTop: `1px solid ${colors.borderLight}` }}>
            <span style={{ fontSize: 11, color: colors.textMuted }}>{t('footer')}</span>
          </footer>
        </main>
      </div>
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
