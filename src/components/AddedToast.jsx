import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useI18n } from '../i18n/index.jsx'
import { usePresence } from '../lib/motion.js'

// Confirmation discrète après un VRAI ajout au panier (quand le panier reste fermé).
export default function AddedToast() {
  const { addedAt, drawerOpen, offer, openDrawer } = useCart()
  const { t, local } = useI18n()
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

  const show = Boolean(visible && offer && !drawerOpen && !pathname.startsWith('/checkout'))
  // Garde la dernière offre affichée pendant le fondu de sortie.
  const last = useRef(offer)
  if (offer) last.current = offer
  const { mounted, leaving } = usePresence(show)
  if (!mounted || !last.current) return null
  const shownOffer = last.current

  return (
    <div
      role="status"
      inert={leaving ? '' : undefined}
      className={`fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-[55] mx-auto flex max-w-md ${leaving ? 'pointer-events-none animate-toast-out' : 'animate-toast-in'} items-center gap-3 rounded-2xl border border-fr-line bg-white p-3 pl-4 font-jakarta shadow-[0_12px_40px_rgba(11,61,42,0.16)]`}
    >
      <CheckCircle2 size={22} className="flex-none text-fr-green" />
      <p className="flex-1 text-sm text-fr-ink">
        <span className="font-semibold">{t.toast.added}</span>
        <span className="block text-xs text-fr-muted">
          {t.toast.line(shownOffer.packs, shownOffer.washes, local(shownOffer.price))}
        </span>
      </p>
      <button
        onClick={() => {
          setVisible(false)
          openDrawer()
        }}
        className="h-10 flex-none rounded-full bg-fr-green px-4 text-xs font-bold text-white transition-[background-color,transform] duration-base ease-out-soft hover:bg-[#0C6B3E] motion-safe:active:scale-[0.97]"
      >
        {t.toast.view}

      </button>
    </div>
  )
}
