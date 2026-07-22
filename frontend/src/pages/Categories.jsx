import { useEffect, useState } from 'react'
import { categories as categoriesApi, products as productsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import Modal from '../components/Modal'
import { Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'

export default function Categories() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [prods, setProds] = useState([])
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [c, p] = await Promise.all([categoriesApi.getAll(), productsApi.getAll()])
      setItems(c.data); setProds(p.data)
    } catch { toast.error('Failed to load categories') }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditId(null); setForm({ name: '', description: '' }); setModal(true) }
  const openEdit = (c) => { setEditId(c.id); setForm({ name: c.name, description: c.description || '' }); setModal(true) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const body = { ...form, description: form.description || null, is_active: true }
    try {
      if (editId) { await categoriesApi.update(editId, body); toast.success('Category updated') }
      else { await categoriesApi.create(body); toast.success('Category created') }
      setModal(false); load()
    } catch (err) { toast.error(err?.response?.data?.detail || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try { await categoriesApi.delete(id); toast.success('Category deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const input = "w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm text-text outline-none transition-all focus:border-accent focus:shadow-[0_0_0_3px_rgba(196,93,62,.12)] focus:bg-surface placeholder:text-text-muted"

  return (
    <div className="flex-1 px-8 py-10 max-w-[1100px] mx-auto w-full">
      <div className="flex justify-between items-center mb-7 animate-[slideUp_0.4s_ease]">
        <h1 className="font-display text-[26px] tracking-tight">Categories</h1>
        {isAdmin && <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"><Plus size={15} />Add</button>}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-text-muted"><FolderOpen size={44} className="mx-auto mb-3.5 opacity-50" /><p>No categories yet</p></div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 animate-[slideUp_0.5s_ease]">
          {items.map(c => {
            const count = prods.filter(p => p.category_id === c.id).length
            return (
              <div key={c.id} className="bg-surface border border-border rounded-2xl p-6 transition-all hover:border-border-strong hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-accent before:to-green before:opacity-0 hover:before:opacity-100 before:transition-opacity">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-display text-lg">{c.name}</div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${c.is_active ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="text-[13px] text-text-muted leading-relaxed mb-3.5">{c.description || 'No description'}</div>
                <div className="text-xs text-text-secondary mb-4"><span className="text-accent font-semibold">{count}</span> products</div>
                {isAdmin && <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface border border-border text-text text-xs font-medium cursor-pointer hover:bg-bg hover:border-border-strong transition-all"><Pencil size={13} />Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red/10 border border-red/15 text-red text-xs font-medium cursor-pointer hover:bg-red/15 transition-all"><Trash2 size={13} />Delete</button>
                </div>}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSave} className="space-y-3.5">
          <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Name</label><input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={input} /></div>
          <div><label className="block text-[13px] font-medium text-text-secondary mb-1.5">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={input} /></div>
          <div className="flex gap-2.5 mt-5">
            <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl bg-surface border border-border text-text text-sm font-medium cursor-pointer hover:bg-bg transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer hover:shadow-md transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
