import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { products as productsApi, cart as cartApi, reviews as reviewsApi, favorites as favoritesApi, chat as chatApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, ShoppingCart, Package, Minus, Plus, Check, Star, Trash2, Send,
  Heart, Share2, ChevronDown, Truck, Shield, RotateCcw, Bot, X, Copy,
  Box, Zap, MessageCircle, Info, Tag
} from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
const scaleIn = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const { isDark, colors } = useTheme()
  const { t } = useTranslation('products')
  const { t: tc } = useTranslation('common')
  const { t: te } = useTranslation('errors')
  const { t: tch } = useTranslation('chat')

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState({ average: 0, count: 0 })
  const [myRating, setMyRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [selectedImage, setSelectedImage] = useState(0)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [zooming, setZooming] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [aiMessages, setAiMessages] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [shareTooltip, setShareTooltip] = useState(false)
  const mainImageRef = useRef(null)
  const aiChatEndRef = useRef(null)
  const aiInputRef = useRef(null)

  const images = product?.image_url ? [product.image_url] : []

  useEffect(() => {
    setLoading(true)
    productsApi.getOne(id)
      .then(r => { setProduct(r.data); setSelectedImage(0); setQty(1) })
      .catch(() => toast.error(t('detail.product_not_found')))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    reviewsApi.getByProduct(id).then(r => setReviews(r.data)).catch(() => {})
    reviewsApi.getRating(id).then(r => setRating(r.data)).catch(() => {})
    favoritesApi.check(id).then(r => setIsFavorite(r.data.is_favorite)).catch(() => {})
  }, [id])

  useEffect(() => {
    if (!product) return
    const fetchRelated = async () => {
      try {
        if (product.category_id) {
          const res = await productsApi.getByCategory(product.category_id)
          setRelatedProducts(res.data.filter(p => p.id !== product.id).slice(0, 8))
        } else {
          const res = await productsApi.getAll()
          setRelatedProducts(res.data.filter(p => p.id !== product.id).slice(0, 8))
        }
      } catch { setRelatedProducts([]) }
    }
    fetchRelated()
  }, [product])

  useEffect(() => {
    if (aiChatEndRef.current) aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  useEffect(() => {
    if (aiOpen && aiInputRef.current) aiInputRef.current.focus()
  }, [aiOpen])

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await cartApi.add({ product_id: product.id, quantity: qty })
      setAdded(true)
      toast.success(t('detail.added_to_cart'))
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      toast.error(err?.response?.data?.detail || te('add_to_cart_failed'))
    } finally { setAdding(false) }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!myRating && !comment.trim()) {
      toast.error(t('detail.please_provide_rating'))
      return
    }
    setSubmitting(true)
    try {
      await reviewsApi.create(id, { rating: myRating || null, comment: comment.trim() || null })
      toast.success(t('detail.review_submitted'))
      setMyRating(0)
      setComment('')
      const [revRes, ratRes] = await Promise.all([
        reviewsApi.getByProduct(id),
        reviewsApi.getRating(id),
      ])
      setReviews(revRes.data)
      setRating(ratRes.data)
    } catch (err) {
      toast.error(err?.response?.data?.detail || te('review_failed'))
    } finally { setSubmitting(false) }
  }

  const handleDeleteReview = async (reviewId) => {
    setDeletingId(reviewId)
    try {
      await reviewsApi.delete(reviewId)
      toast.success(t('detail.review_deleted'))
      const [revRes, ratRes] = await Promise.all([
        reviewsApi.getByProduct(id),
        reviewsApi.getRating(id),
      ])
      setReviews(revRes.data)
      setRating(ratRes.data)
    } catch (err) {
      toast.error(err?.response?.data?.detail || te('review_failed'))
    } finally { setDeletingId(null) }
  }

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesApi.remove(id)
        setIsFavorite(false)
        toast.success(t('actions.removed_from_favorites'))
      } else {
        await favoritesApi.add(parseInt(id))
        setIsFavorite(true)
        toast.success(t('actions.added_to_favorites'))
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || te('unknown'))
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShareTooltip(true)
      toast.success(t('actions.link_copied'))
      setTimeout(() => setShareTooltip(false), 2000)
    } catch {
      toast.error(t('actions.copy_failed'))
    }
  }

  const handleSendAI = async () => {
    if (!aiInput.trim() || aiLoading) return
    const userMsg = aiInput.trim()
    setAiInput('')
    const contextMsg = {
      role: 'user',
      content: `About the product "${product.name}" (price: $${product.price}, description: ${product.description || 'N/A'}, color: ${product.color || 'N/A'}, size: ${product.size || 'N/A'}, stock: ${product.stock}): ${userMsg}`
    }
    const updatedMessages = [...aiMessages.map(m => ({ role: m.role, content: m.content })), contextMsg]
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg, id: Date.now() }])
    setAiLoading(true)
    try {
      const res = await chatApi.send(updatedMessages)
      const reply = res.data?.response || res.data?.message || 'I could not process that question.'
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply, id: Date.now() + 1 }])
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', id: Date.now() + 1 }])
    } finally { setAiLoading(false) }
  }

  const handleImageMouseMove = useCallback((e) => {
    if (!mainImageRef.current) return
    const rect = mainImageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  const glassCard = {
    background: colors.glass,
    border: `1px solid ${colors.glassBorder}`,
    backdropFilter: 'blur(12px)',
    borderRadius: '16px',
  }

  const glassCardHover = {
    ...glassCard,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: colors.bg }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <div style={{ width: 48, height: 48, border: `3px solid ${colors.glassBorder}`, borderTopColor: colors.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span className="text-sm" style={{ color: colors.textMuted }}>{t('detail.loading_product')}</span>
        </motion.div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: colors.bg }}>
        <motion.div {...fadeUp} initial="hidden" animate="visible" className="text-center">
          <Package size={64} style={{ color: colors.textMuted, margin: '0 auto 16px' }} />
          <p style={{ color: colors.textSecondary, fontSize: 16 }}>{t('detail.product_not_found')}</p>
          <Link to="/products" style={{ color: colors.accent, fontSize: 14, textDecoration: 'none', marginTop: 12, display: 'inline-block' }}>{t('detail.back_to_products')}</Link>
        </motion.div>
      </div>
    )
  }

  const tabs = [
    { id: 'description', label: t('detail.description'), icon: Info },
    { id: 'specs', label: t('detail.specifications'), icon: Box },
    { id: 'reviews', label: t('detail.reviews_count', { count: reviews.length }), icon: MessageCircle },
    { id: 'shipping', label: t('detail.shipping'), icon: Truck },
  ]

  const specs = [
    { label: t('detail.specs_product'), value: product.name },
    product.color && { label: tc('color'), value: product.color },
    product.size && { label: tc('size'), value: product.size },
    { label: t('detail.specs_price'), value: `$${Number(product.price).toFixed(2)}` },
    { label: tc('stock'), value: product.stock > 0 ? t('detail.specs_stock_available', { count: product.stock }) : t('detail.specs_stock_out') },
    product.category_name && { label: t('detail.specs_category'), value: product.category_name },
  ].filter(Boolean)

  return (
    <div style={{ background: colors.bg, minHeight: '100vh' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes pulse { 0%,100% { opacity: 0.3 } 50% { opacity: 1 } }
        .product-detail-container { max-width: 1280px; margin: 0 auto; padding: 24px 32px 80px; }
        .main-image-wrapper { position: relative; width: 100%; aspect-ratio: 1/1; border-radius: 16px; overflow: hidden; cursor: crosshair; }
        .main-image-wrapper img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.1s ease-out; transform-origin: center center; }
        .main-image-wrapper:hover img { transform: scale(1.8); }
        .thumb-strip { display: flex; gap: 8px; margin-top: 12px; }
        .thumb-item { width: 72px; height: 72px; border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: all 0.2s ease; opacity: 0.5; }
        .thumb-item.active { border-color: ${colors.accent}; opacity: 1; }
        .thumb-item:hover { opacity: 1; }
        .thumb-item img { width: 100%; height: 100%; object-fit: cover; }
        .tab-btn { padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .tab-btn.active { background: rgba(255,120,80,0.15); color: ${colors.accent}; }
        .tab-btn:not(.active) { background: transparent; color: ${colors.textMuted}; }
        .tab-btn:not(.active):hover { background: ${colors.glass}; color: ${colors.textSecondary}; }
        .qty-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid ${colors.glassBorder}; background: ${colors.inputBg}; color: ${colors.textSecondary}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
        .qty-btn:hover { background: ${colors.glassHover}; border-color: ${colors.borderHover}; }
        .spec-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid ${colors.glassBorder}; }
        .spec-row:last-child { border-bottom: none; }
        .related-scroll { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .related-scroll::-webkit-scrollbar { height: 4px; }
        .related-scroll::-webkit-scrollbar-track { background: ${colors.inputBg}; border-radius: 2px; }
        .related-scroll::-webkit-scrollbar-thumb { background: ${colors.textMuted}; border-radius: 2px; }
        .related-card { min-width: 220px; max-width: 220px; scroll-snap-align: start; }
        .review-item { padding: 20px; border-radius: 14px; border: 1px solid ${colors.glassBorder}; background: ${colors.glass}; transition: all 0.2s ease; }
        .review-item:hover { background: ${colors.glassHover}; }
        .ai-chat-msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; }
        .ai-chat-msg.user { background: rgba(255,120,80,0.2); color: ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'}; margin-left: auto; border-bottom-right-radius: 4px; }
        .ai-chat-msg.assistant { background: ${colors.glass}; color: ${colors.textSecondary}; border-bottom-left-radius: 4px; }
        @media (max-width: 768px) {
          .product-detail-container { padding: 16px 16px 60px; }
          .sticky-purchase { position: fixed !important; bottom: 0; left: 0; right: 0; z-index: 50; border-radius: 16px 16px 0 0 !important; padding: 16px 20px !important; }
        }
      `}</style>

      <div className="product-detail-container">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: colors.textSecondary, textDecoration: 'none', marginBottom: 24, transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = colors.accent}
            onMouseLeave={e => e.currentTarget.style.color = colors.textSecondary}
          >
            <ArrowLeft size={15} /> {t('detail.back_to_products')}
          </Link>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 48, alignItems: 'start' }}
          className="product-grid"
        >
          <style>{`
            @media (max-width: 768px) {
              .product-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
            }
          `}</style>

          {/* LEFT: Image Gallery */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="main-image-wrapper" ref={mainImageRef}
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => setZooming(false)}
              onMouseMove={handleImageMouseMove}
              style={{ ...glassCard, borderRadius: 16 }}
            >
              {images.length > 0 ? (
                <img src={images[selectedImage]} alt={product.name}
                  style={zooming ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`, transform: 'scale(1.8)' } : {}}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package size={80} style={{ color: colors.textMuted }} />
                </div>
              )}
              {zooming && images.length > 0 && (
                <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 8, background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)', fontSize: 11, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', pointerEvents: 'none' }}>
                  {t('detail.zoom', { x: Math.round(zoomPos.x), y: Math.round(zoomPos.y) })}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <motion.div className="thumb-strip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {images.map((img, i) => (
                  <motion.div key={i} className={`thumb-item ${i === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{ ...glassCard }}
                  >
                    <img src={img} alt="" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT: Product Info + Purchase Panel */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            style={{ position: 'sticky', top: 24 }}
          >
            {/* Product Name */}
            <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.15, color: colors.text, marginBottom: 8, fontFamily: 'inherit' }}>
              {product.name}
            </h1>

            {/* Rating */}
            {rating.count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} style={{ color: s <= Math.round(rating.average) ? '#f5a623' : colors.inputBorder, fill: s <= Math.round(rating.average) ? '#f5a623' : 'transparent' }} />
                  ))}
                </div>
                <span style={{ fontSize: 13, color: colors.textSecondary }}>{rating.average} ({rating.count} {rating.count === 1 ? t('detail.review_singular') : t('detail.review_plural')})</span>
              </div>
            )}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 40, fontWeight: 800, background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ${Number(product.price).toFixed(2)}
              </span>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {product.color && (
                <motion.span whileHover={{ scale: 1.05 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textSecondary, background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                  <Tag size={12} /> {product.color}
                </motion.span>
              )}
              {product.size && (
                <motion.span whileHover={{ scale: 1.05 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: colors.textSecondary, background: colors.glass, border: `1px solid ${colors.glassBorder}` }}>
                  <Box size={12} /> {t('detail.size_label')} {product.size}
                </motion.span>
              )}
              <motion.span whileHover={{ scale: 1.05 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, color: product.stock > 0 ? '#4ade80' : '#ff6b6b', background: product.stock > 0 ? 'rgba(74,222,128,0.1)' : 'rgba(255,107,107,0.1)', border: `1px solid ${product.stock > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(255,107,107,0.2)'}` }}>
                {product.stock > 0 ? <><Zap size={12} /> {t('detail.in_stock')}</> : <><X size={12} /> {t('detail.out_of_stock')}</>}
              </motion.span>
            </div>

            {/* Description snippet */}
            <p style={{ fontSize: 15, lineHeight: 1.7, color: colors.textSecondary, marginBottom: 24 }}>
              {product.description || t('detail.no_description')}
            </p>

            {/* Purchase Panel */}
            {!isAdmin ? (
              <div className="sticky-purchase" style={{ ...glassCard, padding: 24, marginBottom: 24 }}>
                {/* Quantity */}
                {product.stock > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 13, color: colors.textSecondary, minWidth: 64 }}>{t('detail.quantity')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>
                        <Minus size={16} />
                      </button>
                      <span style={{ width: 48, textAlign: 'center', fontSize: 16, fontWeight: 600, color: colors.text }}>{qty}</span>
                      <button className="qty-btn" onClick={() => setQty(q => Math.min(product.stock, q + 1))}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Add to Cart Button */}
                {product.stock > 0 && (
                  <motion.button whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(255,120,80,0.3)' }} whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart} disabled={adding}
                    style={{
                      width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none', cursor: adding ? 'wait' : 'pointer',
                      background: added ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #ff7850, #ff6b6b)',
                      color: '#fff', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: adding ? 0.7 : 1, transition: 'all 0.3s ease', letterSpacing: 0.3,
                    }}
                  >
                    {added ? <><Check size={18} /> {t('detail.added_to_cart')}</> : <><ShoppingCart size={18} /> {t('detail.add_to_cart')}</>}
                  </motion.button>
                )}

                {product.stock <= 0 && (
                  <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', textAlign: 'center', color: '#ff6b6b', fontSize: 14, fontWeight: 500 }}>
                    {t('detail.currently_out_of_stock')}
                  </div>
                )}

                {/* Wishlist + Share */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={toggleFavorite}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 10, border: `1px solid ${isFavorite ? 'rgba(255,107,107,0.3)' : colors.glassBorder}`,
                      background: isFavorite ? 'rgba(255,107,107,0.1)' : colors.inputBg,
                      color: isFavorite ? '#ff6b6b' : colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease',
                    }}
                  >
                    <Heart size={16} style={{ fill: isFavorite ? '#ff6b6b' : 'transparent' }} />
                    {isFavorite ? t('detail.wishlisted') : t('detail.wishlist')}
                  </motion.button>

                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleShare}
                    style={{
                      position: 'relative', padding: '12px 18px', borderRadius: 10,
                      border: `1px solid ${colors.glassBorder}`, background: colors.inputBg,
                      color: colors.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 13, fontWeight: 500, transition: 'all 0.2s ease',
                    }}
                  >
                    <Share2 size={16} /> {t('detail.share')}
                    <AnimatePresence>
                      {shareTooltip && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                          style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', padding: '4px 10px', borderRadius: 6, background: colors.surface, fontSize: 11, color: '#4ade80', whiteSpace: 'nowrap', border: '1px solid rgba(74,222,128,0.2)' }}
                        >
                          {tc('copied')}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div style={{ ...glassCard, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,120,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} style={{ color: colors.accent }} />
                </div>
                <p style={{ fontSize: 13, color: colors.textSecondary }}>
                  {t('detail.admin_view')} <Link to="/products" style={{ color: colors.accent, textDecoration: 'none' }}>{t('detail.admin_view_link')}</Link>
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* TABBED CONTENT */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginTop: 56 }}
        >
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
            {tabs.map(tab => (
              <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div key="description" variants={fadeUp} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.25 }}
                style={{ ...glassCard, padding: 32 }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={18} style={{ color: colors.accent }} /> {t('detail.about_product')}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: colors.textSecondary }}>
                  {product.description || t('detail.no_description')}
                </p>
                {product.category_name && (
                  <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 10, background: colors.inputBg, border: `1px solid ${colors.glassBorder}`, display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: colors.textSecondary }}>
                    <Tag size={14} style={{ color: colors.accent }} /> {t('detail.category_label')} <span style={{ color: colors.text }}>{product.category_name}</span>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'specs' && (
              <motion.div key="specs" variants={fadeUp} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.25 }}
                style={{ ...glassCard, padding: 32 }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Box size={18} style={{ color: colors.accent }} /> {t('detail.specifications')}
                </h3>
                <div>
                  {specs.map((spec, i) => (
                    <div key={i} className="spec-row">
                      <span style={{ fontSize: 14, color: colors.textSecondary }}>{spec.label}</span>
                      <span style={{ fontSize: 14, color: colors.text, fontWeight: 500 }}>{spec.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="reviews" variants={fadeUp} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* Rating Summary */}
                {rating.count > 0 && (
                  <div style={{ ...glassCard, padding: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 48, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{rating.average}</div>
                      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 8 }}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={16} style={{ color: s <= Math.round(rating.average) ? '#f5a623' : colors.inputBorder, fill: s <= Math.round(rating.average) ? '#f5a623' : 'transparent' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>{rating.count} {rating.count === 1 ? t('detail.review_singular') : t('detail.review_plural')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      {[5,4,3,2,1].map(star => {
                        const count = reviews.filter(r => r.rating === star).length
                        const pct = rating.count > 0 ? (count / rating.count) * 100 : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: colors.textMuted, width: 12, textAlign: 'right' }}>{star}</span>
                            <Star size={12} style={{ color: '#f5a623', fill: '#f5a623' }} />
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: colors.glass, overflow: 'hidden' }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: (5 - star) * 0.1 }}
                                style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #ff7850, #ff6b6b)' }}
                              />
                            </div>
                            <span style={{ fontSize: 11, color: colors.textMuted, width: 20 }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Review Form */}
                {!isAdmin && (
                  <form onSubmit={handleSubmitReview} style={{ ...glassCard, padding: 24 }}>
                    <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 14, fontWeight: 500 }}>{t('detail.write_review')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                      {[1,2,3,4,5].map(s => (
                        <motion.button key={s} type="button" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setMyRating(s)}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                        >
                          <Star size={24} style={{ color: (hoverRating || myRating) >= s ? '#f5a623' : colors.inputBorder, fill: (hoverRating || myRating) >= s ? '#f5a623' : 'transparent', transition: 'all 0.15s ease' }} />
                        </motion.button>
                      ))}
                      {myRating > 0 && <span style={{ fontSize: 13, color: colors.textMuted, marginLeft: 8 }}>{myRating}/5</span>}
                    </div>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder={t('detail.review_placeholder')}
                      rows={3}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: 12,
                        border: `1px solid ${colors.glassBorder}`, background: colors.inputBg,
                        color: colors.text, fontSize: 14, resize: 'none',
                        outline: 'none', lineHeight: 1.6, transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(255,120,80,0.4)'}
                      onBlur={e => e.target.style.borderColor = colors.glassBorder}
                    />
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={submitting || (!myRating && !comment.trim())}
                      style={{
                        marginTop: 12, padding: '10px 20px', borderRadius: 10,
                        border: 'none', cursor: submitting ? 'wait' : 'pointer',
                        background: 'linear-gradient(135deg, #ff7850, #ff6b6b)',
                        color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                        opacity: (!myRating && !comment.trim()) || submitting ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Send size={14} />
                      {submitting ? t('detail.sending') : t('detail.submit_review')}
                    </motion.button>
                  </form>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <div style={{ ...glassCard, padding: 48, textAlign: 'center' }}>
                    <MessageCircle size={40} style={{ color: colors.textMuted, margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: colors.textMuted }}>{t('detail.no_reviews')}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reviews.map((r, idx) => (
                      <motion.div key={r.id} className="review-item"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, rgba(255,120,80,0.2), rgba(255,107,107,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: colors.accent }}>
                              {(r.username || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>{r.username}</span>
                              {r.rating && (
                                <div style={{ display: 'flex', gap: 1, marginTop: 2 }}>
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={12} style={{ color: s <= r.rating ? '#f5a623' : colors.inputBorder, fill: s <= r.rating ? '#f5a623' : 'transparent' }} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 12, color: colors.textMuted }}>{new Date(r.created_at).toLocaleDateString()}</span>
                            {r.user_id === user?.id && (
                              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteReview(r.id)}
                                disabled={deletingId === r.id}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,107,107,0.4)', transition: 'color 0.2s', display: 'flex' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,107,107,0.4)'}
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            )}
                          </div>
                        </div>
                        {r.comment && <p style={{ fontSize: 14, lineHeight: 1.7, color: colors.textSecondary, margin: 0 }}>{r.comment}</p>}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div key="shipping" variants={fadeUp} initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.25 }}
                style={{ ...glassCard, padding: 32 }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Truck size={18} style={{ color: colors.accent }} /> {t('detail.shipping_title')}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { icon: Truck, title: t('detail.standard_delivery'), desc: t('detail.standard_delivery_desc'), color: '#ff7850' },
                    { icon: Zap, title: t('detail.express_delivery'), desc: t('detail.express_delivery_desc'), color: '#ff6b6b' },
                    { icon: RotateCcw, title: t('detail.easy_returns'), desc: t('detail.easy_returns_desc'), color: '#4ade80' },
                    { icon: Shield, title: t('detail.secure_packaging'), desc: t('detail.secure_packaging_desc'), color: '#a78bfa' },
                  ].map((item, i) => (
                    <motion.div key={i} whileHover={{ y: -2, background: colors.glassHover }}
                      style={{ padding: 20, borderRadius: 14, background: colors.glass, border: `1px solid ${colors.glassBorder}`, transition: 'all 0.2s ease' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                        <item.icon size={20} style={{ color: item.color }} />
                      </div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 6, marginTop: 0 }}>{item.title}</h4>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: colors.textSecondary, margin: 0 }}>{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
                <div style={{ marginTop: 24, padding: '14px 18px', borderRadius: 10, background: 'rgba(255,120,80,0.06)', border: '1px solid rgba(255,120,80,0.12)', fontSize: 13, color: colors.textSecondary, lineHeight: 1.6 }}>
                  {t('detail.shipping_note')}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
            style={{ marginTop: 56 }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, color: colors.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={20} style={{ color: colors.accent }} /> {t('detail.you_may_also_like')}
            </h3>
            <div className="related-scroll">
              {relatedProducts.map((rp, i) => (
                <motion.div key={rp.id} className="related-card"
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                >
                  <Link to={`/products/${rp.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ ...glassCardHover, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: 160, overflow: 'hidden', background: colors.inputBg }}>
                        {rp.image_url ? (
                          <img src={rp.image_url} alt={rp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                            onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={32} style={{ color: colors.textMuted }} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: colors.text, margin: 0, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rp.name}</h4>
                        <span style={{ fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                          ${Number(rp.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* AI ASSISTANT FAB */}
      <AnimatePresence>
        {!aiOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08, boxShadow: '0 8px 32px rgba(255,120,80,0.35)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAiOpen(true)}
            style={{
              position: 'fixed', bottom: 28, right: 28, width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 24px rgba(255,120,80,0.3)', zIndex: 100, color: '#fff',
            }}
          >
            <Bot size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* AI ASSISTANT CHAT PANEL */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 28, right: 28, width: 540, maxHeight: 740,
              borderRadius: 20, background: isDark ? 'rgba(15,17,30,0.95)' : 'rgba(255,255,255,0.95)', border: `1px solid ${colors.glassBorder}`,
              backdropFilter: 'blur(20px)', zIndex: 100, display: 'flex', flexDirection: 'column',
              boxShadow: isDark ? '0 16px 64px rgba(0,0,0,0.5)' : '0 16px 64px rgba(0,0,0,0.12)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, rgba(255,120,80,0.2), rgba(255,107,107,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={18} style={{ color: colors.accent }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>AI Assistant</div>
                  <div style={{ fontSize: 11, color: colors.textMuted }}>Ask about this product</div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setAiOpen(false)}
                style={{ background: colors.inputBg, border: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textSecondary }}
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200, maxHeight: 570 }}>
              {aiMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <Bot size={36} style={{ color: colors.textMuted, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
                    Ask me anything about this product — features, compatibility, recommendations...
                  </p>
                </div>
              )}
              {aiMessages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`ai-chat-msg ${msg.role}`}
                  style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {msg.content}
                </motion.div>
              ))}
              {aiLoading && (
                <div className="ai-chat-msg assistant" style={{ alignSelf: 'flex-start', display: 'flex', gap: 4, padding: '12px 16px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.textMuted, animation: 'pulse 1s ease-in-out infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.textMuted, animation: 'pulse 1s ease-in-out 0.2s infinite' }} />
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors.textMuted, animation: 'pulse 1s ease-in-out 0.4s infinite' }} />
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${colors.glassBorder}` }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <input
                  ref={aiInputRef}
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAI() } }}
                  placeholder="Ask a question..."
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    border: `1px solid ${colors.glassBorder}`, background: colors.inputBg,
                    color: colors.text, fontSize: 13, outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,120,80,0.4)'}
                  onBlur={e => e.target.style.borderColor = colors.glassBorder}
                />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSendAI} disabled={aiLoading || !aiInput.trim()}
                  style={{
                    width: 38, height: 38, borderRadius: 10, border: 'none',
                    background: aiInput.trim() ? 'linear-gradient(135deg, #ff7850, #ff6b6b)' : colors.inputBg,
                    cursor: aiInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: aiInput.trim() ? '#fff' : colors.textMuted, transition: 'all 0.2s ease', flexShrink: 0,
                  }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
