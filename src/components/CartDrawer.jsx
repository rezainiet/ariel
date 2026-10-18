import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, Truck, RotateCcw, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { PRODUCT, DELIVERY, formatCHF } from '../config/store.js'
import { IMAGES } from '../config/assets.js'
import ProductImage from './ui/ProductImage.jsx'
import Button from './ui/Button.jsx'

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, offer, hasItems, washes, total, clear } = useCart()
  const navigate = useNavigate()

  // Verrouille le scroll du body + fermeture à la touche Échap.
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && closeDrawer()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, closeDrawer])

  const goCheckout = () => {
    closeDrawer()
    navigate('/commande')
  }

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Panier">
      {/* Voile */}
      <button
        aria-label="Fermer le panier"
        onClick={closeDrawer}
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-fade-in"
      />

      {/* Panneau */}
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[26rem] flex-col bg-canvas shadow-2xl animate-drawer-in">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold tracking-tight text-ink">
            <ShoppingBag size={18} className="text-forest" /> Votre panier
          </h2>
          <button
            onClick={closeDrawer}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-sage/50 hover:text-forest"
          >
            <X size={20} />
          </button>
        </div>

        {!hasItems ? (
          // ── Panier vide ──
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/50 text-forest">
              <ShoppingBag size={26} strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-semibold text-ink">Votre panier est vide</p>
              <p className="mt-1 text-sm text-muted">
                Choisissez une offre pour commencer.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                closeDrawer()
                document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Voir les offres
            </Button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
              {/* Article */}
              <div className="flex gap-4 rounded-xl2 border border-line bg-surface p-4">
                <ProductImage
                  src={offer.image || IMAGES.packshot}
                  fit="contain"
                  alt="Ariel All-in-1 PODS"
                  ratio="1 / 1"
                  className="h-20 w-20 flex-none bg-white"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[0.95rem] font-semibold leading-tight text-ink">
                    {PRODUCT.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted">{offer.label}</p>
                  <p className="text-sm text-muted">{washes} lavages au total</p>
                  <p className="mt-2 text-base font-extrabold text-forest">
                    {formatCHF(offer.price)}
                  </p>
                </div>
              </div>

              <button
                onClick={clear}
                className="mt-3 text-xs font-medium text-muted underline-offset-2 hover:text-forest hover:underline"
              >
                Retirer l'article
              </button>

              {/* Réassurances */}
              <ul className="mt-6 space-y-2.5 text-sm text-ink/80">
                <li className="flex items-center gap-2.5">
                  <Truck size={16} className="text-forest" /> Livraison offerte en Suisse
                </li>
                <li className="flex items-center gap-2.5">
                  <RotateCcw size={16} className="text-forest" /> Retour possible sous{' '}
                  {DELIVERY.returnWindowDays} jours après réception
                </li>
              </ul>
            </div>

            {/* Récapitulatif + CTA */}
            <div className="border-t border-line bg-surface px-5 py-5">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>Sous-total</dt>
                  <dd>{formatCHF(offer.price)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Livraison</dt>
                  <dd className="font-semibold text-forest">Offerte</dd>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="text-base font-bold text-ink">Total</dt>
                  <dd className="text-xl font-extrabold text-forest">{formatCHF(total)}</dd>
                </div>
              </dl>

              <Button size="lg" fullWidth className="mt-4" onClick={goCheckout}>
                PASSER COMMANDE
                <ArrowRight size={18} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
