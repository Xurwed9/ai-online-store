import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { products as productsApi, categories as categoriesApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import Modal from '../components/Modal'
import { Search, Plus, Pencil, Trash2, Package } from 'lucide-react'

const empty = { name: '', description: '', price: '', color: '', size: '', stock: 0, image_url: '', category_id: '' }

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = query ? await productsApi.search(query) : await productsApi.getAll()
      setItems(r.data)
    } catch { toast.error('Failed to load products') }
  }, [query])

  useEffect(() => { categoriesApi.getAll().then(r => setCats(r.data)).catch(() => {}) }, [])
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const openCreate = () => { setEditId(null); setForm(empty); setModal(true) }
  const openEdit = (p) => { setEditId(p.id); setForm({ name: p.name, description: p.description || '', price: p.price, color: p.color || '', size: p.size || '', stock: p.stock, image_url: p.image_url || '', category_id: p.category_id }); setModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0, category_id: parseInt(form.category_id), description: form.description || null, color: form.color || null, size: form.size || null, image_url: form.image_url || null }
    try {
      if (editId) { await productsApi.update(editId, body); toast.success('Product updated') }
      else { await productsApi.create(body); toast.success('Product created') }
      setModal(false); load()
    } catch (err) { toast.error(err?.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await productsApi.delete(id); toast.success('Product deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const input = "w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] focus:bg-surface placeholder:text-text-muted"
  const getCatName = (id) => cats.find(c => c.id === id)?.name || ''

  return (
    <div className="flex-1 px-8 py-10 max-w-[1100px] mx-auto w-full">
      <div className="flex justify-between items-center mb-7 flex-wrap gap-4 animate-[slideUp_0.4s_ease]">
        <h1 className="font-display text-[26px] tracking-tight">Products</h1>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-2 bg-surface border border-border rounded-xl text-[13px] text-text outline-none w-[220px] transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)]" />
          </div>
          {isAdmin && <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"><Plus size={15} />Add</button>}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-text-muted"><Package size={44} className="mx-auto mb-3.5 opacity-50" /><p>No products found</p></div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 animate-[slideUp_0.5s_ease]">
          {items.map(p => (
            <div key={p.id} className="bg-surface border border-border rounded-2xl overflow-hidden transition-all hover:border-border-strong hover:shadow-lg hover:-translate-y-0.5 flex flex-col">
              <Link to={`/products/${p.id}`} className="block no-underline text-text">
                <div className="w-full h-[260px] bg-bg-warm relative overflow-hidden">
                  {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.04]" onError={e => { e.target.style.display = 'none' }} /> : <div className="w-full h-full flex items-center justify-center text-4xl opacity-30"><Package size={44} /></div>}
                  {getCatName(p.category_id) && <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-surface/90 border border-border text-text-secondary backdrop-blur-sm">{getCatName(p.category_id)}</span>}
                </div>
                <div className="p-4.5 flex flex-col flex-1">
                  <div className="text-[15px] font-semibold tracking-tight mb-1">{p.name}</div>
                  <div className="text-[13px] text-text-muted leading-relaxed mb-3">{p.description || 'No description'}</div>
                  {(p.color || p.size) && <div className="flex gap-1.5 mb-2.5 flex-wrap">{p.color && <span className="text-[11px] px-2 py-0.5 rounded-md bg-bg border border-border text-text-secondary">{p.color}</span>}{p.size && <span className="text-[11px] px-2 py-0.5 rounded-md bg-bg border border-border text-text-secondary">{p.size}</span>}</div>}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-text">${Number(p.price).toFixed(2)}</span>
                    <span className="text-[11px] text-text-muted px-2 py-0.5 rounded-md bg-bg">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
                  </div>
                </div>
              </Link>
              {isAdmin && <div className="px-4.5 pb-4.5 flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface border border-border text-text text-xs font-medium cursor-pointer hover:bg-bg hover:border-border-strong transition-all"><Pencil size={13} />Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red/10 border border-red/15 text-red text-xs font-medium cursor-pointer hover:bg-red/15 transition-all"><Trash2 size={13} />Delete</button>
              </div>}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSave} className="space-y-3.5">
          <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Name</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} /></div>
          <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={input} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Price ($)</label><input type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={input} /></div>
            <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Stock</label><input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className={input} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Color</label><input type="text" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className={input} placeholder="e.g. Black" /></div>
            <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Size</label><input type="text" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} className={input} placeholder="e.g. M" /></div>
          </div>
          <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Image URL</label><input type="text" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className={input} placeholder="https://..." /></div>
          <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Category</label>
            <select required value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={input + ' cursor-pointer'}>
              <option value="">Select category...</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2.5 mt-5">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface border border-border text-text text-sm font-medium cursor-pointer hover:bg-bg transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer hover:shadow-md transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
