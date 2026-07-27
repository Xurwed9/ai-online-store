import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { users as usersApi } from '../../api/client'
import { toast } from 'react-hot-toast'
import { Camera, Edit3, BadgeCheck, Crown, Calendar, Shield, Sparkles, Star, Award, Gem, Trash2 } from 'lucide-react'

const loyaltyLevels = [
  { name: 'Bronze', icon: Award, color: '#cd7f32', min: 0 },
  { name: 'Silver', icon: Star, color: '#c0c0c0', min: 500 },
  { name: 'Gold', icon: Gem, color: '#ffd700', min: 2000 },
  { name: 'Platinum', icon: Crown, color: '#e5e4e2', min: 5000 },
]

const coverGradients = [
  'linear-gradient(135deg, var(--color-bg) 0%, #1a1040 30%, #2d1b69 60%, var(--color-bg) 100%)',
  'linear-gradient(135deg, var(--color-bg) 0%, #1b2a4a 30%, #0f3460 60%, var(--color-bg) 100%)',
  'linear-gradient(135deg, var(--color-bg) 0%, #2d1b3d 30%, #4a1942 60%, var(--color-bg) 100%)',
  'linear-gradient(135deg, var(--color-bg) 0%, #1a3a2a 30%, #0f4a3a 60%, var(--color-bg) 100%)',
]

export default function ProfileHeader({ user, onEdit }) {
  const { t } = useTranslation('profile')
  const { refreshUser } = useAuth()
  const [isHovering, setIsHovering] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const getLoyaltyLevel = (points = 0) => {
    for (let i = loyaltyLevels.length - 1; i >= 0; i--) {
      if (points >= loyaltyLevels[i].min) return loyaltyLevels[i]
    }
    return loyaltyLevels[0]
  }

  const gradientIndex = user?.id ? user.id % coverGradients.length : 0
  const loyalty = getLoyaltyLevel(user?.reward_points || 0)
  const LoyaltyIcon = loyalty.icon
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 5MB)')
      return
    }
    setUploading(true)
    try {
      await usersApi.uploadAvatar(file)
      await refreshUser()
      toast.success('Фото профиля обновлено')
    } catch {
      toast.error('Не удалось загрузить фото')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAvatar = async (e) => {
    e.stopPropagation()
    try {
      await usersApi.deleteAvatar()
      await refreshUser()
      toast.success('Фото профиля удалено')
    } catch {
      toast.error('Не удалось удалить фото')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-3xl overflow-hidden mb-8"
    >
      {/* Cover Banner */}
      <div
        className="relative h-[280px] md:h-[320px] overflow-hidden"
        style={{ background: coverGradients[gradientIndex] }}
      >
        {/* Animated mesh overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,120,80,0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(120,80,255,0.12) 0%, transparent 50%),
              radial-gradient(circle at 60% 80%, rgba(255,100,100,0.1) 0%, transparent 50%)
            `
          }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full blur-3xl"
          style={{ background: 'rgba(255,120,80,0.12)' }}
        />
        <motion.div
          animate={{ y: [0, 12, 0], x: [0, -6, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[20%] left-[10%] w-40 h-40 rounded-full blur-3xl"
          style={{ background: 'rgba(120,80,255,0.1)' }}
        />

        {/* Glass overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />

        {/* Edit cover button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="absolute top-5 right-5 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer glass-btn text-text-secondary hover:text-text"
        >
          <Edit3 size={13} /> {t('header.edit_profile')}
        </motion.button>
      </div>

      {/* Avatar + Info Section */}
      <div className="relative px-6 md:px-10 pb-8" style={{ marginTop: '-64px' }}>
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="w-[128px] h-[128px] rounded-full relative">
              {/* Neon ring */}
              <div className="absolute inset-0 rounded-full" style={{
                background: `conic-gradient(from 0deg, rgba(255,120,80,0.6), rgba(120,80,255,0.4), rgba(255,100,100,0.5), rgba(255,120,80,0.6))`,
                padding: '3px',
                borderRadius: '50%'
              }}>
                <div className="w-full h-full rounded-full bg-bg" style={{ padding: '3px' }}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface flex items-center justify-center relative">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold gradient-text">
                        {user?.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload overlay */}
              <motion.div
                initial={false}
                animate={{ opacity: isHovering ? 1 : 0 }}
                className="absolute inset-0 rounded-full flex items-center justify-center cursor-pointer gap-2"
                style={{ background: 'var(--profile-glass-hover)', backdropFilter: 'blur(4px)' }}
                onClick={handleAvatarClick}
              >
                {uploading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent"
                  />
                ) : (
                  <>
                    <Camera size={22} className="text-accent" />
                    {user?.avatar && (
                      <button
                        onClick={handleDeleteAvatar}
                        className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: 'rgba(255,80,80,0.9)' }}
                        title="Удалить фото"
                      >
                        <Trash2 size={13} className="text-white" />
                      </button>
                    )}
                  </>
                )}
              </motion.div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full border-[3px] border-bg bg-green" />
          </motion.div>

          {/* User Info */}
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-3xl font-bold tracking-tight text-text"
              >
                {user?.username || 'User'}
              </motion.h1>

              {/* Verification badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-green/10 border border-green/20 text-green"
              >
                <BadgeCheck size={13} /> {t('header.verified')}
              </motion.div>

              {/* Role badge */}
              {user?.role === 'admin' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.7, type: 'spring', stiffness: 200 }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-accent/10 border border-accent/20 text-accent"
                >
                  <Crown size={13} /> {t('header.admin')}
                </motion.div>
              )}

              {/* Loyalty badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: 0.8, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                style={{
                  background: `${loyalty.color}15`,
                  border: `1px solid ${loyalty.color}30`,
                  color: loyalty.color
                }}
              >
                <LoyaltyIcon size={13} /> {loyalty.name}
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-sm mb-3 text-text-secondary"
            >
              {user?.email}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-4 text-[13px] text-text-muted"
            >
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {t('header.member_since', { date: memberSince })}
              </span>
              {user?.phone_number && (
                <span className="flex items-center gap-1.5">
                  <Shield size={14} /> {user.phone_number}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} /> {t('header.reward_points', { count: user?.reward_points || 0 })}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
