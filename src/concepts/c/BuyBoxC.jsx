import { forwardRef, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ShoppingBag, ArrowRight, Truck, RotateCcw, Lock } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import {
  OFFERS,
  DELIVERY,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  formatCHF,
  getOffer,
  savingsFor,
  pricePerCapsule,
} from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import { useFlash, radioKeyHandler } from '../shared/hooks.js'
import { deliveryFacts } from './contentC.js'
import { Pending } from './Pending.jsx'

// Mini pile de sachets : autant de sachets que l'offre en contient (photo réelle détourée).
export function PackStack({ packs, size = 'sm' }) {
  const w = size === 'sm' ? 'w-9' : 'w-14'
  const overlap = size === 'sm' ? '-ml-5' : '-ml-8'
  return (
    <span className="flex items-end justify-center" aria-hidden="true">
      {Array.from({ length: packs }).map((_, k) => (
        <img
          key={k}
          src={IMAGES.packshotCutout}
          alt=""
          loading="lazy"
          className={`${w} drop-shadow-[0_4px_6px_rgba(23,42,32,0.18)] ${k ? overlap : ''}`}
          style={{ transform: `rotate(${(k - (packs - 1) / 2) * 7}deg)`, zIndex: 3 - k }}
        />
      ))}
    </span>
  )
}

// Titre + prix (desktop : au-dessus du configurateur ; mobile : en surimpression sur la photo).
export function TitleBlock({ onPhoto = false }) {
  return (
    <div>
      <p className={`text-[0.68rem] font-bold uppercase tracking-[0.2em] ${onPhoto ? 'text-forest' : 'text-forest'}`}>
        Déstockage en Suisse
      </p>
      {/* traits d'union insécables : jamais de coupure « All- / in-1 » */}
      <h1
        className={`mt-2 font-serif font-medium leading-[1.02] tracking-tight text-ink ${
          onPhoto ? 'text-[1.85rem] min-[360px]:text-[2.15rem]' : 'text-[2.3rem] lg:text-[2.75rem] xl:text-[3.4rem]'
        }`}
      >
        Ariel All‑in‑1&nbsp;PODS
      </h1>
      <p className={`mt-1.5 text-ink/75 ${onPhoto ? 'text-[0.95rem]' : 'text-lg'}`}>
        <strong className="font-semibold text-ink">60 lavages par sachet</strong> · 60 capsules
      </p>
      <div className={`flex items-baseline gap-2 ${onPhoto ? 'mt-3' : 'mt-5'}`}>
        <span className="text-sm text-ink/70">Dès</span>
        <span className={`font-serif font-medium leading-none tracking-tight text-forest ${onPhoto ? 'text-[2.6rem]' : 'text-5xl'}`}>
          {formatCHF(4)}
        </span>
      </div>
      <p className="mt-1.5 text-[0.8rem] text-ink/70">
        ≈ {formatCHF(pricePerCapsule(OFFERS[0]))} / capsule · <span className="font-semibold text-forest">Livraison offerte en Suisse</span>
      </p>
    </div>
  )
}

const BuyBoxC = forwardRef(function BuyBoxC({ sel, setSel }, ctaRef) {
  const { selectOffer } = useCart()
  const navigate = useNavigate()
  const [added, flash] = useFlash()
  const tiles = useRef([])
  const offer = getOffer(sel)
  const save = savingsFor(offer)
  const facts = deliveryFacts()

  const checkout = () => {
    selectOffer(sel, { openDrawer: false, feedback: false })
    navigate('/commande')
  }
  const add = () => {
    selectOffer(sel, { openDrawer: false })
    flash()
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 md:mt-6 lg:mt-8">
        <h2 id="offres" className="scroll-mt-24 whitespace-nowrap text-[1.05rem] font-bold text-ink">
          Choisir mon offre
        </h2>
        <span className="text-right text-xs text-muted">Prix total, livraison incluse</span>
      </div>

      <div role="radiogroup" aria-label="Offres" className="mt-3 grid grid-cols-3 gap-2 lg:gap-3">
        {OFFERS.map((o, k) => {
          const active = o.id === sel
          return (
            <button
              key={o.id}
              ref={(el) => (tiles.current[k] = el)}
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onKeyDown={radioKeyHandler(k, OFFERS.length, (j) => setSel(OFFERS[j].id), tiles)}
              onClick={() => setSel(o.id)}
              className={`relative flex flex-col items-center rounded-2xl border-2 bg-white px-1 pb-2.5 pt-3.5 text-center transition-all duration-200 ${
                active ? 'border-forest shadow-[0_8px_24px_rgba(18,63,45,0.12)]' : 'border-hair hover:border-forest/35'
              }`}
            >
              {o.badge && (
                <span
                  className={`absolute -top-2.5 max-w-[98%] truncate whitespace-nowrap rounded-full px-2 py-0.5 text-[0.56rem] font-extrabold uppercase tracking-[0.06em] max-[399px]:px-1.5 max-[399px]:text-[0.5rem] max-[399px]:tracking-[0.02em] ${
                    o.featured ? 'bg-forest text-white' : 'bg-sand text-forest ring-1 ring-hair'
                  }`}
                  title={o.badge}
                >
                  {/* Libellés marchands courts (le libellé complet reste en info-bulle) */}
                  {o.featured ? (
                    <>
                      <span className="lg:hidden">Populaire</span>
                      <span className="hidden lg:inline">Le plus populaire</span>
                    </>
                  ) : (
                    'Meilleure offre'
                  )}
                </span>
              )}
              <span className="flex h-10 items-end">
                <PackStack packs={o.packs} />
              </span>
              <span className="mt-1 text-sm font-extrabold text-ink">
                {o.packs} pack{o.packs > 1 ? 's' : ''}
              </span>
              <span className="text-[0.7rem] text-muted">{o.washes} lavages</span>
              <span className="mt-1 whitespace-nowrap font-serif text-[1.12rem] font-medium leading-tight tabular-nums text-forest min-[360px]:text-[1.35rem] lg:text-2xl">
                {formatCHF(o.price)}
              </span>
              {/* Économie réelle vs packs à CHF 4.– (espace réservé sur 1 pack : hauteurs égales) */}
              <span className={`text-[0.66rem] font-bold leading-tight ${savingsFor(o) > 0 ? 'text-forest' : 'invisible'}`}>
                {savingsFor(o) > 0 ? `− ${formatCHF(savingsFor(o))}` : '—'}
              </span>
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-white">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Récapitulatif exact de la sélection */}
      <p className="mt-2 text-center text-[0.76rem] text-ink/75" aria-live="polite">
        {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} lavages ·{' '}
        <span className="text-muted">≈ {formatCHF(pricePerCapsule(offer))}/capsule</span>
        {save > 0 && (
          <span className="sr-only">
            , économie de {formatCHF(save)} par rapport à {offer.packs} packs à {formatCHF(OFFERS[0].price)}
          </span>
        )}
      </p>

      <div ref={ctaRef} className="mt-2.5 grid grid-cols-[auto_1fr] gap-2">
        <button
          onClick={add}
          aria-label="Ajouter au panier"
          className="flex h-[3.4rem] items-center justify-center gap-2 rounded-xl border-2 border-forest px-4 text-sm font-bold text-forest transition-colors hover:bg-mint"
        >
          {added ? <Check size={18} strokeWidth={2.6} /> : <ShoppingBag size={18} />}
          <span className="hidden lg:inline">{added ? 'Ajouté' : 'Ajouter'}</span>
        </button>
        <button
          onClick={checkout}
          className="flex h-[3.4rem] items-center justify-center gap-2 rounded-xl bg-forest text-[0.98rem] font-extrabold text-white transition-all hover:bg-forest-700 active:scale-[0.99]"
        >
          <span className="max-[359px]:hidden">Passer commande · {formatCHF(offer.price)}</span>
          <span className="min-[360px]:hidden">Commander · {formatCHF(offer.price)}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5 text-[0.8rem] text-ink/80">
        <li className="flex items-start gap-2">
          <Truck size={15} className="mt-0.5 flex-none text-forest" />
          <span>
            <strong className="font-semibold text-ink">Livraison offerte</strong> · estimée sous {DELIVERY.estimateDays} jours
            ouvrables · expédié depuis {facts.from}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <RotateCcw size={15} className="mt-0.5 flex-none text-forest" />
          <span>
            Retour possible sous {DELIVERY.returnWindowDays} jours ·{' '}
            <Link to="/retours-remboursements" className="underline underline-offset-2 hover:text-forest">
              conditions
            </Link>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Lock size={15} className="mt-0.5 flex-none text-forest" />
          {PAYMENT_METHODS.length ? (
            <span>Paiement sécurisé : {PAYMENT_METHODS.map((m) => PAYMENT_LABELS[m] || m).join(' · ')}</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1.5">
              Paiement via prestataire sécurisé <Pending>moyens de paiement actifs</Pending>
            </span>
          )}
        </li>
      </ul>
    </div>
  )
})

export default BuyBoxC
