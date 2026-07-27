import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { MailCheck } from 'lucide-react'

export default function VerifyEmail() {
  const { verifyEmail } = useAuth()
  const { t } = useTranslation('auth')
  const { t: tCommon } = useTranslation('common')
  const { t: tErrors } = useTranslation('errors')
  const [form, setForm] = useState({ email: '', code: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await verifyEmail(form)
      toast.success(t('verify_email.success'))
      setSuccess(true)
    } catch (err) {
      toast.error(err?.response?.data?.detail || tErrors('verify_failed'))
    } finally {
      setLoading(false)
    }
  }

  const input = "w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] focus:bg-surface placeholder:text-text-muted"

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] bg-surface border border-border rounded-2xl p-11 shadow-sm animate-[slideUp_0.4s_ease]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-yellow/10 border border-yellow/15 inline-flex items-center justify-center text-xl mb-4"><MailCheck size={22} className="text-yellow" /></div>
          <h1 className="font-display text-[26px] text-text mb-1.5">{t('verify_email.title')}</h1>
          <p className="text-sm text-text-secondary">{t('verify_email.subtitle')}</p>
        </div>
        {success ? (
          <div className="text-center">
            <div className="p-4 rounded-xl bg-green/10 border border-green/15 text-green text-sm mb-5">{t('verify_email.success')}</div>
            <Link to="/login" className="inline-block w-full py-3 rounded-xl bg-text text-bg text-sm font-semibold no-underline text-center">{t('verify_email.go_to_login')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">{t('verify_email.email')}</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={input} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">{t('verify_email.code')}</label>
              <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={input} placeholder={t('verify_email.code_placeholder')} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">{loading ? t('verify_email.verifying') : t('verify_email.verify_email')}</button>
          </form>
        )}
        <div className="flex items-center gap-3.5 my-5.5 text-text-muted text-xs"><div className="flex-1 h-px bg-border" />{tCommon('or')}<div className="flex-1 h-px bg-border" /></div>
        <p className="text-center text-[13px] text-text-secondary">{t('verify_email.already_verified')} <Link to="/login" className="text-accent font-medium no-underline hover:text-accent-hover">{t('verify_email.sign_in')}</Link></p>
      </div>
    </div>
  )
}
