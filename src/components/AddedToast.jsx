import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { formatCHF } from '../config/store.js'

// Confirmation discrète après un VRAI ajout au panier (quand le panier reste fermé).
export default function AddedToast() {
  const { addedAt, drawerOpen, offer, openDrawer } = useCart()
  const [visible, setVisible] = useState(false)
  const { pathname } = useLocation()
  const drawerRef = useRef(drawerOpen)
  drawerRef.current = drawerOpen

  // Uniquement pour un ajout fait panier FERMÉ (le panier ouvert confirme déjà l'ajout) ;
  // jamais sur la page de commande.
  useEffect(() => {
    if (!addedAt || drawerRef.current) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 2800)
    return () => clearTimeout(t)
  }, [addedAt])

  if (!visible || !offer || drawerOpen || pathname.startsWith('/checkout')) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[55] mx-auto flex max-w-md animate-fade-up items-center gap-3 rounded-2xl border border-fr-line bg-white p-3 pl-4 font-jakarta shadow-[0_12px_40px_rgba(11,61,42,0.16)]"
    >
      <CheckCircle2 size={22} className="flex-none text-fr-green" />
      <p className="flex-1 text-sm text-fr-ink">
        <span className="font-semibold">Ajouté au panier</span>
        <span className="block text-xs text-fr-muted">
          {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules · {formatCHF(offer.price)}
        </span>
      </p>
      <button
        onClick={() => {
          setVisible(false)
          openDrawer()
        }}
        className="h-10 flex-none rounded-full bg-fr-green px-4 text-xs font-bold text-white hover:bg-[#0C6B3E]"
      >
        Voir le panier
      </button>
    </div>
  )
}
