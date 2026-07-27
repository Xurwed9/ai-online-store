import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { favorites as favoritesApi } from '../api/client'
import { toast } from 'react-hot-toast'
import { Heart, Package, ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Favorites() {
  const { t } = useTranslation('orders')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const r = await favoritesApi.getAll()
      setItems(r.data)
    } catch { toast.error(t('favorites.load_failed')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (productId) => {
    try {
      await favoritesApi.remove(productId)
      toast.success(t('favorites.removed'))
      setItems(items.filter(i => i.product_id !== productId))
    } catch { toast.error(t('favorites.remove_failed')) }
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><div className="text-text-muted text-sm animate-pulse">{t('orders.loading')}</div></div>

  return (
    <div className="flex-1 px-8 py-10 max-w-[1100px] mx-auto w-full">
      <div className="flex justify-between items-center mb-7 animate-[slideUp_0.4s_ease]">
        <h1 className="font-display text-[26px] tracking-tight flex items-center gap-3">
          <Heart size={26} className="text-red fill-red" />
          {t('favorites.title')}
        </h1>
        <span className="text-[13px] text-text-muted">{t('common:items_count', { count: items.length })}</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-text-muted animate-[slideUp_0.5s_ease]">
          <Heart size={44} className="mx-auto mb-3.5 opacity-50" />
          <p className="text-sm mb-4">{t('favorites.empty')}</p>
          <Link to="/products" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-text text-bg text-sm font-semibold no-underline hover:shadow-md hover:-translate-y-0.5 transition-all">
            {t('favorites.browse')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4 animate-[slideUp_0.5s_ease]">
          {items.map(item => (
            <div key={item.id} className="bg-surface border border-border rounded-2xl overflow-hidden transition-all hover:border-border-strong hover:shadow-lg hover:-translate-y-0.5 flex flex-col">
              <Link to={`/products/${item.product_id}`} className="block no-underline text-text">
                <div className="w-full h-[260px] bg-bg-warm relative overflow-hidden">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.04]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted opacity-30"><Package size={44} /></div>
                  )}
                  <div className="absolute top-3 right-3">
                    <Heart size={20} className="text-red fill-red drop-shadow-sm" />
                  </div>
                </div>
                <div className="p-4.5 flex flex-col flex-1">
                  <div className="text-[15px] font-semibold tracking-tight mb-1">{item.product_name}</div>
                  <div className="text-[13px] text-text-muted leading-relaxed mb-3 line-clamp-2">{item.product_description || t('favorites.no_description')}</div>
                  {(item.product_color || item.product_size) && (
                    <div className="flex gap-1.5 mb-2.5 flex-wrap">
                      {item.product_color && <span className="text-[11px] px-2 py-0.5 rounded-md bg-bg border border-border text-text-secondary">{item.product_color}</span>}
                      {item.product_size && <span className="text-[11px] px-2 py-0.5 rounded-md bg-bg border border-border text-text-secondary">{item.product_size}</span>}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-text">${Number(item.product_price).toFixed(2)}</span>
                    {item.product_stock != null && (
                      <span className="text-[11px] text-text-muted px-2 py-0.5 rounded-md bg-bg">
                        {item.product_stock > 0 ? t('favorites.in_stock', { count: item.product_stock }) : t('favorites.out_of_stock')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              <div className="px-4.5 pb-4.5 flex gap-2">
                <Link to={`/products/${item.product_id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-text text-bg text-xs font-semibold no-underline hover:shadow-md transition-all">
                  <ShoppingCart size={13} />{t('common:view')}
                </Link>
                <button
                  onClick={() => handleRemove(item.product_id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red/10 border border-red/15 text-red text-xs font-medium cursor-pointer hover:bg-red/15 transition-all"
                >
                  <Trash2 size={13} />{t('common:remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
