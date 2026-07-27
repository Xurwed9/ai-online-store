import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight, Eye } from 'lucide-react'

const statusKeys = {
  pending: { icon: Clock, key: 'pending', color: '#d4a820', bg: 'rgba(212,168,32,0.1)', border: 'rgba(212,168,32,0.2)' },
  confirmed: { icon: CheckCircle, key: 'confirmed', color: '#ff7850', bg: 'rgba(255,120,80,0.1)', border: 'rgba(255,120,80,0.2)' },
  shipped: { icon: Truck, key: 'shipped', color: '#7c8cf8', bg: 'rgba(124,140,248,0.1)', border: 'rgba(124,140,248,0.2)' },
  delivered: { icon: CheckCircle, key: 'delivered', color: '#5cb86a', bg: 'rgba(92,184,106,0.1)', border: 'rgba(92,184,106,0.2)' },
  cancelled: { icon: XCircle, key: 'cancelled', color: '#e06060', bg: 'rgba(224,96,96,0.1)', border: 'rgba(224,96,96,0.2)' },
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

export default function ProfileOrders({ orders = [] }) {
  const { t } = useTranslation('profile')

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-8 mb-8 text-center"
        style={{
          background: 'var(--profile-glass)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--profile-glass-border)',
        }}
      >
        <Package size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
        <p className="text-sm mb-4 text-text-muted">{t('orders_section.no_orders')}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #ff7850, #ff6340)', color: '#fff' }}
        >
          {t('orders_section.start_shopping')} <ArrowRight size={14} />
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text">{t('orders_section.recent_orders')}</h2>
        <Link to="/orders" className="text-xs font-medium flex items-center gap-1.5 no-underline text-accent hover:underline">
          {t('orders_section.view_all')} <ArrowRight size={12} />
        </Link>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
        {orders.slice(0, 5).map(order => {
          const st = statusKeys[order.status] || statusKeys.pending
          const StatusIcon = st.icon
          const statusLabel = t(`orders_section.${st.key}`, st.key)
          const date = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

          return (
            <motion.div
              key={order.id}
              variants={item}
              whileHover={{ x: 4 }}
              className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 group cursor-pointer"
              style={{
                background: 'var(--profile-input-bg)',
                border: '1px solid var(--profile-input-border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--profile-glass-hover)'
                e.currentTarget.style.borderColor = 'var(--profile-glass-border-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--profile-input-bg)'
                e.currentTarget.style.borderColor = 'var(--profile-input-border)'
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: st.bg, border: `1px solid ${st.border}` }}
                >
                  <StatusIcon size={16} style={{ color: st.color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text">#{order.id}</span>
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="text-[12px] mt-0.5 text-text-muted">
                    {order.items?.length || 0} {t('orders_section.items')} &middot; {date}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-text">
                  ${Number(order.total_price || 0).toFixed(2)}
                </span>
                <Link
                  to="/orders"
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 glass-btn"
                >
                  <Eye size={14} className="text-text-secondary" />
                </Link>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
