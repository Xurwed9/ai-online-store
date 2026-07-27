import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, Package, ShoppingCart, ArrowRight, Trash2 } from 'lucide-react'
import { favorites as favoritesApi } from '../../api/client'
import { toast } from 'react-hot-toast'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

export default function ProfileWishlist({ items = [], onRemove }) {
  const { t } = useTranslation('profile')

  const handleRemove = async (productId) => {
    try {
      await favoritesApi.remove(productId)
      toast.success(t('wishlist.removed'))
      onRemove?.(productId)
    } catch {
      toast.error(t('wishlist.remove_failed'))
    }
  }

  if (items.length === 0) {
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
        <Heart size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
        <p className="text-sm mb-4 text-text-muted">{t('wishlist.empty')}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #ff7850, #ff6340)', color: '#fff' }}
        >
          {t('wishlist.discover_products')} <ArrowRight size={14} />
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text">{t('wishlist.title')}</h2>
        <Link to="/favorites" className="text-xs font-medium flex items-center gap-1.5 no-underline text-accent">
          {t('wishlist.view_all')} <ArrowRight size={12} />
        </Link>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.slice(0, 4).map(wish => (
          <motion.div
            key={wish.id || wish.product_id}
            variants={item}
            whileHover={{ y: -4, scale: 1.02 }}
            className="rounded-xl overflow-hidden group transition-all duration-300"
            style={{
              background: 'var(--profile-input-bg)',
              border: '1px solid var(--profile-input-border)',
            }}
          >
            <Link to={`/products/${wish.product_id}`} className="block no-underline text-text">
              <div className="relative h-[140px] overflow-hidden bg-bg-warm">
                {wish.product_image ? (
                  <img
                    src={wish.product_image}
                    alt={wish.product_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted opacity-20">
                    <Package size={28} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Heart size={16} className="fill-red text-red" />
                </div>
              </div>
              <div className="p-3">
                <div className="text-[13px] font-semibold truncate mb-1 text-text">{wish.product_name}</div>
                <div className="text-sm font-bold text-accent">${Number(wish.product_price || 0).toFixed(2)}</div>
              </div>
            </Link>

            <div className="px-3 pb-3 flex gap-2">
              <Link
                to={`/products/${wish.product_id}`}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold no-underline transition-all bg-accent/10 border border-accent/15 text-accent"
              >
                <ShoppingCart size={11} /> {t('wishlist.view')}
              </Link>
              <button
                onClick={() => handleRemove(wish.product_id)}
                className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all bg-red/10 border border-red/15 text-red"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
