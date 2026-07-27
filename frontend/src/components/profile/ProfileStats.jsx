import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ShoppingCart, Heart, Star, Coins, DollarSign, Bookmark, LayoutGrid } from 'lucide-react'

function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [displayed, setDisplayed] = useState(0)
  const rafRef = useRef(null)
  const startRef = useRef(0)

  useEffect(() => {
    const num = Number(value) || 0
    const duration = 1200
    const startTime = Date.now()
    startRef.current = displayed

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(startRef.current + (num - startRef.current) * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span>{prefix}{displayed.toLocaleString()}{suffix}</span>
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
}

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

export default function ProfileStats({ userData }) {
  const { t } = useTranslation('profile')

  const stats = [
    { key: 'orders', label: t('stats.total_orders'), icon: ShoppingCart, gradient: 'linear-gradient(135deg, #ff7850, #ff6340)', glow: 'rgba(255,120,80,0.15)' },
    { key: 'wishlist', label: t('stats.wishlist'), icon: Heart, gradient: 'linear-gradient(135deg, #ff6b6b, #ff4757)', glow: 'rgba(255,107,107,0.15)' },
    { key: 'reviews', label: t('stats.reviews'), icon: Star, gradient: 'linear-gradient(135deg, #ffd700, #ffaa00)', glow: 'rgba(255,215,0,0.15)' },
    { key: 'points', label: t('stats.reward_points'), icon: Coins, gradient: 'linear-gradient(135deg, #5cb86a, #3a7d44)', glow: 'rgba(92,184,106,0.15)' },
    { key: 'spent', label: t('stats.total_spent'), icon: DollarSign, gradient: 'linear-gradient(135deg, #7c8cf8, #5b6abf)', glow: 'rgba(124,140,248,0.15)' },
    { key: 'saved', label: t('stats.saved_products'), icon: Bookmark, gradient: 'linear-gradient(135deg, #ffaa80, #ff7850)', glow: 'rgba(255,170,128,0.15)' },
    { key: 'categories', label: t('stats.fav_categories'), icon: LayoutGrid, gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)', glow: 'rgba(167,139,250,0.15)' },
  ]

  const values = {
    orders: userData?.total_orders || 0,
    wishlist: userData?.wishlist_count || 0,
    reviews: userData?.reviews_count || 0,
    points: userData?.reward_points || 0,
    spent: userData?.total_spent || 0,
    saved: userData?.saved_products || 0,
    categories: userData?.favorite_categories || 0,
  }

  const formatValue = (key, val) => {
    if (key === 'spent') return { prefix: '$', suffix: '', value: val }
    if (key === 'points') return { prefix: '', suffix: t('stats.pts_suffix'), value: val }
    return { prefix: '', suffix: '', value: val }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8"
    >
      {stats.map((stat) => {
        const Icon = stat.icon
        const fmt = formatValue(stat.key, values[stat.key])
        return (
          <motion.div
            key={stat.key}
            variants={item}
            whileHover={{ y: -6, scale: 1.02 }}
            className="relative rounded-2xl p-5 overflow-hidden cursor-default group"
            style={{
              background: 'var(--profile-glass)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--profile-glass-border)',
            }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 50% 50%, ${stat.glow}, transparent 70%)` }}
            />

            {/* Hover border */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ border: '1px solid var(--profile-glass-border-hover)' }}
            />

            <div className="relative z-10">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110"
                style={{ background: stat.gradient }}
              >
                <Icon size={18} className="text-white" />
              </div>
              <div className="text-xl font-bold mb-1 text-text">
                <AnimatedNumber value={fmt.value} prefix={fmt.prefix} suffix={fmt.suffix} />
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
                {stat.label}
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
