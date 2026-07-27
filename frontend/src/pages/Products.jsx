import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { products as productsApi, categories as categoriesApi, favorites as favoritesApi, chat as chatApi, cart as cartApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { toast } from 'react-hot-toast'
import Modal from '../components/Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Search, Plus, Pencil, Trash2, Package, Heart, Bot, Send, Loader2, X,
  MessageSquare, ShoppingCart, Star, SlidersHorizontal, ArrowUpDown, ChevronDown,
  Grid3X3, Eye, Wrench,
} from 'lucide-react'

const empty = { name: '', description: '', price: '', color: '', size: '', stock: 0, image_url: '', category_id: '' }
const CHAT_KEY = 'ai_chat_history'
const ease = [0.16, 1, 0.3, 1]

function fmtPrice(n) { return `$${Number(n).toFixed(2)}` }

function ProductCard({ p, isAdmin, isFav, onFav, onCart, catName, delay = 0 }) {
  const [hov, setHov] = useState(false)
  const { isDark, colors } = useTheme()
  const { t: tc } = useTranslation('common')
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay, ease }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: colors.glass, border: `1px solid ${hov ? colors.glassBorderHover : colors.glassBorder}`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)', boxShadow: hov ? `${colors.cardShadow}, ${colors.glowShadow}` : 'none', transform: hov ? 'translateY(-6px)' : 'translateY(0)' }}
    >
      <Link to={`/products/${p.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden', background: colors.inputBg }}>
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.16,1,0.3,1)', transform: hov ? 'scale(1.06)' : 'scale(1)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,120,80,0.04), rgba(139,92,246,0.04))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={36} style={{ color: colors.textMuted }} /></div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: isDark ? 'linear-gradient(to top, rgba(9,11,22,0.7) 0%, transparent 50%)' : 'linear-gradient(to top, rgba(248,247,244,0.7) 0%, transparent 50%)' }} />

          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {catName && <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: colors.glass, backdropFilter: 'blur(8px)', color: colors.textSecondary, border: `1px solid ${colors.glassBorder}` }}>{catName}</span>}
            {p.stock > 0 && p.stock < 10 && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600, background: 'rgba(212,168,32,0.15)', color: '#d4a820', border: '1px solid rgba(212,168,32,0.2)' }}>{tc('product_card.low_stock')}</span>}
            {p.stock === 0 && <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600, background: 'rgba(224,96,96,0.15)', color: '#e06060', border: '1px solid rgba(224,96,96,0.2)' }}>{tc('product_card.sold_out')}</span>}
          </div>

          {!isAdmin && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFav(p.id) }}
              style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: 10, background: colors.glass, backdropFilter: 'blur(8px)', border: `1px solid ${colors.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Heart size={15} style={{ color: isFav ? '#ff6b6b' : colors.textMuted, fill: isFav ? '#ff6b6b' : 'none', transition: 'all 0.3s' }} />
            </motion.button>
          )}

          {p.stock > 0 && !isAdmin && (
            <motion.div initial={false} animate={{ opacity: hov ? 1 : 0, y: hov ? 0 : 12 }} transition={{ duration: 0.3 }}
              style={{ position: 'absolute', bottom: 12, left: 12, right: 12, pointerEvents: hov ? 'auto' : 'none' }}>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCart(p.id) }}
                style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 15px rgba(255,120,80,0.3)' }}>
                <ShoppingCart size={13} /> {tc('product_card.quick_add')}
              </button>
            </motion.div>
          )}
        </div>

        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Star size={11} style={{ color: '#d4a820', fill: '#d4a820' }} />
            <span style={{ fontSize: 10, color: colors.textMuted }}>{p.rating || '4.0'}</span>
          </div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
          <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || tc('product_card.premium_quality')}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>{fmtPrice(p.price)}</span>
            <span style={{ fontSize: 10, color: p.stock > 0 ? 'rgba(92,184,106,0.6)' : 'rgba(224,96,96,0.6)' }}>{p.stock > 0 ? tc('product_card.in_stock_count', { count: p.stock }) : tc('product_card.out_of_stock')}</span>
          </div>
        </div>
      </Link>


    </motion.div>
  )
}

function FilterPanel({ cats, filters, setFilters, sortBy, setSortBy, onClear, productCount }) {
  const [catOpen, setCatOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [ratingOpen, setRatingOpen] = useState(true)
  const { isDark, colors } = useTheme()
  const { t } = useTranslation('products')
  const toggleCat = (id) => setFilters(f => ({ ...f, categories: f.categories.includes(id) ? f.categories.filter(c => c !== id) : [...f.categories, id] }))

  const section = { background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 12, overflow: 'hidden' }
  const btn = (open) => ({ width: '100%', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', color: colors.text, fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase' })
  const chevron = (open) => ({ transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'rotate(0)', color: colors.textMuted })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t('filters.title')}</span>
        <button onClick={onClear} style={{ background: 'none', border: 'none', color: colors.accent, fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>{t('filters.clear_all')}</button>
      </div>
      <div style={{ fontSize: 11, color: colors.textMuted }}>{t('products_page.product_count', { count: productCount })}</div>

      {/* Categories */}
      <div style={section}>
        <button onClick={() => setCatOpen(!catOpen)} style={btn(catOpen)}>{t('filters.category')} <ChevronDown size={14} style={chevron(catOpen)} /></button>
        <AnimatePresence>{catOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cats.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0' }}>
                <div onClick={() => toggleCat(c.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${filters.categories.includes(c.id) ? colors.accent : colors.inputBorder}`, background: filters.categories.includes(c.id) ? 'rgba(255,120,80,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: 'pointer' }}>
                  {filters.categories.includes(c.id) && <div style={{ width: 8, height: 8, borderRadius: 2, background: colors.accent }} />}
                </div>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{c.name}</span>
              </label>
            ))}
          </div>
        </motion.div>}</AnimatePresence>
      </div>

      {/* Price */}
      <div style={section}>
        <button onClick={() => setPriceOpen(!priceOpen)} style={btn(priceOpen)}>{t('filters.price')} <ChevronDown size={14} style={chevron(priceOpen)} /></button>
        <AnimatePresence>{priceOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 14px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} placeholder={t('filters.min')} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.text, fontSize: 11, outline: 'none', width: '100%' }} />
            <span style={{ color: colors.textMuted, fontSize: 11 }}>-</span>
            <input value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} placeholder={t('filters.max')} style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.text, fontSize: 11, outline: 'none', width: '100%' }} />
          </div>
        </motion.div>}</AnimatePresence>
      </div>

      {/* Rating */}
      <div style={section}>
        <button onClick={() => setRatingOpen(!ratingOpen)} style={btn(ratingOpen)}>{t('filters.rating')} <ChevronDown size={14} style={chevron(ratingOpen)} /></button>
        <AnimatePresence>{ratingOpen && <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[4, 3, 2, 1].map(r => (
              <button key={r} onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === r ? 0 : r }))}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, border: 'none', background: filters.minRating === r ? 'rgba(255,120,80,0.08)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', gap: 1 }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={11} style={{ color: s <= r ? '#d4a820' : colors.inputBorder, fill: s <= r ? '#d4a820' : 'none' }} />)}</div>
                <span style={{ fontSize: 11, color: colors.textMuted }}>{t('filters.and_up')}</span>
              </button>
            ))}
          </div>
        </motion.div>}</AnimatePresence>
      </div>

      {/* Availability */}
      <div style={section}>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('filters.availability')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[{ label: t('filters.in_stock'), val: true }, { label: t('filters.out_of_stock'), val: false }].map(({ label, val }) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                <div onClick={() => setFilters(f => ({ ...f, inStock: f.inStock === val ? null : val }))} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${filters.inStock === val ? colors.accent : colors.inputBorder}`, background: filters.inStock === val ? 'rgba(255,120,80,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: 'pointer' }}>
                  {filters.inStock === val && <div style={{ width: 8, height: 8, borderRadius: 2, background: colors.accent }} />}
                </div>
                <span style={{ fontSize: 12, color: colors.textSecondary }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sort */}
      <div style={section}>
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{t('filters.sort_by')}</div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.text, fontSize: 11, outline: 'none', cursor: 'pointer' }}>
            <option value="newest">{t('filters.newest')}</option>
            <option value="price-asc">{t('filters.price_low_high')}</option>
            <option value="price-desc">{t('filters.price_high_low')}</option>
            <option value="rating">{t('filters.top_rated')}</option>
            <option value="popular">{t('filters.most_popular')}</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { isDark, colors } = useTheme()
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const { t: te } = useTranslation('errors')
  const { t: tch } = useTranslation('chat')

  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [filters, setFilters] = useState({ categories: [], minPrice: '', maxPrice: '', minRating: 0, inStock: null })
  const [sortBy, setSortBy] = useState('newest')
  const [filterOpen, setFilterOpen] = useState(false)

  const [chatOpen, setChatOpen] = useState(false)
  const chatWelcome = useMemo(() => ({ role: 'assistant', content: tch('welcome') }), [tch])
  const [chatMsgs, setChatMsgs] = useState([chatWelcome])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    productsApi.getAll().then(r => setItems(r.data)).catch(() => {})
    categoriesApi.getAll().then(r => setCats(r.data)).catch(() => {})
  }, [])

  const loadSearch = useCallback((q) => {
    if (!q.trim()) {
      productsApi.getAll().then(r => setItems(r.data)).catch(() => {})
      return
    }
    productsApi.search(q).then(r => setItems(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadSearch(query), 400)
    return () => clearTimeout(debounceRef.current)
  }, [query, loadSearch])

  const filtered = useMemo(() => {
    let result = [...items]
    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category_id))
    }
    if (filters.minPrice !== '') {
      result = result.filter(p => Number(p.price) >= Number(filters.minPrice))
    }
    if (filters.maxPrice !== '') {
      result = result.filter(p => Number(p.price) <= Number(filters.maxPrice))
    }
    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 4) >= filters.minRating)
    }
    if (filters.inStock === true) {
      result = result.filter(p => p.stock > 0)
    } else if (filters.inStock === false) {
      result = result.filter(p => p.stock === 0)
    }
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break
      case 'price-desc': result.sort((a, b) => b.price - a.price); break
      case 'rating': result.sort((a, b) => (b.rating || 4) - (a.rating || 4)); break
      case 'popular': result.sort((a, b) => (b.stock || 0) - (a.stock || 0)); break
      case 'newest': default: result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break
    }
    return result
  }, [items, filters, sortBy])

  const catMap = useMemo(() => {
    const m = {}
    cats.forEach(c => { m[c.id] = c.name })
    return m
  }, [cats])

  const favSet = useMemo(() => new Set(), [])

  const toggleFav = async (id) => {
    try {
      if (favSet.has(id)) {
        await favoritesApi.remove(id)
        favSet.delete(id)
        toast.success(t('actions.removed_from_favorites'))
      } else {
        await favoritesApi.add(id)
        favSet.add(id)
        toast.success(t('actions.added_to_favorites'))
      }
    } catch { toast.error(t('actions.action_failed')) }
  }

  const addToCart = async (id) => {
    try {
      await cartApi.add({ product_id: id, quantity: 1 })
      toast.success(t('actions.added_to_cart'))
    } catch { toast.error(t('actions.add_to_cart_failed')) }
  }

  const openCreate = () => { setForm({ ...empty }); setModal(true) }
  const openEdit = (p) => { setForm({ _id: p.id, name: p.name, description: p.description || '', price: String(p.price), color: p.color || '', size: p.size || '', stock: p.stock || 0, image_url: p.image_url || '', category_id: p.category_id || '' }); setModal(true) }

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error(t('admin.name_price_required')); return }
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), category_id: form.category_id ? Number(form.category_id) : null }
      if (form._id) {
        await productsApi.update(form._id, payload)
        toast.success(t('admin.product_updated'))
      } else {
        await productsApi.create(payload)
        toast.success(t('admin.product_created'))
      }
      setModal(false)
      const r = await productsApi.getAll()
      setItems(r.data)
    } catch { toast.error(t('admin.save_failed')) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('admin.confirm_delete'))) return
    try {
      await productsApi.delete(id)
      toast.success(t('admin.product_deleted'))
      setItems(items.filter(i => i.id !== id))
    } catch { toast.error(t('admin.delete_failed')) }
  }

  const sendChat = async (text) => {
    if (!text.trim() || chatLoading) return
    const userMsg = { role: 'user', content: text.trim() }
    const updated = [...chatMsgs, userMsg]
    setChatMsgs(updated)
    setChatInput('')
    setChatLoading(true)
    try {
      const { data } = await chatApi.send(updated.map(m => ({ role: m.role, content: m.content })))
      const assistantMsg = { role: 'assistant', content: data.reply || tch('received'), tool_called: data.tool_called, all_tool_calls: data.all_tool_calls }
      setChatMsgs(prev => [...prev, assistantMsg])
    } catch {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: tch('error') }])
    } finally { setChatLoading(false) }
  }

  const clearChat = () => { setChatMsgs([chatWelcome]) }

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chatMsgs])

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12, outline: 'none', transition: 'border-color 0.3s' }

  const clearFilters = () => setFilters({ categories: [], minPrice: '', maxPrice: '', minRating: 0, inStock: null })

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      {/* Sticky Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: isDark ? 'rgba(9,11,22,0.85)' : 'rgba(248,247,244,0.85)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${colors.glassBorder}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={18} style={{ color: colors.accent }} /> {t('products_page.title')}
        </h1>
        <div style={{ position: 'relative', width: 220, maxWidth: '30vw' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('products_page.search_placeholder')}
            style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: 8, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.text, fontSize: 12, outline: 'none' }} />
        </div>
        <button onClick={() => setFilterOpen(f => !f)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${filterOpen ? 'rgba(255,120,80,0.2)' : colors.glassBorder}`, background: filterOpen ? 'rgba(255,120,80,0.06)' : colors.inputBg, color: filterOpen ? colors.accent : colors.textSecondary, cursor: 'pointer', fontSize: 11, fontWeight: 500, transition: 'all 0.2s' }}>
          <SlidersHorizontal size={13} /> {t('products_page.filters')}
        </button>
        {isAdmin && (
          <button onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, boxShadow: '0 4px 15px rgba(255,120,80,0.25)' }}>
            <Plus size={13} /> {t('products_page.add_product')}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', padding: '20px 24px', gap: 20, maxWidth: 1400, margin: '0 auto' }}>
        {/* Sidebar Filters */}
        <AnimatePresence>
          {filterOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3, ease }}
              style={{ flexShrink: 0, overflow: 'hidden' }}>
              <div style={{ width: 240, position: 'sticky', top: 80 }}>
                <FilterPanel cats={cats} filters={filters} setFilters={setFilters} sortBy={sortBy} setSortBy={setSortBy} onClear={clearFilters} productCount={filtered.length} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: colors.textMuted }}>{t('products_page.product_count', { count: filtered.length })}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ArrowUpDown size={12} style={{ color: colors.textMuted }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.textSecondary, fontSize: 10, outline: 'none', cursor: 'pointer' }}>
                <option value="newest">{t('sort.newest')}</option>
                <option value="price-asc">{t('sort.price_asc')}</option>
                <option value="price-desc">{t('sort.price_desc')}</option>
                <option value="rating">{t('sort.top_rated')}</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Package size={40} style={{ color: colors.textMuted, marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: colors.textMuted }}>{t('products_page.no_products')}</p>
            </motion.div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {filtered.map((p, i) => (
                <div key={p.id} style={{ position: 'relative' }}>
                  <ProductCard p={p} isAdmin={isAdmin} isFav={favSet.has(p.id)} onFav={toggleFav} onCart={addToCart} catName={catMap[p.category_id]} delay={Math.min(i * 0.05, 0.5)} />
                  {isAdmin && (
                    <div style={{ position: 'absolute', bottom: 56, right: 16, display: 'flex', gap: 6, zIndex: 5 }}>
                      <button onClick={(e) => { e.preventDefault(); openEdit({ ...p }) }}
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,120,80,0.15)', background: 'rgba(255,120,80,0.08)', color: colors.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={11} />
                      </button>
                      <button onClick={(e) => { e.preventDefault(); handleDelete(p.id) }}
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(224,96,96,0.15)', background: 'rgba(224,96,96,0.08)', color: '#e06060', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Create/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={form._id ? tc('admin_modal.edit_product') : tc('admin_modal.new_product')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('name')}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={tc('admin_modal.product_name')} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('description')}</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={tc('description')} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('price')}</label>
              <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('stock')}</label>
              <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('color')}</label>
              <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder={tc('color')} style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('size')}</label>
              <input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder={tc('size')} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('category')}</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={inputStyle}>
              <option value="">{tc('none')}</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 6 }}>{tc('image_url')}</label>
            <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." style={inputStyle} />
          </div>
          {form.image_url && (
            <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${colors.glassBorder}`, height: 140, background: colors.inputBg }}>
              <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
            </div>
          )}
          <button onClick={handleSave}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,120,80,0.25)' }}>
            {form._id ? tc('admin_modal.update_product') : tc('admin_modal.create_product')}
          </button>
        </div>
      </Modal>

      {/* AI Chat Floating Widget */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.3, ease }}
            style={{ position: 'fixed', bottom: 24, right: 24, width: 540, maxHeight: 860, zIndex: 100, borderRadius: 16, border: `1px solid ${colors.glassBorder}`, background: isDark ? 'rgba(13,19,37,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: `0 20px 60px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'}` }}>
            {/* Chat Header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #ff7850, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>AI Assistant</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={clearChat} title={tch('clearChat')}
                  style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 4 }}>
                  <X size={14} />
                </button>
                <button onClick={() => setChatOpen(false)}
                  style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: 4 }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 690 }}>
              {chatMsgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '82%', padding: '8px 12px', borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px', background: m.role === 'user' ? 'rgba(255,120,80,0.12)' : colors.glass, border: `1px solid ${m.role === 'user' ? 'rgba(255,120,80,0.15)' : colors.glassBorder}` }}>
                    <div style={{ fontSize: 11, lineHeight: 1.5, color: m.role === 'user' ? (isDark ? '#ffccaa' : '#cc5522') : colors.textSecondary, whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    {m.tool_called && (
                      <div style={{ marginTop: 6, padding: '5px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Wrench size={11} style={{ color: '#8b5cf6' }} />
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#8b5cf6', letterSpacing: '0.03em' }}>{m.tool_called.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {m.all_tool_calls && m.all_tool_calls.length > 1 && (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {m.all_tool_calls.map((tc, j) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', borderRadius: 4, background: colors.inputBg }}>
                            <Wrench size={9} style={{ color: colors.textMuted }} />
                            <span style={{ fontSize: 9, color: colors.textMuted }}>{tc.tool}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: '50%', background: colors.textMuted }} />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} style={{ width: 5, height: 5, borderRadius: '50%', background: colors.textMuted }} />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} style={{ width: 5, height: 5, borderRadius: '50%', background: colors.textMuted }} />
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${colors.glassBorder}`, display: 'flex', gap: 8 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat(chatInput)} placeholder={tch('placeholder')}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${colors.glassBorder}`, background: colors.inputBg, color: colors.text, fontSize: 11, outline: 'none' }} />
              <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim() || chatLoading}
                style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: chatInput.trim() ? 'linear-gradient(135deg, #ff7850, #ff6b6b)' : colors.glass, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {chatLoading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Toggle Button */}
      {!chatOpen && (
        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(true)}
          style={{ position: 'fixed', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 14, border: '1px solid rgba(255,120,80,0.2)', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(255,120,80,0.3)', zIndex: 100 }}>
          <Bot size={22} />
        </motion.button>
      )}
    </div>
  )
}
