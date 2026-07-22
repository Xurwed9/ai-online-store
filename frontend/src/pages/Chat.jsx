import { useState, useRef, useEffect } from 'react'
import { chat as chatApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'

const WELCOME = {
  role: 'assistant',
  content: 'Привет! Я AI-ассистент магазина. Помогу найти товары, узнать о наличии и ценах. Опишите, что вы ищете!',
}

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const payload = history.map(m => ({ role: m.role, content: m.content }))
      const { data } = await chatApi.send(payload)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Ошибка AI-ассистента')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Извините, произошла ошибка. Попробуйте ещё раз.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const bubble = (msg) => {
    const isUser = msg.role === 'user'
    return (
      <div key={msg.id || msg.content} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} animate-[slideUp_0.3s_ease]`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-text text-bg' : 'bg-accent text-white'}`}>
          {isUser ? <User size={14} /> : <Bot size={14} />}
        </div>
        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-text text-bg rounded-br-md' : 'bg-surface border border-border text-text rounded-bl-md'}`}>
          {msg.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col max-w-[700px] mx-auto w-full h-[calc(100vh-52px)]">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map(bubble)}
        {loading && (
          <div className="flex gap-2.5 animate-[slideUp_0.3s_ease]">
            <div className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center flex-shrink-0"><Bot size={14} /></div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface border border-border">
              <Loader2 size={16} className="animate-spin text-text-muted" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 pb-5 pt-2 border-t border-border bg-bg/80 backdrop-blur-xl">
        <div className="flex gap-2.5 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Опишите, что вы ищете..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 bg-surface border border-border rounded-xl text-[13px] text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] placeholder:text-text-muted max-h-[120px]"
            style={{ minHeight: '42px' }}
            onInput={e => { e.target.style.height = '42px'; e.target.style.height = e.target.scrollHeight + 'px' }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-[42px] h-[42px] rounded-xl bg-text text-bg flex items-center justify-center cursor-pointer hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
