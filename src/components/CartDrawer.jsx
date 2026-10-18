import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, Truck, RotateCcw, ArrowRight, Minus, Plus, MapPin } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { OFFERS, PRODUCT, DELIVERY, formatCHF, savingsFor } from '../config/store.js'
import { IMAGES } from '../config/assets.js'
import ProductImage from './ui/ProductImage.jsx'
import Button from './ui/Button.jsx'
import { PackStack } from '../concepts/c/BuyBoxC.jsx'

// Habillage par concept : même logique panier, identité visuelle cohérente avec la page.
const SKINS = {
  base: {
    panel: 'bg-canvas',
    head: 'border-b border-line',
    title: 'font-extrabold text-ink',
    icon: 'text-forest',
    close: 'text-muted hover:bg-sage/50 hover:text-forest',
    display: 'font-extrabold text-forest',
    cta: 'rounded-full bg-forest text-white hover:bg-forest-700',
    foot: 'bg-surface',
  },
  a: {
    panel: 'bg-ivory',
    head: 'border-b border-hair',
    title: 'font-serif text-xl font-medium text-ink',
    icon: 'text-forest',
    close: 'text-muted hover:bg-sand hover:text-forest',
    display: 'font-serif font-medium text-forest',
    cta: 'rounded-full bg-forest text-white hover:bg-forest-700',
    foot: 'bg-white',
  },
  b: {
    panel: 'bg-mist',
    head: 'bg-night',
    title: 'font-grotesk font-bold text-white',
    icon: 'text-pollen',
    close: 'text-white/70 hover:bg-white/10 hover:text-white',
    display: 'font-grotesk font-bold text-night',
    cta: 'rounded-full bg-pollen font-grotesk text-night hover:bg-night hover:text-white',
    foot: 'bg-white',
  },
  c: {
    panel: 'bg-white',
    head: 'border-b border-line',
    title: 'font-extrabold text-ink',
    icon: 'text-forest',
    close: 'text-muted hover:bg-cloud hover:text-forest',
    display: 'font-extrabold text-forest',
    cta: 'rounded-xl bg-forest text-white hover:bg-forest-700',
    foot: 'bg-cloud',
  },
}

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, offer, hasItems, washes, total, clear, changeOffer, skin } = useCart()
  // La boutique (Concept C) est l'habillage par défaut ; A et B imposent le leur.
  const S = SKINS[skin] || SKINS.c
  const navigate = useNavigate()
  const closeRef = useRef(null)

  // Verrouille le scroll du body, focus initial, fermeture à la touche Échap.
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
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

  // Stepper : passe d'un bundle à l'autre (1 ↔ 2 ↔ 3 packs), prix de bundle conservés.
  const idx = offer ? OFFERS.findIndex((o) => o.id === offer.id) : -1
  const step = (d) => {
    const next = OFFERS[idx + d]
    if (next) changeOffer(next.id)
  }

  if (!drawerOpen) return null
  const saving = offer ? savingsFor(offer) : 0

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Panier">
      <button
        aria-label="Fermer le panier"
        tabIndex={-1}
        onClick={closeDrawer}
        className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]"
      />

      <div className={`absolute inset-y-0 right-0 flex w-full max-w-[28rem] animate-drawer-in flex-col shadow-2xl ${S.panel}`}>
        <div className={`flex items-center justify-between px-5 py-4 ${S.head}`}>
          <h2 className={`flex items-center gap-2 text-base tracking-tight ${S.title}`}>
            <ShoppingBag size={18} className={S.icon} /> Votre panier
            {hasItems && (
              <span className="rounded-full bg-sage px-2 py-0.5 text-[0.7rem] font-bold text-forest">
                {offer.packs} pack{offer.packs > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <button
            ref={closeRef}
            onClick={closeDrawer}
            aria-label="Fermer"
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${S.close}`}
          >
            <X size={20} />
          </button>
        </div>

        {!hasItems ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/50 text-forest">
              <ShoppingBag size={26} strokeWidth={1.6} />
            </span>
            <div>
              <p className="font-semibold text-ink">Votre panier est vide</p>
              <p className="mt-1 text-sm text-muted">Choisissez une offre pour commencer.</p>
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
              <div className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex gap-4">
                  {S === SKINS.c ? (
                    // Boutique : même pile de sachets réels que le configurateur
                    <span
                      className="flex h-24 w-24 flex-none items-end justify-center rounded-xl bg-sand/70 pb-2"
                      role="img"
                      aria-label={`${PRODUCT.name} — ${offer.label}`}
                    >
                      <PackStack packs={offer.packs} />
                    </span>
                  ) : (
                    <ProductImage
                      src={offer.image || IMAGES.packshot}
                      fit="contain"
                      alt={`${PRODUCT.name} — ${offer.label}`}
                      ratio="1 / 1"
                      className="h-24 w-24 flex-none bg-white"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[0.98rem] font-bold leading-tight text-ink">{PRODUCT.name}</h3>
                    <p className="mt-0.5 text-sm text-muted">
                      {offer.packs} × 60 capsules · {washes} lavages
                    </p>
                    <p className={`mt-2 text-xl tabular-nums ${S.display}`}>{formatCHF(offer.price)}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm font-medium text-ink">Nombre de packs</span>
                  <div className="flex items-center rounded-full border border-line bg-canvas">
                    <button
                      onClick={() => step(-1)}
                      disabled={idx <= 0}
                      aria-label="Un pack de moins"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-sage/60 disabled:opacity-30"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-base font-bold tabular-nums text-ink" aria-live="polite">
                      {offer.packs}
                    </span>
                    <button
                      onClick={() => step(1)}
                      disabled={idx >= OFFERS.length - 1}
                      aria-label="Un pack de plus"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-sage/60 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {saving > 0 && (
                  <p className="mt-3 rounded-lg bg-sage/50 px-3 py-2 text-xs font-medium text-forest">
                    Vous économisez {formatCHF(saving)} par rapport à {offer.packs} packs achetés séparément.
                  </p>
                )}
              </div>

              <button
                onClick={clear}
                className="mt-3 text-xs font-medium text-muted underline-offset-2 hover:text-forest hover:underline"
              >
                Retirer l'article
              </button>

              <ul className="mt-6 space-y-3 text-sm text-ink/80">
                <li className="flex items-center gap-2.5">
                  <Truck size={16} className="flex-none text-forest" /> Livraison offerte · estimée sous{' '}
                  {DELIVERY.estimateDays} jours ouvrables
                </li>
                <li className="flex items-center gap-2.5">
                  <MapPin size={16} className="flex-none text-forest" /> Expédié depuis notre stock en{' '}
                  {DELIVERY.dispatchLocation}
                </li>
                <li className="flex items-center gap-2.5">
                  <RotateCcw size={16} className="flex-none text-forest" /> Retour possible sous{' '}
                  {DELIVERY.returnWindowDays} jours après réception
                </li>
              </ul>
            </div>

            <div className={`border-t border-line px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 ${S.foot}`}>
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>Sous-total</dt>
                  <dd className="tabular-nums">{formatCHF(offer.price)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Livraison</dt>
                  <dd className="font-semibold text-forest">Offerte</dd>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="text-base font-bold text-ink">Total</dt>
                  <dd className={`text-2xl tabular-nums ${S.display}`}>{formatCHF(total)}</dd>
                </div>
              </dl>

              <button
                onClick={goCheckout}
                className={`mt-4 flex h-14 w-full items-center justify-center gap-2 text-base font-bold tracking-tight transition-all duration-200 active:scale-[0.99] ${S.cta}`}
              >
                PASSER COMMANDE
                <ArrowRight size={18} />
              </button>
              <button
                onClick={closeDrawer}
                className="mt-2 w-full py-2 text-center text-sm font-medium text-muted hover:text-forest"
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
