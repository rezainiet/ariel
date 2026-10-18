import { useRef, useState } from 'react'
import { Check, ShoppingBag, Truck, RotateCcw } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import {
  OFFERS,
  DEFAULT_OFFER_ID,
  DELIVERY,
  formatCHF,
  getOffer,
  savingsFor,
  pricePerPack,
  centsPerWash,
} from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import { useFlash } from '../shared/hooks.js'

// Pile de packs : le nombre de sachets affichés suit l'offre choisie.
function PackStack({ packs }) {
  return (
    <div className="relative mx-auto h-44 w-56 sm:h-52 sm:w-64" aria-hidden="true">
      {[0, 1, 2].map((k) => {
        const shown = k < packs
        const offset = (k - (packs - 1) / 2) * 38
        return (
          <img
            key={k}
            src={IMAGES.packshotCutout}
            alt=""
            className="absolute left-1/2 top-1/2 w-36 drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)] transition-all duration-500 ease-out sm:w-40"
            style={{
              transform: `translate(calc(-50% + ${shown ? offset : 0}px), -50%) rotate(${shown ? (k - (packs - 1) / 2) * 5 : 0}deg) scale(${shown ? 1 : 0.85})`,
              opacity: shown ? 1 : 0,
              zIndex: 3 - Math.abs(k - (packs - 1) / 2),
            }}
          />
        )
      })}
    </div>
  )
}

export default function OffersB() {
  const { selectOffer } = useCart()
  const [sel, setSel] = useState(DEFAULT_OFFER_ID)
  const [added, flash] = useFlash()
  const tiles = useRef([])
  const offer = getOffer(sel)
  const save = savingsFor(offer)

  return (
    <section id="offres" className="scroll-mt-16 bg-white py-14 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-grotesk text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-forest">Offres de déstockage</p>
            <h2 className="mt-3 font-grotesk text-[2.3rem] font-bold leading-none tracking-[-0.03em] text-night lg:text-6xl">
              Choisissez votre pack.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-night/55">
            Prix de bundle fixes, livraison offerte incluse. Économies calculées par rapport à des packs à {formatCHF(OFFERS[0].price)} achetés séparément.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:mt-12 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
          {/* Tuiles de sélection */}
          <div role="radiogroup" aria-label="Choisir une offre" className="grid grid-cols-3 gap-2.5 sm:gap-4">
            {OFFERS.map((o) => {
              const active = o.id === sel
              return (
                <button
                  key={o.id}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSel(o.id)}
                  ref={(el) => (tiles.current[OFFERS.indexOf(o)] = el)}
                  onKeyDown={(e) => {
                    const i = OFFERS.findIndex((x) => x.id === sel)
                    let j = null
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % OFFERS.length
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + OFFERS.length) % OFFERS.length
                    if (j !== null) {
                      e.preventDefault()
                      setSel(OFFERS[j].id)
                      tiles.current[j]?.focus()
                    }
                  }}
                  tabIndex={active ? 0 : -1}
                  className={`relative flex flex-col rounded-[1.5rem] border-2 p-3.5 text-left transition-all duration-300 sm:p-6 lg:min-h-[260px] ${
                    active ? 'border-night bg-night text-white' : 'border-mist bg-mist text-night hover:border-night/20'
                  }`}
                >
                  <span className="flex items-start justify-between">
                    <span className="font-grotesk text-5xl font-bold leading-none tracking-[-0.05em] sm:text-7xl">{o.packs}</span>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                        active ? 'border-pollen bg-pollen text-night' : 'border-night/20'
                      }`}
                    >
                      {active && <Check size={13} strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="mt-1 font-grotesk text-sm font-semibold">pack{o.packs > 1 ? 's' : ''}</span>
                  <span className={`text-xs ${active ? 'text-white/60' : 'text-night/50'}`}>{o.washes} lavages</span>
                  {/* Prix toujours à la même hauteur ; badge réservé en pied de tuile */}
                  <span className="pt-4 font-grotesk text-lg font-bold tracking-tight sm:text-2xl">{formatCHF(o.price)}</span>
                  {/* Aperçu des packs (desktop) : autant de sachets que l'offre en contient */}
                  <span className="hidden flex-1 items-center justify-center py-4 lg:flex" aria-hidden="true">
                    {Array.from({ length: o.packs }).map((_, k) => (
                      <img
                        key={k}
                        src={IMAGES.packshotCutout}
                        alt=""
                        loading="lazy"
                        className={`w-16 drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)] xl:w-20 ${k > 0 ? '-ml-9 xl:-ml-11' : ''}`}
                        style={{ transform: `rotate(${(k - (o.packs - 1) / 2) * 6}deg)` }}
                      />
                    ))}
                  </span>
                  <span
                    className={`mt-auto min-h-[1.5rem] pt-2 text-[0.6rem] font-bold uppercase leading-tight tracking-[0.08em] sm:text-[0.66rem] ${
                      active ? 'text-pollen' : 'text-forest'
                    }`}
                  >
                    {o.featured && 'Le plus populaire'}
                    {!o.featured && o.badge && (
                      <>
                        <span className="sm:hidden">Meilleur prix</span>
                        <span className="hidden sm:inline">Meilleur rapport qualité-prix</span>
                      </>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Panneau récapitulatif */}
          <div className="flex flex-col overflow-hidden rounded-[2rem] bg-night text-white">
            <div className="relative bg-[radial-gradient(closest-side,rgba(238,242,238,0.14),transparent)] pt-6">
              <PackStack packs={offer.packs} />
            </div>
            <div className="flex flex-1 flex-col p-6 sm:p-8">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="whitespace-nowrap font-grotesk text-lg font-bold sm:text-xl">
                    {offer.packs} × 60 capsules
                  </p>
                  <p className="text-sm text-white/60">{offer.washes} lavages au total</p>
                </div>
                <p className="whitespace-nowrap font-grotesk text-3xl font-bold tabular-nums tracking-tight sm:text-4xl" aria-live="polite">
                  {formatCHF(offer.price)}
                </p>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  [formatCHF(pricePerPack(offer)), 'par pack'],
                  [`${centsPerWash(offer)} ct.`, 'par lavage'],
                  [save > 0 ? `− ${formatCHF(save)}` : '—', 'vs séparés'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl bg-white/[0.06] px-2 py-3">
                    <dt className="sr-only">{l}</dt>
                    <dd className={`font-grotesk text-base font-bold tabular-nums ${l === 'vs séparés' && save > 0 ? 'text-pollen' : ''}`}>{v}</dd>
                    <dd className="text-[0.68rem] text-white/50">{l}</dd>
                  </div>
                ))}
              </dl>
              <button
                onClick={() => {
                  selectOffer(sel, { openDrawer: true })
                  flash()
                }}
                className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-pollen font-grotesk text-base font-bold text-night transition-all hover:bg-white active:scale-[0.99]"
              >
                {added ? (
                  <>
                    <Check size={18} strokeWidth={2.6} /> Ajouté au panier
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Ajouter au panier
                  </>
                )}
              </button>
              <p className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-white/55">
                <span className="flex items-center gap-1.5">
                  <Truck size={13} /> Livraison offerte · ≈ {DELIVERY.estimateDays} jours ouvrables
                </span>
                <span className="flex items-center gap-1.5">
                  <RotateCcw size={13} /> Retour sous {DELIVERY.returnWindowDays} jours
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
