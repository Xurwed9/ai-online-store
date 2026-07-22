import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/dashboard' : '/products')
  }, [user, navigate])

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[420px] bg-surface border border-border rounded-2xl p-11 shadow-sm animate-[slideUp_0.4s_ease]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-green/10 border border-green/15 inline-flex items-center justify-center text-xl mb-4"><LogIn size={22} className="text-green" /></div>
          <h1 className="font-display text-[26px] text-text mb-1.5">Welcome Back</h1>
          <p className="text-sm text-text-secondary">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Username</label>
            <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] focus:bg-surface placeholder:text-text-muted" placeholder="Enter your username" />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-xl text-sm text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] focus:bg-surface placeholder:text-text-muted" placeholder="Enter your password" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <div className="flex items-center gap-3.5 my-5.5 text-text-muted text-xs"><div className="flex-1 h-px bg-border" />or<div className="flex-1 h-px bg-border" /></div>
        <p className="text-center text-[13px] text-text-secondary">Don't have an account? <Link to="/register" className="text-accent font-medium no-underline hover:text-accent-hover">Create one</Link></p>
        <p className="text-center text-[13px] text-text-secondary mt-2"><Link to="/verify-email" className="text-accent font-medium no-underline hover:text-accent-hover">Verify your email</Link></p>
      </div>
    </div>
  )
}
