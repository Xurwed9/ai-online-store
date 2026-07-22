import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Profile from './pages/Profile'
import Cart from './pages/Cart'
import ProductDetail from './pages/ProductDetail'
import Orders from './pages/Orders'
import Payments from './pages/Payments'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">Loading...</div></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">Loading...</div></div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/profile" replace />
  return children
}

function Guest({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">Loading...</div></div>
  return user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/products'} replace /> : children
}

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Guest><Login /></Guest>} />
        <Route path="/register" element={<Guest><Register /></Guest>} />
        <Route path="/verify-email" element={<Guest><VerifyEmail /></Guest>} />
        <Route path="/dashboard" element={<AdminOnly><Dashboard /></AdminOnly>} />
        <Route path="/products" element={<Protected><Products /></Protected>} />
        <Route path="/products/:id" element={<Protected><ProductDetail /></Protected>} />
        <Route path="/categories" element={<Protected><Categories /></Protected>} />
        <Route path="/cart" element={<Protected><Cart /></Protected>} />
        <Route path="/orders" element={<Protected><Orders /></Protected>} />
        <Route path="/payments" element={<Protected><Payments /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
