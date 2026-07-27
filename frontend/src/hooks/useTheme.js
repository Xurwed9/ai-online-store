import { useState, useEffect, useCallback } from 'react'

export function useTheme() {
  const getTheme = () => document.documentElement.getAttribute('data-theme') || 'dark'

  const [theme, setThemeState] = useState(getTheme)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeState(getTheme())
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const isDark = theme === 'dark'

  const colors = {
    bg: isDark ? '#0D1325' : '#f8f7f4',
    bgWarm: isDark ? '#111827' : '#f0ede6',
    surface: isDark ? '#1a2038' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    borderHover: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)',
    text: isDark ? '#f4ecd8' : '#1a1814',
    textSecondary: isDark ? '#b8ad98' : '#6b6560',
    textMuted: isDark ? '#7a7168' : '#9e9890',
    accent: isDark ? '#ff7850' : '#e8643a',
    glass: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
    glassHover: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
    glassBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    glassBorderHover: isDark ? 'rgba(255,120,80,0.2)' : 'rgba(255,120,80,0.25)',
    inputBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    inputBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
    cardShadow: isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.08)',
    glowShadow: isDark ? '0 0 40px rgba(255,120,80,0.04)' : '0 0 40px rgba(255,120,80,0.06)',
    skeleton: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)',
    skeletonMid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  }

  return { theme, isDark, colors }
}
