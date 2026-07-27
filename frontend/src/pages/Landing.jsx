import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Bot, Shield, Truck, Sparkles, ArrowRight, Search,
  ShoppingCart, Star, Zap, ChevronRight,
} from 'lucide-react'
import { useMemo, useState } from 'react'

const featuredProduct = {
  name: 'AURA-1 Bomber',
  category: 'AI Recommended',
  price: '$249',
  desc: 'Precision-engineered premium outerwear, curated by our neural style engine.',
  image: '/images/products/bomber-jacket.jpg',
}

const heroCards = [
  { id: 1, name: 'Phantom Runner',  price: '$189', cat: 'Sneakers',   image: '/images/products/sneakers.jpg' },
  { id: 2, name: 'CHRONO-X',        price: '$349', cat: 'Watches',    image: '/images/products/watch.jpg' },
  { id: 3, name: 'AI Snapback Tee', price: '$79',  cat: 'T-Shirts',   image: '/images/products/tshirt.jpg' },
  { id: 4, name: 'Ember Cap',       price: '$59',  cat: 'Accessories', image: '/images/products/cap.jpg' },
]

const carouselProducts = [
  { id: 1, name: 'Night Walker Jacket', price: '$299', rating: 4.9, image: '/images/products/night-jacket.jpg' },
  { id: 2, name: 'Solaris Sneakers',    price: '$199', rating: 4.8, image: '/images/products/running-shoes.jpg' },
  { id: 3, name: 'Pulse Watch Pro',     price: '$449', rating: 5.0, image: '/images/products/luxury-watch.jpg' },
  { id: 4, name: 'Nova Cap',            price: '$69',  rating: 4.7, image: '/images/products/summer-cap.jpg' },
  { id: 5, name: 'Stealth Bomber',      price: '$379', rating: 4.9, image: '/images/products/stealth-bomber.jpg' },
  { id: 6, name: 'Arc Titanium',        price: '$529', rating: 4.8, image: '/images/products/titan-watch.jpg' },
  { id: 7, name: 'Zenith Hoodie',       price: '$159', rating: 4.6, image: '/images/products/hoodie.jpg' },
  { id: 8, name: 'Orbit Ring',          price: '$89',  rating: 4.9, image: '/images/products/ring.jpg' },
]

const suggestions = [
  'Premium leather jackets',
  'Minimalist watches',
  'AI-curated sneakers',
  'Summer collection 2026',
]

function Particles() {
  const dots = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 1.5 + Math.random() * 2.5,
      duration: 10 + Math.random() * 15,
      delay: Math.random() * 10,
      opacity: 0.15 + Math.random() * 0.35,
    })), [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {dots.map(d => (
        <div
          key={d.id}
          className="particle"
          style={{
            left: d.left,
            width: d.size,
            height: d.size,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  )
}

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute w-[600px] h-[600px] rounded-full anim-glow-pulse" style={{ top: '10%', left: '15%', background: 'radial-gradient(circle, rgba(255,120,80,0.04) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute w-[500px] h-[500px] rounded-full anim-breathe" style={{ top: '30%', right: '10%', background: 'radial-gradient(circle, rgba(255,75,87,0.03) 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '2s' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full anim-glow-pulse" style={{ bottom: '10%', left: '40%', background: 'radial-gradient(circle, rgba(255,170,128,0.03) 0%, transparent 70%)', filter: 'blur(70px)', animationDelay: '3s' }} />
    </div>
  )
}

function WaveBackground() {
  return (
    <div className="wave-container" aria-hidden="true">
      <svg className="wave-line" viewBox="0 0 2400 200" preserveAspectRatio="none">
        <path d="M0,100 C400,40 800,160 1200,100 C1600,40 2000,160 2400,100 L2400,200 L0,200 Z" fill="none" stroke="rgba(255,120,80,0.15)" strokeWidth="1" />
        <path d="M0,120 C400,60 800,180 1200,120 C1600,60 2000,180 2400,120 L2400,200 L0,200 Z" fill="none" stroke="rgba(255,75,87,0.1)" strokeWidth="1" />
      </svg>
    </div>
  )
}

function HeroCard({ product, rotate, delay, translateY = 0, colors }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate }}
      animate={{ opacity: 1, y: translateY, rotate }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: translateY - 6, scale: 1.03 }}
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        width: 180,
        background: colors.glass,
        border: `1px solid ${colors.glassBorder}`,
      }}
    >
      <div style={{ width: '100%', height: 160, overflow: 'hidden' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.accent, marginBottom: 4, opacity: 0.7 }}>
          {product.cat}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, lineHeight: 1.3, marginBottom: 8 }}>
          {product.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{product.price}</span>
          <button style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,120,80,0.1)', border: '1px solid rgba(255,120,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accent, cursor: 'pointer' }}>
            <ShoppingCart size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const { isDark, colors } = useTheme()
  const { t } = useTranslation('common')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const [carouselPaused, setCarouselPaused] = useState(false)

  const features = [
    { icon: Bot,    title: t('landing.features.ai_title'), desc: t('landing.features.ai_desc') },
    { icon: Shield, title: t('landing.features.secure_title'), desc: t('landing.features.secure_desc') },
    { icon: Truck,  title: t('landing.features.delivery_title'), desc: t('landing.features.delivery_desc') },
    { icon: Zap,    title: t('landing.features.checkout_title'), desc: t('landing.features.checkout_desc') },
  ]

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: colors.bg, overflow: 'hidden' }}>

      {/* Background layers */}
      <div className="vignette" />
      <div className="noise-overlay" />
      <div className="grid-floor" />
      <Particles />
      <FloatingOrbs />
      <WaveBackground />

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 600, pointerEvents: 'none', background: `linear-gradient(to bottom, ${colors.bg} 0%, ${colors.bg}cc 60%, ${colors.bg} 100%)` }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-5 pt-8 pb-0" style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, border: '1px solid rgba(255,120,80,0.15)', background: 'rgba(255,120,80,0.04)', marginBottom: 40 }}
        >
          <Sparkles size={13} style={{ color: colors.accent }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: colors.accent, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>{t('landing.badge')}</span>
        </motion.div>

        {/* HERO SECTION */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 1000, marginBottom: 80 }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }} aria-hidden="true">
            <div className="neon-ring anim-glow-pulse" style={{ width: 'min(520px, 70vw)', height: 'min(520px, 70vw)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            <div className="neon-ring-inner" style={{ width: 'min(420px, 58vw)', height: 'min(420px, 58vw)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '32px 0' }}>
            <div className="hidden md:flex" style={{ flexDirection: 'column', gap: 16 }}>
              <HeroCard product={heroCards[0]} rotate={-4} delay={0.2} translateY={-16} colors={colors} />
              <HeroCard product={heroCards[1]} rotate={-3} delay={0.35} translateY={8} colors={colors} />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02 }}
              style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 300 }}
            >
              <div
                style={{
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: `1px solid ${colors.glassBorder}`,
                  background: colors.glass,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', inset: -16, borderRadius: 24, pointerEvents: 'none' }} className="anim-glow-pulse">
                  <div style={{ width: '100%', height: '100%', background: 'radial-gradient(circle, rgba(255,120,80,0.08) 0%, transparent 70%)' }} />
                </div>

                <div style={{ width: '100%', aspectRatio: '4/5', overflow: 'hidden', position: 'relative' }}>
                  <img src={featuredProduct.image} alt={featuredProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: `linear-gradient(to top, ${colors.bg} 0%, transparent 100%)` }} />
                </div>

                <div style={{ position: 'relative', padding: '0 24px 28px', marginTop: -40 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.accent, border: '1px solid rgba(255,120,80,0.2)', background: 'rgba(255,120,80,0.06)', marginBottom: 12 }}>
                    <Bot size={10} /> {featuredProduct.category}
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.text, letterSpacing: '-0.02em', marginBottom: 6 }}>
                    {featuredProduct.name}
                  </h2>
                  <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 16, lineHeight: 1.6, maxWidth: 220 }}>
                    {featuredProduct.desc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{featuredProduct.price}</span>
                    <button
                      style={{ padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', boxShadow: '0 4px 20px rgba(255,120,80,0.2)', transition: 'all 0.3s ease' }}
                      onMouseOver={(e) => e.target.style.boxShadow = '0 4px 30px rgba(255,120,80,0.35)'}
                      onMouseOut={(e) => e.target.style.boxShadow = '0 4px 20px rgba(255,120,80,0.2)'}
                    >
                      {t('landing.add_to_cart')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="hidden md:flex" style={{ flexDirection: 'column', gap: 16 }}>
              <HeroCard product={heroCards[2]} rotate={4} delay={0.4} translateY={8} colors={colors} />
              <HeroCard product={heroCards[3]} rotate={3} delay={0.55} translateY={-16} colors={colors} />
            </div>
          </div>

          {/* Mobile hero cards */}
          <div className="flex md:hidden gap-3 justify-center mt-4 overflow-x-auto carousel-scroll px-4">
            {heroCards.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }} style={{ flexShrink: 0 }}>
                <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.glassBorder}`, background: colors.glass, padding: 12, width: 140, cursor: 'pointer' }}>
                  <div style={{ width: '100%', height: 100, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.accent, marginBottom: 4, textAlign: 'center', opacity: 0.6 }}>{p.cat}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 4, textAlign: 'center' }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, textAlign: 'center' }}>{p.price}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* HEADLINE */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="text-center" style={{ marginBottom: 40 }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(48px, 8vw, 80px)', lineHeight: 1.0, letterSpacing: '-0.02em', color: colors.text, marginBottom: 0 }}>
            {t('landing.hero_title_1')}
          </h1>
          <h1 className="font-display gradient-text" style={{ fontSize: 'clamp(48px, 8vw, 80px)', lineHeight: 1.0, letterSpacing: '-0.02em' }}>
            {t('landing.hero_title_2')}
          </h1>
          <p style={{ marginTop: 16, fontSize: 14, color: colors.textMuted, maxWidth: 320, margin: '16px auto 0', lineHeight: 1.6 }}>
            {t('landing.hero_subtitle')}
          </p>
        </motion.div>

        {/* AI SEARCH */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.8 }} style={{ width: '100%', maxWidth: 520, marginBottom: 80 }}>
          <div className="ai-search-border" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: colors.glass, border: `1px solid ${colors.glassBorder}`, borderRadius: 16 }}>
              <Search size={18} style={{ color: colors.accent, flexShrink: 0, opacity: 0.5 }} />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder={t('landing.search_placeholder')}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: colors.text, fontWeight: 300 }}
              />
              <button
                style={{ padding: '6px 16px', borderRadius: 10, fontSize: 11, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, background: 'linear-gradient(135deg, #ff7850, #ff6b6b)' }}
              >
                {t('landing.search_button')}
              </button>
            </div>
          </div>

          <motion.div initial={false} animate={{ height: searchFocused ? 'auto' : 0, opacity: searchFocused ? 1 : 0 }} transition={{ duration: 0.3 }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {suggestions.map((s, i) => (
                <motion.button key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSearchVal(s)}
                  style={{ padding: '6px 12px', borderRadius: 999, fontSize: 11, color: colors.textSecondary, border: `1px solid ${colors.glassBorder}`, background: colors.glass, cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* CAROUSEL */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 1.0 }} style={{ width: '100%', marginBottom: 96, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '0 8px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: colors.text, letterSpacing: '-0.01em' }}>{t('landing.trending_now')}</h2>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: colors.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.7 }}>
              {t('landing.view_all')} <ChevronRight size={14} />
            </button>
          </div>

          <div className="marquee-track" style={{ animationPlayState: carouselPaused ? 'paused' : 'running' }} onMouseEnter={() => setCarouselPaused(true)} onMouseLeave={() => setCarouselPaused(false)}>
            {[...carouselProducts, ...carouselProducts].map((p, i) => (
              <div key={i} style={{ flexShrink: 0, width: 216 }}>
                <div className="product-card-hero" style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${colors.glassBorder}`, background: colors.glass, padding: 12, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                  <div style={{ width: '100%', aspectRatio: '4/5', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <Star size={10} style={{ color: '#ff7850', fill: '#ff7850' }} />
                    <span style={{ fontSize: 10, color: colors.textMuted }}>{p.rating}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, lineHeight: 1.3, marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>{p.price}</span>
                    <button style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,120,80,0.1)', border: '1px solid rgba(255,120,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accent, cursor: 'pointer', transition: 'all 0.2s' }}>
                      <ShoppingCart size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FEATURES */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.2 }} style={{ width: '100%', maxWidth: 900, marginBottom: 64 }}>
          <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 12 }}>
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 1.3 + i * 0.1 }}>
                  <div
                    style={{ borderRadius: 16, padding: 24, textAlign: 'center', border: `1px solid ${colors.glassBorder}`, background: colors.glass, height: '100%', transition: 'all 0.4s ease' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = colors.glassHover; e.currentTarget.style.borderColor = 'rgba(255,120,80,0.15)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = colors.glass; e.currentTarget.style.borderColor = colors.glassBorder; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,120,80,0.08)', border: '1px solid rgba(255,120,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <Icon size={18} style={{ color: colors.accent }} />
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{f.title}</h3>
                    <p style={{ fontSize: 11, lineHeight: 1.6, color: colors.textMuted }}>{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.5 }} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 96 }}>
          {user ? (
            <Link to="/dashboard" style={{ padding: '14px 32px', borderRadius: 16, fontWeight: 600, fontSize: 13, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', boxShadow: '0 4px 20px rgba(255,120,80,0.2)', transition: 'all 0.3s' }}
              onMouseOver={(e) => e.target.style.boxShadow = '0 4px 30px rgba(255,120,80,0.35)'}
              onMouseOut={(e) => e.target.style.boxShadow = '0 4px 20px rgba(255,120,80,0.2)'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t('nav.dashboard')} <ArrowRight size={15} /></span>
            </Link>
          ) : (
            <>
              <Link to="/register" style={{ padding: '14px 32px', borderRadius: 16, fontWeight: 600, fontSize: 13, color: '#fff', textDecoration: 'none', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)', boxShadow: '0 4px 20px rgba(255,120,80,0.2)', transition: 'all 0.3s' }}
                onMouseOver={(e) => e.target.style.boxShadow = '0 4px 30px rgba(255,120,80,0.35)'}
                onMouseOut={(e) => e.target.style.boxShadow = '0 4px 20px rgba(255,120,80,0.2)'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{t('landing.get_started')} <ArrowRight size={15} /></span>
              </Link>
              <Link to="/login" style={{ padding: '14px 32px', borderRadius: 16, fontWeight: 600, fontSize: 13, color: colors.textSecondary, textDecoration: 'none', background: colors.glass, border: `1px solid ${colors.glassBorder}`, transition: 'all 0.3s' }}
                onMouseOver={(e) => { e.target.style.color = colors.text; e.target.style.borderColor = 'rgba(255,120,80,0.2)'; }}
                onMouseOut={(e) => { e.target.style.color = colors.textSecondary; e.target.style.borderColor = colors.glassBorder; }}
              >
                {t('landing.sign_in')}
              </Link>
            </>
          )}
        </motion.div>

        {/* FOOTER */}
        <footer style={{ width: '100%', maxWidth: 900 }}>
          <div className="footer-divider" style={{ marginBottom: 32 }} />
          <div className="flex flex-col sm:flex-row items-center justify-between" style={{ gap: 16, paddingBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #ff7850, #ff6b6b)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>AI</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}>{t('app_name')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {['Twitter', 'GitHub', 'Discord'].map((s) => (
                <a key={s} href="#" style={{ fontSize: 11, color: colors.textMuted, textDecoration: 'none', transition: 'color 0.2s' }}>
                  {s}
                </a>
              ))}
            </div>
            <span style={{ fontSize: 11, color: colors.textMuted }}>{t('landing.footer.copyright')}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
