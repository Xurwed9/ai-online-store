import axios from 'axios'

const api = axios.create({ baseURL: '/auth', headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  register: (data) => api.post('/register', data),
  login: (username, password) => {
    const body = new URLSearchParams({ username, password })
    return axios.post('/auth/login', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get('/me'),
  logout: () => api.post('/logout'),
  verifyEmail: (data) => api.post('/verify-email', data),
  dashboard: () => api.get('/admin-dashboard'),
}

export const products = {
  getAll: () => axios.get('/products/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
  getOne: (id) => axios.get(`/products/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
  search: (q) => axios.get(`/products/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
  getByCategory: (id) => axios.get(`/products/category/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
  create: (data) => axios.post('/products/', data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }),
  update: (id, data) => axios.put(`/products/${id}`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }),
  delete: (id) => axios.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
}

export const categories = {
  getAll: () => axios.get('/categories/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
  getOne: (id) => axios.get(`/categories/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
  create: (data) => axios.post('/categories/', data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }),
  update: (id, data) => axios.put(`/categories/${id}`, data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } }),
  delete: (id) => axios.delete(`/categories/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }),
}

const token = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
const tokenJson = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' } })

export const cart = {
  getAll: () => axios.get('/cart/', token()),
  add: (data) => axios.post('/cart/', data, tokenJson()),
  update: (id, data) => axios.put(`/cart/${id}`, data, tokenJson()),
  remove: (id) => axios.delete(`/cart/${id}`, token()),
  clear: () => axios.delete('/cart/', token()),
}

export const orders = {
  create: () => axios.post('/orders/', {}, token()),
  getAll: () => axios.get('/orders/', token()),
  getAllAdmin: () => axios.get('/orders/all', token()),
  getOne: (id) => axios.get(`/orders/${id}`, token()),
  cancel: (id) => axios.post(`/orders/${id}/cancel`, {}, token()),
  updateStatus: (id, status) => axios.put(`/orders/${id}/status`, { status }, tokenJson()),
  pendingCount: () => axios.get('/orders/pending-count', token()),
}

export const payments = {
  create: (data) => axios.post('/payments/', data, tokenJson()),
  getAll: () => axios.get('/payments/', token()),
  getAllAdmin: () => axios.get('/payments/all', token()),
  getOne: (id) => axios.get(`/payments/${id}`, token()),
}

export const chat = {
  send: (messages) => axios.post('/chat/', { messages }, tokenJson()),
}

export default api
