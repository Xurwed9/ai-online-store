import { useAuth } from '../context/AuthContext'
import { User, Mail, Shield, Calendar } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()

  const info = [
    { icon: <User size={18} />, label: 'Username', value: user?.username },
    { icon: <Mail size={18} />, label: 'Email', value: user?.email },
    { icon: <Shield size={18} />, label: 'Role', value: user?.role },
  ]

  return (
    <div className="flex-1 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[480px] animate-[slideUp_0.4s_ease]">
        <div className="text-center mb-8">
          <div className="w-[72px] h-[72px] rounded-full bg-accent/10 border border-accent/15 inline-flex items-center justify-center text-3xl mb-4">
            <span className="text-accent font-display">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <h1 className="font-display text-[28px] text-text mb-1">{user?.username}</h1>
          <p className="text-sm text-text-secondary">{user?.email}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-7 shadow-sm">
          <h2 className="font-display text-lg mb-5">Account Details</h2>
          <div className="space-y-4">
            {info.map((item, i) => (
              <div key={i} className="flex items-center gap-3.5 py-3 border-b border-border last:border-0">
                <div className="w-[38px] h-[38px] rounded-xl bg-bg border border-border inline-flex items-center justify-center text-text-muted">{item.icon}</div>
                <div>
                  <div className="text-[12px] text-text-muted">{item.label}</div>
                  <div className="text-sm font-medium">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
