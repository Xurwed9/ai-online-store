import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { User, Mail, Phone, Calendar, MapPin, Globe, Languages, Moon, Edit3, Check, X, ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { users as usersApi } from '../../api/client'

export default function ProfileInfo({ user, onUpdate }) {
  const { t } = useTranslation('profile')
  const { refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const fields = [
    { key: 'username', label: t('info.full_name'), icon: User, type: 'text' },
    { key: 'email', label: t('info.email'), icon: Mail, type: 'email' },
    { key: 'phone_number', label: t('info.phone'), icon: Phone, type: 'tel' },
    { key: 'date_of_birth', label: t('info.date_of_birth'), icon: Calendar, type: 'date' },
    { key: 'gender', label: t('info.gender'), icon: ChevronDown, type: 'select', options: [t('info.prefer_not_to_say'), t('info.male'), t('info.female'), t('info.other')] },
    { key: 'country', label: t('info.country'), icon: Globe, type: 'text' },
    { key: 'city', label: t('info.city'), icon: MapPin, type: 'text' },
    { key: 'address', label: t('info.address'), icon: MapPin, type: 'text' },
    { key: 'language', label: t('info.language'), icon: Languages, type: 'select', options: ['English', 'Русский', "O'zbek", 'Türkçe'] },
  ]

  const startEdit = () => {
    const data = {}
    fields.forEach(f => { data[f.key] = user?.[f.key] || '' })
    data.dark_mode = user?.dark_mode ?? true
    setForm(data)
    setEditing(true)
  }

  const cancelEdit = () => { setEditing(false) }

  const handleSave = async () => {
    setSaving(true)
    try {
      await usersApi.updateProfile({
        username: form.username || undefined,
        email: form.email || undefined,
        phone_number: form.phone_number || undefined,
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        address: form.address || undefined,
        language: form.language || undefined,
        dark_mode: form.dark_mode ?? undefined,
      })
      await refreshUser()
      onUpdate?.()
      toast.success(t('info.profile_updated'))
      setEditing(false)
    } catch (err) {
      const msg = err.response?.data?.detail || t('info.profile_update_failed')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const inputStyle = {
    background: 'var(--profile-input-bg)',
    border: '1px solid var(--profile-input-border)',
    color: 'var(--color-text)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-text">{t('info.title')}</h2>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelEdit}
                className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer glass-btn text-text-secondary"
              >
                <X size={13} /> {t('info.cancel')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #ff7850, #ff6340)',
                  color: '#fff',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <Check size={13} /> {saving ? t('info.saving') : t('info.save')}
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startEdit}
              className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer bg-accent/10 border border-accent/20 text-accent"
            >
              <Edit3 size={13} /> {t('info.edit')}
            </motion.button>
          )}
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const Icon = field.icon
          return (
            <div key={field.key} className="group">
              <label className="block text-[11px] font-medium uppercase tracking-wider mb-2 text-text-muted">
                {field.label}
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <Icon size={15} />
                </div>
                {editing ? (
                  field.type === 'select' ? (
                    <select
                      value={form[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/20 cursor-pointer"
                      style={inputStyle}
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/20"
                      style={inputStyle}
                    />
                  )
                ) : (
                  <div
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-text-secondary"
                    style={{
                      background: 'var(--profile-input-bg)',
                      border: '1px solid var(--profile-input-border)',
                    }}
                  >
                    {user?.[field.key] || '—'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dark Mode Preference */}
      <div className="mt-5 pt-5 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent/10">
              <Moon size={15} className="text-accent" />
            </div>
            <div>
              <div className="text-sm font-medium text-text">{t('info.dark_mode')}</div>
              <div className="text-[11px] text-text-muted">{t('info.dark_mode_desc')}</div>
            </div>
          </div>
          <button
            onClick={() => editing ? handleChange('dark_mode', !form.dark_mode) : null}
            className="relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer"
            style={{
              background: (editing ? form.dark_mode : user?.dark_mode)
                ? 'linear-gradient(135deg, #ff7850, #ff6340)'
                : 'var(--profile-input-bg)'
            }}
          >
            <motion.div
              animate={{ x: (editing ? form.dark_mode : user?.dark_mode) ? 20 : 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="absolute top-1 w-4 h-4 rounded-full bg-white"
            />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
