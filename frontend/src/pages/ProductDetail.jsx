import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { products as productsApi, cart as cartApi, categories as categoriesApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ShoppingCart, Package, Minus, Plus, Check } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await productsApi.getOne(id)
        setProduct(r.data)
        if (r.data.category_id) {
          const c = await categoriesApi.getOne(r.data.category_id)
          setCategory(c.data)
        }
      } catch { toast.error('Product not found') }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  const handleAddToCart = async () => {
    setAdding(true)
    try {
      await cartApi.add({ product_id: product.id, quantity: qty })
      setAdded(true)
      toast.success(`Added ${qty} to cart`)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add')
    } finally { setAdding(false) }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">Loading...</div></div>
  if (!product) return <div className="flex-1 flex items-center justify-center text-text-muted">Product not found</div>

  return (
    <div className="flex-1 px-8 py-10 max-w-[1000px] mx-auto w-full">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary no-underline hover:text-accent mb-6 transition-colors animate-[slideUp_0.3s_ease]">
        <ArrowLeft size={15} />Back to Products
      </Link>

      <div className="grid grid-cols-[1fr_1fr] gap-10 animate-[slideUp_0.4s_ease]">
        <div className="bg-bg-warm rounded-2xl overflow-hidden aspect-square">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted opacity-30"><Package size={64} /></div>
          )}
        </div>

        <div className="flex flex-col py-2">
          {category && (
            <span className="inline-flex self-start px-2.5 py-1 rounded-md text-[11px] font-semibold bg-accent/10 text-accent border border-accent/15 mb-3">{category.name}</span>
          )}
          <h1 className="font-display text-[32px] leading-tight mb-3">{product.name}</h1>
          <p className="text-[15px] text-text-secondary leading-relaxed mb-6">{product.description || 'No description available.'}</p>

          <div className="flex flex-wrap gap-2 mb-5">
            {product.color && <span className="text-[12px] px-3 py-1 rounded-lg bg-bg border border-border text-text-secondary">{product.color}</span>}
            {product.size && <span className="text-[12px] px-3 py-1 rounded-lg bg-bg border border-border text-text-secondary">Size: {product.size}</span>}
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-display text-[36px]">${Number(product.price).toFixed(2)}</span>
          </div>
          <p className="text-[13px] text-text-muted mb-8">
            {product.stock > 0 ? <span className="text-green">{product.stock} in stock</span> : <span className="text-red">Out of stock</span>}
          </p>

          {!isAdmin && product.stock > 0 && (
            <div className="mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[13px] text-text-secondary">Quantity</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center cursor-pointer hover:bg-border transition-all"><Minus size={14} /></button>
                  <span className="w-10 text-center font-medium">{qty}</span>
                  <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center cursor-pointer hover:bg-border transition-all"><Plus size={14} /></button>
                </div>
              </div>
              <button onClick={handleAddToCart} disabled={adding} className="w-full py-3.5 rounded-xl bg-text text-bg text-sm font-semibold cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2">
                {added ? <><Check size={16} />Added!</> : <><ShoppingCart size={16} />Add to Cart</>}
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="mt-auto p-4 rounded-xl bg-bg border border-border">
              <p className="text-[13px] text-text-muted">Admin view — product management available on <Link to="/products" className="text-accent no-underline">Products page</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
