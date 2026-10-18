import { forwardRef, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ShoppingBag, ArrowRight, Truck, MapPin, RotateCcw, Expand } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { OFFERS, DELIVERY, formatCHF, getOffer, savingsFor, centsPerWash } from '../../config/store.js'
import { GALLERY } from '../../config/assets.js'
import { useReviews } from '../../data/reviews.js'
import Stars from '../shared/Stars.jsx'
import Lightbox from '../shared/Lightbox.jsx'
import { useFlash, radioKeyHandler } from '../shared/hooks.js'

// ── Médias : carrousel natif (mobile) / grille bento (desktop) ──
function MediaC() {
  const track = useRef(null)
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(null)

  const onScroll = () => {
    const el = track.current
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth))
  }
  const goTo = (k) => track.current?.scrollTo({ left: k * track.current.clientWidth, behavior: 'smooth' })

  return (
    <>
      {/* Mobile */}
      <div className="relative lg:hidden">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
          aria-label="Photos du produit"
        >
          {GALLERY.map((g, k) => (
            <button
              key={g.src}
              onClick={() => setZoom(k)}
              aria-label={`Agrandir : ${g.alt}`}
              className="flex aspect-[5/4] w-full flex-none snap-center items-center justify-center bg-mint/60"
            >
              <img
                src={g.cutout || g.src}
                alt={g.alt}
                loading={k === 0 ? 'eager' : 'lazy'}
                fetchpriority={k === 0 ? 'high' : undefined}
                className={
                  g.lowRes
                    ? 'max-h-[86%] max-w-[80%] rounded-xl object-contain shadow-lg'
                    : 'h-full w-full object-contain px-10 py-5 drop-shadow-[0_18px_22px_rgba(18,63,45,0.22)]'
                }
              />
            </button>
          ))}
        </div>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-full bg-white/85 px-2 py-1 backdrop-blur">
          {GALLERY.map((g, k) => (
            <button key={g.src} onClick={() => goTo(k)} aria-label={`Photo ${k + 1}`} aria-current={k === i} className="flex h-5 items-center px-0.5">
              <span className={`block h-1.5 rounded-full transition-all ${k === i ? 'w-4 bg-forest' : 'w-1.5 bg-forest/25'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-2">
        {GALLERY.slice(0, 5).map((g, k) => (
          <button
            key={g.src}
            onClick={() => setZoom(k)}
            aria-label={`Agrandir : ${g.alt}`}
            className={`group relative flex items-center justify-center overflow-hidden rounded-2xl bg-mint/60 ${
              k === 0 ? 'col-span-2 aspect-[16/11]' : 'aspect-square'
            }`}
          >
            <img
              src={g.cutout || g.src}
              alt={g.alt}
              loading={k === 0 ? 'eager' : 'lazy'}
              className={`transition-transform duration-500 group-hover:scale-[1.03] ${
                g.lowRes ? 'max-h-[82%] max-w-[78%] rounded-xl object-contain shadow-lg' : 'h-full w-full object-contain p-12 drop-shadow-[0_24px_30px_rgba(18,63,45,0.22)]'
              }`}
            />
            <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-forest opacity-0 transition-opacity group-hover:opacity-100">
              <Expand size={15} />
            </span>
          </button>
        ))}
      </div>
      <Lightbox images={GALLERY} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </>
  )
}

// ── Configurateur ───────────────────────────────────────────
const BuyBoxC = forwardRef(function BuyBoxC({ sel, setSel }, ctaRef) {
  const { selectOffer } = useCart()
  const navigate = useNavigate()
  const reviews = useReviews()
  const [added, flash] = useFlash()
  const tiles = useRef([])
  const offer = getOffer(sel)

  const buyNow = () => {
    selectOffer(sel, { openDrawer: false, feedback: false })
    navigate('/commande')
  }
  const add = () => {
    selectOffer(sel, { openDrawer: false })
    flash()
  }

  return (
    <div className="px-4 pt-5 lg:sticky lg:top-20 lg:px-0 lg:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-md bg-mint px-2 py-1 text-[0.66rem] font-extrabold uppercase tracking-[0.12em] text-forest">
          Déstockage en Suisse
        </span>
        {reviews.summary.count > 0 && (
          <a href="#avis" className="flex items-center gap-1.5 text-xs text-muted">
            <Stars value={reviews.summary.average} size={13} />
            <span className="font-semibold text-ink">{reviews.summary.average.toFixed(1)}</span>
            ({reviews.summary.count}
            {reviews.isSample ? ', exemple' : ''})
          </a>
        )}
      </div>
      <h1 className="mt-2 text-[1.65rem] font-extrabold leading-tight tracking-tight text-ink lg:text-[2.6rem]">
        Ariel All-in-1 PODS
      </h1>
      <p className="text-[0.92rem] text-muted lg:text-base">60 capsules par pack · 1 capsule = 1 lavage</p>

      {/* Tuiles d'offre — une seule rangée */}
      <div id="offres" role="radiogroup" aria-label="Choisir une offre" className="mt-4 grid scroll-mt-24 grid-cols-3 gap-2 lg:mt-6 lg:gap-3">
        {OFFERS.map((o, k) => {
          const active = o.id === sel
          const save = savingsFor(o)
          return (
            <button
              key={o.id}
              ref={(el) => (tiles.current[k] = el)}
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onKeyDown={radioKeyHandler(k, OFFERS.length, (j) => setSel(OFFERS[j].id), tiles)}
              onClick={() => setSel(o.id)}
              className={`relative flex flex-col items-center rounded-2xl border-2 px-1 pb-2.5 pt-4 text-center transition-all duration-200 lg:pb-4 lg:pt-5 ${
                active ? 'border-forest bg-mint/50' : 'border-line bg-white hover:border-forest/30'
              }`}
            >
              {o.featured && (
                <span className="absolute -top-2.5 whitespace-nowrap rounded-full bg-forest px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-white">
                  Populaire
                </span>
              )}
              {!o.featured && o.badge && (
                <span className="absolute -top-2.5 whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[0.58rem] font-extrabold uppercase tracking-[0.08em] text-amber-900">
                  Meilleur prix
                </span>
              )}
              <span className="text-sm font-extrabold text-ink">
                {o.packs} pack{o.packs > 1 ? 's' : ''}
              </span>
              <span className="text-[0.7rem] text-muted">{o.washes} lavages</span>
              <span className="mt-1 text-lg font-extrabold tabular-nums tracking-tight text-forest lg:text-2xl">{formatCHF(o.price)}</span>
              <span className={`text-[0.64rem] font-bold ${save > 0 ? 'text-forest' : 'text-transparent'}`}>
                {save > 0 ? `− ${formatCHF(save)}` : '·'}
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
      <p className="mt-2 text-center text-[0.7rem] text-muted">
        {offer.packs} × 60 capsules · {centsPerWash(offer)} ct. par lavage
        {savingsFor(offer) > 0 && ` · économie de ${formatCHF(savingsFor(offer))} vs packs séparés`}
      </p>

      {/* Actions */}
      <div ref={ctaRef} className="mt-3 grid grid-cols-[auto_1fr] gap-2">
        <button
          onClick={add}
          aria-label="Ajouter au panier"
          className="flex h-[3.25rem] items-center justify-center gap-2 rounded-xl border-2 border-forest px-4 text-sm font-bold text-forest transition-colors hover:bg-mint"
        >
          {added ? <Check size={18} strokeWidth={2.6} /> : <ShoppingBag size={18} />}
          <span className="hidden sm:inline">{added ? 'Ajouté' : 'Ajouter'}</span>
        </button>
        <button
          onClick={buyNow}
          className="flex h-[3.25rem] items-center justify-center gap-2 rounded-xl bg-forest text-[0.95rem] font-extrabold text-white transition-all hover:bg-forest-700 active:scale-[0.99]"
        >
          Commander · {formatCHF(offer.price)} <ArrowRight size={18} />
        </button>
      </div>

      <ul className="mt-3 space-y-1.5 rounded-xl bg-cloud px-3.5 py-3 text-[0.78rem] text-ink/80">
        <li className="flex items-center gap-2">
          <Truck size={15} className="flex-none text-forest" />
          <span>
            <strong className="font-bold text-ink">Livraison offerte</strong> · estimée sous {DELIVERY.estimateDays} jours ouvrables
          </span>
        </li>
        <li className="flex items-center gap-2">
          <MapPin size={15} className="flex-none text-forest" /> Expédié depuis notre stock en {DELIVERY.dispatchLocation}
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw size={15} className="flex-none text-forest" /> Retour possible sous {DELIVERY.returnWindowDays} jours après réception
        </li>
      </ul>

      {/* Desktop : fiche technique factuelle à côté de la décision d'achat */}
      <dl className="mt-4 hidden grid-cols-2 gap-2 lg:grid">
        {[
          ['Contenu', '60 capsules par sachet'],
          ['Dosage', '1 capsule = 1 lavage'],
          ['Fermeture', 'Sécurité enfants, refermable'],
          ['Expédition', `Depuis ${DELIVERY.dispatchLocation}`],
        ].map(([t, d]) => (
          <div key={t} className="rounded-xl border border-line px-3.5 py-3">
            <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-muted">{t}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">{d}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
})

export default function BuyC({ sel, setSel, ctaRef }) {
  return (
    <section className="mx-auto max-w-[1280px] pb-8 lg:grid lg:grid-cols-[1.35fr_1fr] lg:gap-12 lg:px-8 lg:py-8">
      <MediaC />
      <BuyBoxC ref={ctaRef} sel={sel} setSel={setSel} />
    </section>
  )
}
