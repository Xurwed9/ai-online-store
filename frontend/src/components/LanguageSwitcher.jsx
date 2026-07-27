import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'tg', label: 'Тоҷикӣ', flag: '🇹🇯' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const changeLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('i18nLanguage', code)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
          border: '1px solid var(--color-border)', background: 'var(--color-surface)',
          color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
          transition: 'all 0.2s',
        }}
        title="Change language"
      >
        <Globe size={14} />
        <span>{currentLang.flag}</span>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 6, minWidth: 150,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 10, padding: 4, zIndex: 200, boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          }}
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => changeLang(lang.code)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px',
                borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: lang.code === i18n.language ? 600 : 400,
                background: lang.code === i18n.language ? 'rgba(255,120,80,0.08)' : 'transparent',
                color: lang.code === i18n.language ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                transition: 'all 0.15s', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 16 }}>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
