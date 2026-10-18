import { useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { formatCHF } from '../config/store.js'

// Confirmation discrète après un VRAI ajout au panier (quand le panier reste fermé).
export default function AddedToast() {
  const { addedAt, drawerOpen, offer, openDrawer } = useCart()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!addedAt || drawerOpen) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2800)
    return () => clearTimeout(t)
  }, [addedAt, drawerOpen])

  if (!visible || !offer || drawerOpen) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[55] mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl border border-line bg-surface p-3 pl-4 shadow-[0_12px_40px_rgba(23,42,32,0.16)]"
    >
      <CheckCircle2 size={22} className="flex-none text-forest" />
      <p className="flex-1 text-sm text-ink">
        <span className="font-semibold">Ajouté au panier</span>
        <span className="block text-xs text-muted">
          {offer.label} · {offer.washes} lavages · {formatCHF(offer.price)}
        </span>
      </p>
      <button
        onClick={() => {
          setVisible(false)
          openDrawer()
        }}
        className="h-10 flex-none rounded-full bg-forest px-4 text-xs font-bold text-white hover:bg-forest-700"
      >
        Voir le panier
      </button>
    </div>
  )
}
