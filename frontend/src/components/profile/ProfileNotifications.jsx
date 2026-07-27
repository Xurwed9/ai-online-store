import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bell, Mail, MessageSquare, Smartphone, Sparkles, Newspaper, Volume2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ProfileNotifications() {
  const { t } = useTranslation('profile')
  const [settings, setSettings] = useState({
    email: true, sms: false, push: true, ai: true, newsletter: false, sound: true
  })

  const notificationSettings = [
    { id: 'email', label: t('notifications.email_notifications'), description: t('notifications.email_notifications_desc'), icon: Mail, color: '#ff7850' },
    { id: 'sms', label: t('notifications.sms_notifications'), description: t('notifications.sms_notifications_desc'), icon: MessageSquare, color: '#7c8cf8' },
    { id: 'push', label: t('notifications.push_notifications'), description: t('notifications.push_notifications_desc'), icon: Smartphone, color: '#5cb86a' },
    { id: 'ai', label: t('notifications.ai_recommendations'), description: t('notifications.ai_recommendations_desc'), icon: Sparkles, color: '#a78bfa' },
    { id: 'newsletter', label: t('notifications.newsletter'), description: t('notifications.newsletter_desc'), icon: Newspaper, color: '#ffaa80' },
    { id: 'sound', label: t('notifications.notification_sounds'), description: t('notifications.notification_sounds_desc'), icon: Volume2, color: '#ffd700' },
  ]

  const toggle = (id) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }))
    const setting = notificationSettings.find(n => n.id === id)
    toast.success(`${setting.label} ${settings[id] ? t('security.disabled') : t('security.enabled')}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
          <Bell size={16} className="text-accent" />
        </div>
        <h2 className="text-lg font-bold text-text">{t('notifications.title')}</h2>
      </div>

      <div className="space-y-1">
        {notificationSettings.map((notif, index) => {
          const Icon = notif.icon
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-xl transition-all duration-300"
              style={{ background: settings[notif.id] ? 'var(--profile-input-bg)' : 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--profile-glass-hover)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = settings[notif.id] ? 'var(--profile-input-bg)' : 'transparent' }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-opacity duration-300"
                  style={{ background: `${notif.color}18`, opacity: settings[notif.id] ? 1 : 0.4 }}
                >
                  <Icon size={16} style={{ color: notif.color }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-text">{notif.label}</div>
                  <div className="text-[11px] text-text-muted">{notif.description}</div>
                </div>
              </div>

              <button
                onClick={() => toggle(notif.id)}
                className="relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer shrink-0 border-none"
                style={{
                  background: settings[notif.id]
                    ? `linear-gradient(135deg, ${notif.color}, ${notif.color}cc)`
                    : 'var(--profile-input-bg)'
                }}
              >
                <motion.div
                  animate={{ x: settings[notif.id] ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white"
                />
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
