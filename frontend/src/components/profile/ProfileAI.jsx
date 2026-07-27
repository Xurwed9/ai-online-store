import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Sparkles, Send, TrendingUp, Package, Tag, ShoppingCart, BarChart3, Lightbulb } from 'lucide-react'
import { chat as chatApi } from '../../api/client'

export default function ProfileAI() {
  const { t } = useTranslation('profile')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('ai.welcome') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef(null)

  const suggestions = [
    { icon: TrendingUp, labelKey: 'ai.recommend_products', promptKey: 'ai.recommend_products_prompt' },
    { icon: Package, labelKey: 'ai.track_order', promptKey: 'ai.track_order_prompt' },
    { icon: Tag, labelKey: 'ai.show_discounts', promptKey: 'ai.show_discounts_prompt' },
    { icon: ShoppingCart, labelKey: 'ai.find_similar', promptKey: 'ai.find_similar_prompt' },
    { icon: BarChart3, labelKey: 'ai.summarize_purchases', promptKey: 'ai.summarize_purchases_prompt' },
    { icon: Lightbulb, labelKey: 'ai.style_suggestions', promptKey: 'ai.style_suggestions_prompt' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setShowSuggestions(false)
    setLoading(true)

    try {
      const res = await chatApi.send([...messages, userMsg].map(m => ({ role: m.role, content: m.content })))
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response || res.data.message || t('ai.received') }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: t('ai.error') }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="rounded-2xl overflow-hidden mb-8"
      style={{
        background: 'var(--profile-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--profile-glass-border)',
      }}
    >
      {/* Header */}
      <div className="p-5 flex items-center gap-3 border-b border-border">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
          <Sparkles size={17} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-text">{t('ai.title')}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-green" /> {t('ai.online')}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[320px] overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed"
                style={msg.role === 'user' ? {
                  background: 'linear-gradient(135deg, #ff7850, #ff6340)',
                  color: '#fff',
                  borderBottomRightRadius: '4px',
                } : {
                  background: 'var(--profile-input-bg)',
                  border: '1px solid var(--profile-input-border)',
                  color: 'var(--color-text-secondary)',
                  borderBottomLeftRadius: '4px',
                }}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'var(--profile-input-bg)', borderBottomLeftRadius: '4px' }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-5 pb-3">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug, i) => {
              const SugIcon = sug.icon
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => send(t(sug.promptKey))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-all glass-btn text-text-secondary"
                >
                  <SugIcon size={12} className="text-accent" />
                  {t(sug.labelKey)}
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t('ai.input_placeholder')}
            className="flex-1 px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all focus:ring-2 focus:ring-accent/20"
            style={{
              background: 'var(--profile-input-bg)',
              border: '1px solid var(--profile-input-border)',
              color: 'var(--color-text)',
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shrink-0 border-none"
            style={{
              background: input.trim() ? 'linear-gradient(135deg, #ff7850, #ff6340)' : 'var(--profile-input-bg)',
              color: input.trim() ? '#fff' : 'var(--color-text-muted)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
