import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bot, Shield, Truck } from 'lucide-react'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-16 animate-[slideUp_0.5s_ease]">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-accent/10 border border-accent/15 rounded-full text-xs text-accent font-medium mb-7">
        <span>&#9889;</span> AI-Powered Shopping
      </div>
      <h1 className="font-display text-[48px] leading-[1.1] tracking-[-1px] mb-4 max-w-[560px] text-text">
        Curated fashion, <span className="text-accent">intelligently</span> chosen
      </h1>
      <p className="text-[16px] text-text-secondary max-w-[420px] leading-relaxed mb-9">
        Discover clothing and accessories tailored to your style. Our AI assistant helps you find exactly what you need.
      </p>
      <div className="flex gap-3 flex-wrap justify-center mb-14">
        {user ? (
          <Link to="/dashboard" className="px-7 py-3 rounded-xl bg-text text-bg text-sm font-semibold no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all">Dashboard</Link>
        ) : (
          <>
            <Link to="/register" className="px-7 py-3 rounded-xl bg-text text-bg text-sm font-semibold no-underline hover:shadow-lg hover:-translate-y-0.5 transition-all">Get Started</Link>
            <Link to="/login" className="px-7 py-3 rounded-xl bg-surface text-text text-sm font-semibold no-underline border border-border hover:bg-bg transition-all">Sign In</Link>
          </>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3.5 max-w-[720px] w-full animate-[slideUp_0.7s_ease]">
        {[
          { icon: <Bot size={22} />, title: 'AI Recommendations', desc: 'Personalized suggestions powered by ML.' },
          { icon: <Shield size={22} />, title: 'Secure Payments', desc: 'Enterprise-grade security for every transaction.' },
          { icon: <Truck size={22} />, title: 'Fast Delivery', desc: 'Real-time tracking, right to your doorstep.' },
        ].map((f, i) => (
          <div key={i} className="p-5 bg-surface border border-border rounded-xl text-left hover:border-border-strong hover:shadow-sm transition-all">
            <div className="text-xl mb-2.5">{f.icon}</div>
            <div className="text-sm font-semibold mb-1">{f.title}</div>
            <div className="text-xs text-text-muted leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
