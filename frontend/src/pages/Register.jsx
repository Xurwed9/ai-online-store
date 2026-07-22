import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', phone_number: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({ ...form, role: 'user' })
      toast.success('Account created! Check your email')
      navigate('/verify-email')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const input = "w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] focus:bg-surface placeholder:text-text-muted"

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] bg-surface border border-border rounded-2xl p-11 shadow-sm animate-[slideUp_0.4s_ease]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/15 inline-flex items-center justify-center text-xl mb-4"><UserPlus size={22} className="text-accent" /></div>
          <h1 className="font-display text-[26px] text-text mb-1.5">Create Account</h1>
          <p className="text-sm text-text-secondary">Join our fashion community today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Username</label>
            <input type="text" required minLength={5} maxLength={30} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={input} placeholder="min 5 characters" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Email</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={input} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Phone Number</label>
            <input type="text" required value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className={input} placeholder="+998 XX XXX XX XX" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={input} placeholder="min 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <div className="flex items-center gap-3.5 my-5.5 text-text-muted text-xs"><div className="flex-1 h-px bg-border" />or<div className="flex-1 h-px bg-border" /></div>
        <p className="text-center text-[13px] text-text-secondary">Already have an account? <Link to="/login" className="text-accent font-medium no-underline hover:text-accent-hover">Sign in</Link></p>
      </div>
    </div>
  )
}
