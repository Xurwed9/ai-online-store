import { useEffect, useState } from 'react'
import { payments as paymentsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { CreditCard, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_MAP = {
  pending: { icon: Clock, color: 'text-yellow', bg: 'bg-yellow/10' },
  completed: { icon: CheckCircle, color: 'text-green', bg: 'bg-green/10' },
  failed: { icon: XCircle, color: 'text-red', bg: 'bg-red/10' },
}

export default function Payments() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPayments = async () => {
    try {
      const res = isAdmin ? await paymentsApi.getAllAdmin() : await paymentsApi.getAll()
      setPayments(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPayments() }, [])

  if (loading) return <div className="text-center py-20 text-text-secondary text-sm">Loading payments...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-text">{isAdmin ? 'All Payments' : 'My Payments'}</h1>
      </div>

      {payments.length === 0 ? (
        <div className="text-center py-20">
          <CreditCard size={40} className="text-border-strong mx-auto mb-4" />
          <p className="text-text-secondary text-sm">No payments yet</p>
          <Link to="/orders" className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-accent text-white text-[13px] font-medium no-underline hover:opacity-90 transition-opacity">
            <ArrowLeft size={14} /> Go to Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const st = STATUS_MAP[p.status] || STATUS_MAP.pending
            const StIcon = st.icon
            return (
              <div key={p.id} className="bg-surface rounded-xl border border-border p-5 hover:border-border-strong transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${st.bg}`}>
                      <StIcon size={18} className={st.color} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">Payment #{p.id}</p>
                      <p className="text-xs text-text-secondary">Order #{p.order_id} • {p.method || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">${p.amount}</p>
                    <p className="text-xs text-text-secondary mt-0.5 capitalize">{p.status}</p>
                  </div>
                </div>
                {p.created_at && (
                  <p className="text-[11px] text-text-secondary mt-2 ml-12">
                    {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
