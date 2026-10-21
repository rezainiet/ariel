import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, Truck, RotateCcw, ArrowRight, Minus, Plus, MapPin, CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { OFFERS, PRODUCT, DELIVERY, MERCHANT, formatCHF, savingsFor } from '../config/store.js'
import { IMAGES } from '../config/assets.js'
import ProductImage from './ui/ProductImage.jsx'
import Button from './ui/Button.jsx'
import { PackStack } from '../concepts/c/BuyBoxC.jsx'
import { useStock, isSoldOut } from '../lib/stock.js'
import { usePresence, Swap } from '../lib/motion.js'

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
  // Boutique « Frais » (approuvée) : blanc, menthe, Plus Jakarta Sans, boutons pilule verts.
  f: {
    panel: 'bg-white font-jakarta',
    head: 'border-b border-fr-line',
    title: 'font-jakarta text-lg font-extrabold tracking-[-0.02em] text-fr-ink',
    icon: 'text-fr-green',
    close: 'text-fr-muted hover:bg-fr-mint hover:text-fr-green',
    display: 'font-jakarta font-extrabold tracking-[-0.03em] text-fr-green',
    cta: 'rounded-full bg-fr-green text-white shadow-[0_12px_26px_rgba(14,122,71,0.28)] hover:bg-[#0C6B3E]',
    foot: 'bg-fr-soft',
    card: 'border-fr-line bg-white',
    sentenceCta: true,
    stack: true,
  },
  // Concept C (comparaison) : ivoire, serif.
  c: {
    panel: 'bg-ivory',
    head: 'border-b border-hair',
    title: 'font-serif text-xl font-medium text-ink',
    icon: 'text-forest',
    close: 'text-muted hover:bg-sand hover:text-forest',
    display: 'font-serif font-medium text-forest',
    cta: 'rounded-xl bg-forest text-white hover:bg-forest-700',
    foot: 'bg-sand/60',
    card: 'border-hair bg-white',
    sentenceCta: true,
    stack: true,
  },
}

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, offer, hasItems, washes, total, clear, changeOffer, skin, addedAt } = useCart()
  // La boutique (Frais) est l'habillage par défaut ; les concepts de comparaison imposent le leur.
  const S = SKINS[skin] || SKINS.f
  const stock = useStock()
  const navigate = useNavigate()
  const closeRef = useRef(null)
  const panelRef = useRef(null)
  // Reste monté le temps de glisser hors de l'écran (immédiat si mouvement réduit).
  const { mounted, leaving } = usePresence(drawerOpen)
  // Ouvert juste après un ajout : courte confirmation d'ajout (le panier, pas la commande).
  const justAdded = useMemo(() => drawerOpen && Date.now() - addedAt < 1500, [drawerOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Verrouille le scroll du body, focus initial, Échap, Tab gardé dans le panier ;
  // à la fermeture, le focus revient sur le bouton qui l'a ouvert.
  useEffect(() => {
    if (!drawerOpen) return
    const opener = document.activeElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') return closeDrawer()
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])')]
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true })
    }
  }, [drawerOpen, closeDrawer])

  const goCheckout = () => {
    closeDrawer()
    navigate('/checkout')
  }

  // Stepper : passe d'un bundle à l'autre (1 ↔ 2 ↔ 3 packs), prix de bundle conservés.
  const idx = offer ? OFFERS.findIndex((o) => o.id === offer.id) : -1
  const step = (d) => {
    const next = OFFERS[idx + d]
    if (next) changeOffer(next.id)
  }

  if (!mounted) return null
  const saving = offer ? savingsFor(offer) : 0
  const soldOut = Boolean(offer) && isSoldOut(stock, offer.id)

  return (
    <div className={`fixed inset-0 z-[60] ${leaving ? 'pointer-events-none' : ''}`} role="dialog" aria-modal="true" aria-label="Panier" inert={leaving ? '' : undefined}>
      <button
        aria-label="Fermer le panier"
        tabIndex={-1}
        onClick={closeDrawer}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] ${leaving ? 'animate-fade-out' : 'animate-fade-in'}`}
      />

      <div
        ref={panelRef}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[28rem] flex-col shadow-2xl ${leaving ? 'animate-drawer-out' : 'animate-drawer-in'} ${S.panel}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 ${S.head}`}>
          <h2 className={`flex items-center gap-2 text-base tracking-tight ${S.title}`}>
            <ShoppingBag size={18} className={S.icon} /> Votre panier
            {hasItems && (
              <span className="rounded-full bg-sage px-2 py-0.5 font-sans text-[0.7rem] font-bold text-forest">
                {offer.packs} sachet{offer.packs > 1 ? 's' : ''}
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
              <p className="mt-1 text-sm text-muted">Choisissez votre offre Ariel All‑in‑1 PODS pour commencer.</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                closeDrawer()
                const el = document.getElementById('offres')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                else navigate('/#offres')
              }}
            >
              Voir les offres
            </Button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
              {justAdded && (
                <p role="status" className="mb-3 flex animate-reveal-down items-center gap-2 rounded-xl bg-fr-mint px-3 py-2 text-[0.84rem] font-semibold text-fr-deep [animation-delay:180ms]">
                  <CheckCircle2 size={17} className="flex-none animate-pop text-fr-green [animation-delay:260ms]" aria-hidden="true" />
                  Ajouté au panier
                </p>
              )}
              <div className={`rounded-2xl border p-4 ${S.card || 'border-line bg-surface'}`}>
                <div className="flex gap-4">
                  {S.stack ? (
                    // Boutique : même pile de sachets réels que le configurateur
                    <span
                      className={`flex h-24 w-24 flex-none items-end justify-center rounded-xl pb-2 ${S === SKINS.f ? 'bg-fr-mint' : 'bg-sand/70'}`}
                      role="img"
                      aria-label={`${PRODUCT.name} — ${offer.label}`}
                    >
                      <Swap value={offer.id} anim="animate-fade-in" className={`flex ${justAdded ? 'animate-toast-in [animation-delay:120ms]' : ''}`}>
                        <PackStack packs={offer.packs} />
                      </Swap>
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
                    <Swap value={offer.id} as="p" className={`mt-2 text-xl tabular-nums ${S.display}`}>{formatCHF(offer.price)}</Swap>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="text-sm font-medium text-ink">Nombre de sachets</span>
                  <div className="flex items-center rounded-full border border-line bg-canvas">
                    <button
                      onClick={() => step(-1)}
                      disabled={idx <= 0}
                      aria-label="Un sachet de moins"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-forest transition-[background-color,transform,opacity] duration-base ease-out-soft hover:bg-sage/60 motion-safe:active:scale-90 disabled:opacity-30"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center text-base font-bold tabular-nums text-ink" aria-live="polite">
                      <Swap value={offer.packs} className="inline-block">{offer.packs}</Swap>
                    </span>
                    <button
                      onClick={() => step(1)}
                      disabled={idx >= OFFERS.length - 1}
                      aria-label="Un sachet de plus"
                      className="flex h-10 w-10 items-center justify-center rounded-full text-forest transition-[background-color,transform,opacity] duration-base ease-out-soft hover:bg-sage/60 motion-safe:active:scale-90 disabled:opacity-30"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {soldOut && (
                  <p role="status" className="mt-3 animate-reveal-down rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    Cette offre est épuisée pour le moment. Choisissez un autre nombre de sachets.
                  </p>
                )}
                {saving > 0 && !soldOut && (
                  <Swap value={offer.id} as="p" className="mt-3 rounded-lg bg-sage/50 px-3 py-2 text-xs font-medium text-forest">
                    Vous économisez {formatCHF(saving)} par rapport à {offer.packs} sachets achetés séparément.
                  </Swap>
                )}
              </div>

              <button
                onClick={clear}
                className="mt-3 text-xs font-medium text-muted underline-offset-2 hover:text-forest hover:underline"
              >
                Retirer l’article
              </button>

              {/* Uniquement des informations confirmées (délai et lieu d'expédition seulement si configurés) */}
              <ul className="mt-6 space-y-3 text-sm text-ink/80">
                <li className="flex items-center gap-2.5">
                  <Truck size={16} className="flex-none text-fr-green" /> Livraison offerte en Suisse
                  {DELIVERY.estimateDays ? ` · estimée sous ${DELIVERY.estimateDays} jours ouvrables` : ''}
                </li>
                {(MERCHANT.dispatchCity || DELIVERY.dispatchLocation) && (
                  <li className="flex items-center gap-2.5">
                    <MapPin size={16} className="flex-none text-fr-green" /> Expédié depuis{' '}
                    {MERCHANT.dispatchCity ? `${MERCHANT.dispatchCity} (Suisse)` : DELIVERY.dispatchLocation}
                  </li>
                )}
                <li className="flex items-center gap-2.5">
                  <RotateCcw size={16} className="flex-none text-fr-green" /> Retour possible sous {DELIVERY.returnWindowDays} jours
                  après réception
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
                  <Swap value={total} as="dd" className={`text-2xl tabular-nums ${S.display}`}>{formatCHF(total)}</Swap>
                </div>
              </dl>

              <button
                onClick={goCheckout}
                disabled={soldOut}
                className={`mt-4 flex h-14 disabled:cursor-not-allowed disabled:opacity-50 w-full items-center justify-center gap-2 text-base font-bold tracking-tight transition-[background-color,color,transform,box-shadow] duration-base ease-out-soft motion-safe:active:scale-[0.99] ${S.cta}`}
              >
                {S.sentenceCta ? `Passer commande · ${formatCHF(total)}` : 'PASSER COMMANDE'}
                <ArrowRight size={18} />
              </button>
              <button
                onClick={closeDrawer}
                className="mt-2 w-full py-2 text-center text-sm font-medium text-muted transition-colors duration-fast hover:text-forest"
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
