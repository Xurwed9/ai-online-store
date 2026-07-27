import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { orders as ordersApi, favorites as favoritesApi } from '../api/client'
import {
  User, Shield, Bell, Clock, Sparkles,
  ShoppingCart, LayoutGrid, Menu, X
} from 'lucide-react'

import ProfileHeader from '../components/profile/ProfileHeader'
import ProfileStats from '../components/profile/ProfileStats'
import ProfileInfo from '../components/profile/ProfileInfo'
import ProfileOrders from '../components/profile/ProfileOrders'
import ProfileWishlist from '../components/profile/ProfileWishlist'
import ProfileSecurity from '../components/profile/ProfileSecurity'
import ProfileNotifications from '../components/profile/ProfileNotifications'
import ProfileTimeline from '../components/profile/ProfileTimeline'
import ProfileAI from '../components/profile/ProfileAI'

export default function Profile() {
  const { t } = useTranslation('profile')
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  const tabs = [
    { id: 'overview', label: t('tabs.overview'), icon: LayoutGrid },
    { id: 'orders', label: t('tabs.orders'), icon: ShoppingCart },
    { id: 'security', label: t('tabs.security'), icon: Shield },
    { id: 'notifications', label: t('tabs.notifications'), icon: Bell },
    { id: 'timeline', label: t('tabs.timeline'), icon: Clock },
    { id: 'ai', label: t('tabs.ai'), icon: Sparkles },
  ]

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, favsRes] = await Promise.allSettled([
        ordersApi.getAll(),
        favoritesApi.getAll()
      ])
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data)
      if (favsRes.status === 'fulfilled') setWishlist(favsRes.value.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const userData = {
    ...user,
    total_orders: orders.length,
    wishlist_count: wishlist.length,
    reviews_count: 0,
    reward_points: orders.length * 150,
    total_spent: orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0),
    saved_products: wishlist.length,
    favorite_categories: 3,
  }

  const handleWishlistRemove = (productId) => {
    setWishlist(prev => prev.filter(i => i.product_id !== productId))
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff7850, #ff6340)' }}
          >
            <User size={20} className="text-white" />
          </motion.div>
          <p className="text-sm text-text-muted">{t('loading')}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-screen relative">
      {/* Mobile sidebar toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer lg:hidden"
        style={{
          background: 'linear-gradient(135deg, #ff7850, #ff6340)',
          boxShadow: '0 8px 30px rgba(255,120,80,0.4)',
        }}
      >
        {sidebarOpen ? <X size={20} className="text-white" /> : <Menu size={20} className="text-white" />}
      </motion.button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-40 lg:z-0
            w-[260px] h-screen shrink-0 overflow-y-auto
            transition-transform duration-300 lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{
            background: 'var(--profile-glass)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid var(--profile-glass-border)',
          }}
        >
          <div className="p-6 pt-8">
            {/* User mini card */}
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
                background: 'linear-gradient(135deg, #ff7850, #ffaa80)',
              }}>
                <span className="text-sm font-bold text-white">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate text-text">{user?.username}</div>
                <div className="text-[11px] truncate text-text-muted">{user?.email}</div>
              </div>
            </div>

            {/* Nav items */}
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-200"
                    style={{
                      background: isActive ? 'var(--profile-glass-hover)' : 'transparent',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      border: isActive ? '1px solid var(--profile-glass-border-hover)' : '1px solid transparent',
                    }}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </motion.button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[960px] mx-auto px-4 md:px-8 py-6 md:py-10">
            {/* Profile Header - always shown */}
            <ProfileHeader user={userData} onEdit={() => setActiveTab('overview')} />

            {/* Stats - always shown */}
            <ProfileStats userData={userData} />

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'overview' && (
                  <>
                    <ProfileInfo user={userData} onUpdate={loadData} />
                    <ProfileOrders orders={orders} />
                    <ProfileWishlist items={wishlist} onRemove={handleWishlistRemove} />
                  </>
                )}

                {activeTab === 'orders' && (
                  <ProfileOrders orders={orders} />
                )}

                {activeTab === 'security' && (
                  <ProfileSecurity />
                )}

                {activeTab === 'notifications' && (
                  <ProfileNotifications />
                )}

                {activeTab === 'timeline' && (
                  <ProfileTimeline />
                )}

                {activeTab === 'ai' && (
                  <ProfileAI />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
