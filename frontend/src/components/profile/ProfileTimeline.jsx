import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ShoppingBag, Heart, Star, User, LogIn, Award, MessageCircle, Package } from 'lucide-react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
}

export default function ProfileTimeline() {
  const { t } = useTranslation('profile')

  const activities = [
    { id: 1, type: 'login', icon: LogIn, titleKey: 'timeline.signed_in', detailKey: 'timeline.signed_in_detail', time: '2 min ago', color: '#5cb86a', bg: 'rgba(92,184,106,0.12)' },
    { id: 2, type: 'order', icon: ShoppingBag, titleKey: 'timeline.order_placed', detailKey: 'timeline.order_placed_detail', time: '1 hour ago', color: '#ff7850', bg: 'rgba(255,120,80,0.12)' },
    { id: 3, type: 'wishlist', icon: Heart, titleKey: 'timeline.added_to_wishlist', detailKey: 'timeline.added_to_wishlist_detail', time: '3 hours ago', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)' },
    { id: 4, type: 'review', icon: Star, titleKey: 'timeline.left_review', detailKey: 'timeline.left_review_detail', time: '1 day ago', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
    { id: 5, type: 'achievement', icon: Award, titleKey: 'timeline.achievement_unlocked', detailKey: 'timeline.achievement_detail', time: '2 days ago', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
    { id: 6, type: 'order', icon: Package, titleKey: 'timeline.order_delivered', detailKey: 'timeline.order_delivered_detail', time: '5 days ago', color: '#5cb86a', bg: 'rgba(92,184,106,0.12)' },
    { id: 7, type: 'profile', icon: User, titleKey: 'timeline.profile_updated', detailKey: 'timeline.profile_updated_detail', time: '1 week ago', color: '#7c8cf8', bg: 'rgba(124,140,248,0.12)' },
    { id: 8, type: 'message', icon: MessageCircle, titleKey: 'timeline.ai_chat', detailKey: 'timeline.ai_chat_detail', time: '2 weeks ago', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      <h2 className="text-lg font-bold mb-6 text-text">{t('timeline.title')}</h2>

      <motion.div variants={container} initial="hidden" animate="show" className="relative">
        {/* Timeline line */}
        <div
          className="absolute left-[18px] top-0 bottom-0 w-[2px]"
          style={{ background: 'linear-gradient(to bottom, rgba(255,120,80,0.3), rgba(124,140,248,0.2), transparent)' }}
        />

        <div className="space-y-1">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <motion.div
                key={activity.id}
                variants={item}
                className="relative flex items-start gap-4 pl-0 py-3 group"
              >
                <div className="relative z-10 shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-[36px] h-[36px] rounded-xl flex items-center justify-center"
                    style={{ background: activity.bg }}
                  >
                    <Icon size={15} style={{ color: activity.color }} />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-semibold text-text">{t(activity.titleKey)}</div>
                      <div className="text-[12px] mt-0.5 text-text-muted">{t(activity.detailKey)}</div>
                    </div>
                    <span className="text-[11px] shrink-0 text-text-muted">{activity.time}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
