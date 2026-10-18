import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { formatCHF, getOffer } from '../../config/store.js'
import { PackStack } from './BuyBoxC.jsx'

// Barre d'achat mobile : apparaît quand les boutons du configurateur sortent de l'écran.
// Panier vide → reflète la sélection en cours ; panier rempli → reflète le panier.
export default function StickyBarC({ visible, sel }) {
  const { hasItems, offer: cartOffer, selectOffer, openDrawer, drawerOpen } = useCart()
  const navigate = useNavigate()
  const offer = hasItems ? cartOffer : getOffer(sel)
  const shown = visible && !drawerOpen

  const primary = () => {
    if (!hasItems) selectOffer(sel, { openDrawer: false, feedback: false })
    navigate('/commande')
  }

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 lg:hidden ${
        shown ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <button
          onClick={hasItems ? openDrawer : () => document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          tabIndex={shown ? 0 : -1}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex h-11 w-12 flex-none items-end justify-center max-[359px]:hidden">
            <PackStack packs={offer.packs} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold text-ink">
              {offer.packs} pack{offer.packs > 1 ? 's' : ''} <span className="font-medium text-muted">· {offer.washes} lav.</span>
            </span>
            <span className="block truncate text-xs text-forest underline underline-offset-2">
              {hasItems ? 'Voir le panier' : 'Changer'}
            </span>
          </span>
        </button>
        <button
          onClick={primary}
          tabIndex={shown ? 0 : -1}
          className="flex h-12 flex-none items-center gap-1.5 rounded-xl bg-forest px-4 text-sm font-extrabold text-white active:scale-[0.98]"
        >
          Commander {formatCHF(offer.price)} <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
