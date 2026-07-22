import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-2xl animate-[slideUp_0.3s_ease]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-text">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border bg-bg text-text-muted hover:text-text hover:border-border-strong flex items-center justify-center cursor-pointer transition-all"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
