import { useState } from 'react'
import { Check, Maximize2, Truck, MapPin, RotateCcw, ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import {
  OFFERS,
  DEFAULT_OFFER_ID,
  DELIVERY,
  formatCHF,
  getOffer,
  savingsFor,
  pricePerPack,
} from '../../config/store.js'
import { GALLERY } from '../../config/assets.js'
import { useReviews } from '../../data/reviews.js'
import Lightbox from '../shared/Lightbox.jsx'
import Stars from '../shared/Stars.jsx'
import { useSwipe, useFlash } from '../shared/hooks.js'

// ── Galerie éditoriale ──────────────────────────────────────
function GalleryA() {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(null)
  const n = GALLERY.length
  const swipe = useSwipe(
    () => setI((v) => (v - 1 + n) % n),
    () => setI((v) => (v + 1) % n)
  )
  const img = GALLERY[i]

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[88px_1fr] lg:gap-5">
      {/* Vignettes — masquées sur mobile (balayage + points), verticales sur desktop */}
      <div
        className="order-2 mt-3 hidden gap-2 overflow-x-auto px-5 no-scrollbar sm:flex lg:order-1 lg:mt-0 lg:flex-col lg:overflow-visible lg:px-0"
        role="group"
        aria-label="Choisir une image"
      >
        {GALLERY.map((g, k) => (
          <button
            key={g.src}
            onClick={() => setI(k)}
            aria-label={g.alt}
            aria-pressed={k === i}
            className={`relative h-14 w-14 flex-none overflow-hidden rounded-lg border bg-white transition-all lg:h-[88px] lg:w-[88px] ${
              k === i ? 'border-forest ring-1 ring-forest' : 'border-hair opacity-75 hover:opacity-100'
            }`}
          >
            <img
              src={g.src}
              alt=""
              loading="lazy"
              className={`h-full w-full ${g.fit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}
            />
          </button>
        ))}
      </div>

      {/* Scène principale */}
      <div className="order-1 lg:order-2">
        <div
          {...swipe}
          className="group relative flex aspect-[5/4] items-center justify-center overflow-hidden bg-white sm:aspect-[4/3] lg:aspect-square lg:rounded-[1.25rem] lg:border lg:border-hair"
        >
          {img.lowRes ? (
            // Visuel basse résolution : présenté comme un tirage encadré, sans agrandissement excessif.
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              className="max-h-[82%] max-w-[78%] animate-fade-in rounded-lg object-contain shadow-[0_18px_40px_rgba(23,42,32,0.18)]"
            />
          ) : (
            <img
              key={img.src}
              src={img.src}
              alt={img.alt}
              fetchpriority="high"
              className="h-full w-full animate-fade-in object-contain px-8 pb-11 pt-5 sm:p-8 lg:p-10"
            />
          )}

          <button
            onClick={() => setZoom(i)}
            aria-label="Agrandir l’image"
            className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-hair bg-white/90 text-forest backdrop-blur transition-transform hover:scale-105"
          >
            <Maximize2 size={16} />
          </button>
          {/* Points de pagination (mobile) — chaque point est un vrai bouton */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
            {GALLERY.map((g, k) => (
              <button
                key={g.src}
                onClick={() => setI(k)}
                aria-label={`Image ${k + 1} sur ${n}`}
                aria-current={k === i}
                className="flex h-6 items-center justify-center px-0.5"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    k === i ? 'w-5 bg-forest' : 'w-1.5 bg-forest/25'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <Lightbox images={GALLERY} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </div>
  )
}

// ── Boîte d'achat ──────────────────────────────────────────
function BuyBoxA() {
  const { selectOffer } = useCart()
  const [sel, setSel] = useState(DEFAULT_OFFER_ID)
  const [added, flash] = useFlash()
  const reviews = useReviews()
  const offer = getOffer(sel)

  const add = () => {
    selectOffer(sel, { openDrawer: true })
    flash()
  }

  return (
    <div className="px-5 pt-6 lg:px-0 lg:pt-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-forest">
        Déstockage en Suisse
      </p>
      <h1 className="mt-2 font-serif text-[2.05rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.6rem]">
        Ariel All-in-1&nbsp;PODS
      </h1>
      <p className="mt-2 text-[0.95rem] text-muted lg:text-lg">
        Capsules de lessive · <span className="font-semibold text-ink">60 lavages par pack</span>
      </p>

      {reviews.summary.count > 0 && (
        <button
          onClick={() => document.getElementById('avis')?.scrollIntoView({ behavior: 'smooth' })}
          className="mt-3 inline-flex items-center gap-2 text-sm text-ink/80 hover:text-forest"
        >
          <Stars value={reviews.summary.average} size={15} />
          <span className="font-semibold tabular-nums">{reviews.summary.average.toFixed(1)}</span>
          <span className="text-muted underline underline-offset-2">
            {reviews.summary.count} avis{reviews.isSample ? ' (exemple)' : ''}
          </span>
        </button>
      )}

      <div className="mt-5 flex items-baseline gap-3 border-y border-hair py-4">
        <span className="text-sm text-muted">Dès</span>
        <span className="font-serif text-[2.6rem] font-medium leading-none tracking-tight text-forest lg:text-5xl">
          {formatCHF(4)}
        </span>
        <span className="text-sm leading-tight text-muted">
          le pack de 60
          <br />
          livraison offerte
        </span>
      </div>

      {/* Sélecteur d'offre — groupe radio natif (clavier : flèches) */}
      <fieldset id="offres" className="mt-5 scroll-mt-28">
        <legend className="mb-3 flex w-full items-baseline justify-between text-sm font-semibold text-ink">
          Choisissez votre offre
          <span className="text-xs font-normal text-muted">Prix de bundle, livraison incluse</span>
        </legend>
        <div className="space-y-2.5">
          {OFFERS.map((o) => {
            const active = o.id === sel
            const save = savingsFor(o)
            return (
              <label
                key={o.id}
                className={`relative flex cursor-pointer items-center gap-4 rounded-xl border bg-white px-4 py-3.5 transition-all duration-200 ${
                  active ? 'border-forest shadow-[0_0_0_1px_#123F2D]' : 'border-hair hover:border-forest/40'
                }`}
              >
                <input
                  type="radio"
                  name="offer-a"
                  value={o.id}
                  checked={active}
                  onChange={() => setSel(o.id)}
                  className="peer sr-only"
                />
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-forest/50 peer-focus-visible:ring-offset-2 ${
                    active ? 'border-forest bg-forest text-white' : 'border-ink/25'
                  }`}
                >
                  {active && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-ink">
                      {o.packs} pack{o.packs > 1 ? 's' : ''}
                    </span>
                    {o.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] ${
                          o.featured ? 'bg-forest text-white' : 'bg-sand text-forest'
                        }`}
                      >
                        {o.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {o.washes} lavages · {formatCHF(pricePerPack(o))} / pack
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-serif text-xl font-medium tabular-nums text-ink">
                    {formatCHF(o.price)}
                  </span>
                  {save > 0 && (
                    <span className="block text-[0.68rem] font-semibold text-forest">
                      − {formatCHF(save)} vs séparés
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <button
        onClick={add}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-forest text-[0.95rem] font-semibold tracking-tight text-white transition-all duration-200 hover:bg-forest-700 active:scale-[0.99]"
      >
        {added ? (
          <>
            <Check size={18} strokeWidth={2.6} /> Ajouté au panier
          </>
        ) : (
          <>
            <ShoppingBag size={18} /> Ajouter au panier · {formatCHF(offer.price)}
          </>
        )}
      </button>

      <ul className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          [Truck, 'Livraison offerte', `≈ ${DELIVERY.estimateDays} jours ouvrables`],
          [MapPin, 'Stock en Suisse', `Expédié de ${DELIVERY.dispatchLocation}`],
          [RotateCcw, 'Retour 15 jours', 'après réception'],
        ].map(([Icon, t, s]) => (
          <li key={t} className="rounded-xl bg-sand/70 px-2 py-3">
            <Icon size={17} className="mx-auto text-forest" strokeWidth={1.8} />
            <span className="mt-1.5 block text-[0.72rem] font-semibold leading-tight text-ink">{t}</span>
            <span className="block text-[0.65rem] leading-tight text-muted">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HeroA() {
  return (
    <section className="mx-auto max-w-[1320px] pb-10 lg:grid lg:grid-cols-[1.25fr_1fr] lg:gap-14 lg:px-10 lg:pb-16 lg:pt-8 xl:gap-20">
      <GalleryA />
      <BuyBoxA />
    </section>
  )
}
