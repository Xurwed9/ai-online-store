import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Lock, Shield, Smartphone, Eye, EyeOff, Key, Trash2, Fingerprint, AlertTriangle, Monitor, Laptop, Globe, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ProfileSecurity() {
  const { t } = useTranslation('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [twoFA, setTwoFA] = useState(false)

  const toggleSection = (id) => setExpandedSection(expandedSection === id ? null : id)

  const handlePasswordChange = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error(t('security.fill_all_fields'))
      return
    }
    if (passwords.new !== passwords.confirm) {
      toast.error(t('security.passwords_no_match'))
      return
    }
    toast.success(t('security.password_updated'))
    setPasswords({ current: '', new: '', confirm: '' })
    setExpandedSection(null)
  }

  const securityItems = [
    {
      id: 'password',
      title: t('security.change_password'),
      description: t('security.change_password_desc'),
      icon: Lock,
      gradient: 'linear-gradient(135deg, #ff7850, #ff6340)',
    },
    {
      id: '2fa',
      title: t('security.two_factor'),
      description: t('security.two_factor_desc'),
      icon: Shield,
      gradient: 'linear-gradient(135deg, #5cb86a, #3a7d44)',
    },
    {
      id: 'devices',
      title: t('security.active_devices'),
      description: t('security.active_devices_desc'),
      icon: Smartphone,
      gradient: 'linear-gradient(135deg, #7c8cf8, #5b6abf)',
    },
    {
      id: 'sessions',
      title: t('security.login_history'),
      description: t('security.login_history_desc'),
      icon: Globe,
      gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    },
  ]

  const devices = [
    { id: 1, name: 'MacBook Pro', type: 'laptop', icon: Laptop, location: 'New York, US', lastActive: '2 min ago', current: true },
    { id: 2, name: 'iPhone 15 Pro', type: 'mobile', icon: Smartphone, location: 'New York, US', lastActive: '1 hour ago', current: false },
    { id: 3, name: 'Chrome on Windows', type: 'desktop', icon: Monitor, location: 'San Francisco, US', lastActive: '3 days ago', current: false },
  ]

  const loginHistory = [
    { id: 1, device: 'MacBook Pro', location: 'New York, US', time: 'Just now', ip: '192.168.1.1', success: true },
    { id: 2, device: 'iPhone 15 Pro', location: 'New York, US', time: '2 hours ago', ip: '192.168.1.2', success: true },
    { id: 3, device: 'Chrome', location: 'Unknown', time: '1 day ago', ip: '45.33.22.11', success: false },
    { id: 4, device: 'Safari', location: 'New York, US', time: '3 days ago', ip: '192.168.1.1', success: true },
  ]

  const inputStyle = {
    background: 'var(--profile-input-bg)',
    border: '1px solid var(--profile-input-border)',
    color: 'var(--color-text)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      <h2 className="text-lg font-bold mb-6 text-text">{t('security.title')}</h2>

      <div className="space-y-3">
        {securityItems.map(secItem => {
          const Icon = secItem.icon
          const isExpanded = expandedSection === secItem.id

          return (
            <div key={secItem.id}>
              <motion.div
                whileHover={{ x: 4 }}
                onClick={() => toggleSection(secItem.id)}
                className="flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300"
                style={{
                  background: isExpanded ? 'var(--profile-glass-hover)' : 'var(--profile-input-bg)',
                  border: `1px solid ${isExpanded ? 'var(--profile-glass-border-hover)' : 'var(--profile-input-border)'}`,
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: secItem.gradient }}>
                    <Icon size={17} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text">{secItem.title}</div>
                    <div className="text-[12px] text-text-muted">{secItem.description}</div>
                  </div>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 45 : 0 }} transition={{ duration: 0.3 }}>
                  <Key size={16} className="text-text-muted" />
                </motion.div>
              </motion.div>

              {isExpanded && secItem.id === 'password' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-4 rounded-xl space-y-3"
                  style={{ background: 'var(--profile-input-bg)', border: '1px solid var(--profile-input-border)' }}
                >
                  {[
                    { key: 'current', label: t('security.current_password') },
                    { key: 'new', label: t('security.new_password') },
                    { key: 'confirm', label: t('security.confirm_password') },
                  ].map(field => (
                    <div key={field.key} className="relative">
                      <input
                        type={field.key === 'current' && !showPassword ? 'password' : 'text'}
                        placeholder={field.label}
                        value={passwords[field.key]}
                        onChange={(e) => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full pl-4 pr-10 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-accent/20"
                        style={inputStyle}
                      />
                      {field.key === 'current' && (
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent border-none text-text-muted"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePasswordChange}
                    className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer border-none"
                    style={{ background: 'linear-gradient(135deg, #ff7850, #ff6340)', color: '#fff' }}
                  >
                    {t('security.update_password')}
                  </motion.button>
                </motion.div>
              )}

              {isExpanded && secItem.id === '2fa' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-4 rounded-xl"
                  style={{ background: 'var(--profile-input-bg)', border: '1px solid var(--profile-input-border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Fingerprint size={20} className={twoFA ? 'text-green' : 'text-text-muted'} />
                      <div>
                        <div className="text-sm font-medium text-text">{twoFA ? t('security.enabled') : t('security.disabled')}</div>
                        <div className="text-[11px] text-text-muted">{t('security.use_authenticator')}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setTwoFA(!twoFA); toast.success(twoFA ? t('security.twofa_disabled') : t('security.twofa_enabled')) }}
                      className="relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer border-none"
                      style={{ background: twoFA ? 'linear-gradient(135deg, #5cb86a, #3a7d44)' : 'var(--profile-input-bg)' }}
                    >
                      <motion.div
                        animate={{ x: twoFA ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white"
                      />
                    </button>
                  </div>
                </motion.div>
              )}

              {isExpanded && secItem.id === 'devices' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-2">
                  {devices.map(device => {
                    const DeviceIcon = device.icon
                    return (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 rounded-xl"
                        style={{
                          background: device.current ? 'rgba(92,184,106,0.06)' : 'var(--profile-input-bg)',
                          border: `1px solid ${device.current ? 'rgba(92,184,106,0.12)' : 'var(--profile-input-border)'}`,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <DeviceIcon size={16} className={device.current ? 'text-green' : 'text-text-muted'} />
                          <div>
                            <div className="text-[13px] font-medium text-text">
                              {device.name} {device.current && <span className="text-[10px] px-1.5 py-0.5 rounded-md ml-1 bg-green/10 text-green">{t('security.current')}</span>}
                            </div>
                            <div className="text-[11px] text-text-muted">{device.location} &middot; {device.lastActive}</div>
                          </div>
                        </div>
                        {!device.current && (
                          <button
                            className="p-1.5 rounded-lg cursor-pointer transition-all hover:bg-red/10 bg-transparent border-none text-red"
                            onClick={() => toast.success(t('security.device_removed'))}
                          >
                            <LogOut size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}

              {isExpanded && secItem.id === 'sessions' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-2">
                  {loginHistory.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{
                        background: log.success ? 'var(--profile-input-bg)' : 'rgba(224,96,96,0.04)',
                        border: `1px solid ${log.success ? 'var(--profile-input-border)' : 'rgba(224,96,96,0.1)'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: log.success ? '#5cb86a' : '#e06060' }} />
                        <div>
                          <div className="text-[13px] font-medium text-text">{log.device}</div>
                          <div className="text-[11px] text-text-muted">{log.location} &middot; {log.ip} &middot; {log.time}</div>
                        </div>
                      </div>
                      {!log.success && <AlertTriangle size={14} className="text-red" />}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Danger Zone */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between p-4 rounded-xl bg-red/5 border border-red/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red/10">
              <Trash2 size={17} className="text-red" />
            </div>
            <div>
              <div className="text-sm font-semibold text-red">{t('security.delete_account')}</div>
              <div className="text-[12px] text-text-muted">{t('security.delete_account_desc')}</div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.error(t('security.contact_support'))}
            className="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer bg-red/10 text-red border border-red/20"
          >
            {t('security.delete')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
