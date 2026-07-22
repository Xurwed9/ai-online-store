import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      auth.me().then(res => {
        setUser({ ...res.data, token })
      }).catch(() => {
        localStorage.removeItem('token')
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const register = async (data) => {
    const res = await auth.register(data)
    return res.data
  }

  const login = async (username, password) => {
    const res = await auth.login(username, password)
    localStorage.setItem('token', res.data.access_token)
    const me = await auth.me()
    setUser({ ...me.data, token: res.data.access_token })
    return res.data
  }

  const logout = async () => {
    try { await auth.logout() } catch (_) {}
    localStorage.removeItem('token')
    setUser(null)
  }

  const verifyEmail = async (data) => {
    const res = await auth.verifyEmail(data)
    return res.data
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, verifyEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
