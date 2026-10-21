import { forwardRef, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ShoppingBag, ArrowRight, Truck, RotateCcw, LockKeyhole, ThermometerSnowflake, Expand, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { OFFERS, DELIVERY, formatCHF, getOffer, savingsFor, centsPerWash } from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import { useFlash, radioKeyHandler, useSwipe } from '../shared/hooks.js'
import Lightbox from '../shared/Lightbox.jsx'
import { IconTile, PodIcon, Chf } from './Icons.jsx'
import UrgencyPanel from './Urgency.jsx'
import { GALLERY_F } from './mediaF.js'
import { useStock, isSoldOut } from '../../lib/stock.js'
import { Swap } from '../../lib/motion.js'
import { summarize } from '../../data/reviews.js'

const cents = (o) => String(centsPerWash(o)).replace('.', ',')

// Petite pile de sachets réels (même visuel que le panier).
export function Packs({ n, size = 'md' }) {
  const w = { sm: 'w-7', md: 'w-10', lg: 'w-12' }[size]
  const ml = { sm: '-ml-[1.05rem]', md: '-ml-6', lg: '-ml-7' }[size]
  return (
    <span className="flex items-end" aria-hidden="true">
      {Array.from({ length: n }).map((_, k) => (
        <img
          key={k}
          src={IMAGES.packshotCutout}
          alt=""
          className={`${w} drop-shadow-[0_4px_6px_rgba(11,61,42,0.18)] ${k ? ml : ''}`}
          style={{ zIndex: 3 - k }}
        />
      ))}
    </span>
  )
}

function Picture({ item, className, eager }) {
  if (!item.picture)
    return <img src={item.src} alt={item.alt} loading={eager ? 'eager' : 'lazy'} className={className} />
  const p = item.picture
  return (
    <picture>
      {p.avif && <source type="image/avif" srcSet={p.avif} sizes="(min-width:1024px) 640px, 100vw" />}
      {p.webp && <source type="image/webp" srcSet={p.webp} sizes="(min-width:1024px) 640px, 100vw" />}
      <img src={p.src} alt={item.alt} width={p.width} height={p.height} loading={eager ? 'eager' : 'lazy'} className={className} />
    </picture>
  )
}

const CHIPS = [
  { icon: PodIcon, title: '60 capsules', sub: 'par sachet', pos: 'left-4 top-4 lg:left-8 lg:top-8' },
  { icon: ThermometerSnowflake, title: 'Même à l’eau froide', sub: 'selon l’emballage', pos: 'bottom-24 right-8 hidden lg:flex' },
  { icon: Check, title: 'Universal+', sub: 'linge blanc et clair', pos: 'left-8 top-[6.6rem] hidden lg:flex' },
]

// Sachets en retrait (2e et 3e) : se placent derrière le sachet principal selon l'offre choisie.
const BACK_PACKS = [
  'translate-x-[-34%] translate-y-[3%] -rotate-[7deg] scale-[0.84]',
  'translate-x-[34%] translate-y-[3%] rotate-[7deg] scale-[0.84]',
]

// Scène produit : panneau menthe, packshots réels (autant que de sachets dans l'offre), puces factuelles,
// vignettes, zoom plein écran. Changer d'offre ramène la scène sur les sachets.
function Stage({ packs }) {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(null)
  const n = GALLERY_F.length
  const go = (d) => setI((v) => (v + d + n) % n)
  const swipe = useSwipe(() => go(-1), () => go(1))
  const item = GALLERY_F[i]
  const firstPacks = useRef(packs)
  useEffect(() => {
    if (packs !== firstPacks.current) setI(0)
  }, [packs])
  return (
    <div className="relative">
      <div
        {...swipe}
        className="relative aspect-[1/0.76] overflow-hidden rounded-[1.75rem] bg-[radial-gradient(120%_90%_at_30%_15%,#F4FBF7_0%,#E9F6EF_45%,#D4EEDF_100%)] lg:aspect-auto lg:h-[min(44rem,calc(100svh-12.5rem))] lg:rounded-[2rem]"
      >
        {GALLERY_F.map((g, k) => (
          <div
            key={g.src}
            aria-hidden={k !== i}
            className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-slow ease-out-soft ${k === i ? 'opacity-100' : 'pointer-events-none scale-[1.015] opacity-0'}`}
          >
            {g.kind === 'cutout' ? (
              <>
                <span className="absolute left-1/2 top-1/2 aspect-square w-[56%] -translate-x-1/2 -translate-y-[46%] rounded-full bg-white/55 lg:w-[64%] lg:-translate-y-[54%]" aria-hidden="true" />
                <span className="relative mt-[5%] w-[50%] max-w-[28rem] lg:mt-0 lg:w-[60%]">
                  {BACK_PACKS.map((pos, b) => (
                    <img
                      key={b}
                      src={g.src}
                      alt=""
                      aria-hidden="true"
                      className={`absolute inset-0 w-full drop-shadow-[0_18px_20px_rgba(11,61,42,0.18)] transition-[transform,opacity] duration-[560ms] ease-out-soft ${
                        b + 1 < packs ? `${pos} opacity-100` : 'scale-[0.8] opacity-0'
                      }`}
                      style={{ transitionDelay: b + 1 < packs ? `${b * 80}ms` : '0ms' }}
                    />
                  ))}
                  <img src={g.src} alt={g.alt} fetchpriority="high" className="relative w-full drop-shadow-[0_30px_32px_rgba(11,61,42,0.24)]" />
                </span>
              </>
            ) : (
              <Picture item={g} className="h-full w-full object-cover" />
            )}
          </div>
        ))}

        {/* Puces factuelles (packshot uniquement) */}
        {item.kind === 'cutout' &&
          CHIPS.map((c) => (
            <div key={c.title} className={`absolute z-10 flex animate-fade-in items-center gap-2.5 rounded-2xl bg-white/95 py-2 pl-2 pr-3.5 shadow-[0_12px_30px_rgba(11,61,42,0.12)] lg:py-2.5 lg:pl-2.5 lg:pr-4 ${c.pos}`}>
              <IconTile icon={c.icon} size="sm" />
              <span className="font-jakarta leading-tight">
                <span className="block text-[0.76rem] font-bold text-fr-ink lg:text-[0.84rem]">{c.title}</span>
                <span className="block text-[0.66rem] text-fr-muted lg:text-[0.72rem]">{c.sub}</span>
              </span>
            </div>
          ))}

        <button
          onClick={() => setZoom(i)}
          aria-label="Agrandir la photo"
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-fr-deep shadow-md transition-[transform,background-color] duration-base ease-out-soft hover:bg-white can-hover:hover:scale-105 motion-safe:active:scale-95 lg:right-6 lg:top-6"
        >
          <Expand size={17} strokeWidth={1.9} />
        </button>
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 lg:hidden" role="tablist" aria-label="Photos">
          {GALLERY_F.map((g, k) => (
            <button
              key={g.src}
              role="tab"
              aria-selected={k === i}
              aria-label={`Photo ${k + 1} : ${g.caption}`}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-slow ease-out-soft ${k === i ? 'w-5 bg-fr-deep' : 'w-1.5 bg-fr-deep/25'}`}
            />
          ))}
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 lg:flex">
          <button onClick={() => go(-1)} aria-label="Photo précédente" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-fr-deep shadow-md transition-[transform,background-color] duration-base ease-out-soft hover:bg-white motion-safe:active:scale-95">
            <ChevronLeft size={18} />
          </button>
          <Swap value={i} anim="animate-fade-in" className="rounded-full bg-white/90 px-3 py-1.5 font-jakarta text-xs font-semibold text-fr-ink shadow-md">{item.caption}</Swap>
          <button onClick={() => go(1)} aria-label="Photo suivante" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-fr-deep shadow-md transition-[transform,background-color] duration-base ease-out-soft hover:bg-white motion-safe:active:scale-95">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Vignettes desktop */}
      <div className="mt-3 hidden gap-3 lg:flex">
        {GALLERY_F.map((g, k) => (
          <button
            key={g.src}
            onClick={() => setI(k)}
            aria-label={`Afficher : ${g.caption}`}
            aria-current={k === i}
            className={`h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl bg-fr-mint transition-[opacity,box-shadow] duration-base ease-out-soft ${
              k === i ? 'ring-2 ring-fr-green ring-offset-2' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <img src={g.kind === 'cutout' ? g.src : g.picture?.src || g.src} alt="" loading="lazy" className={`h-full w-full ${g.kind === 'cutout' ? 'object-contain p-1.5' : 'object-cover'}`} />
          </button>
        ))}
      </div>
      <Lightbox images={GALLERY_F.map((g) => ({ src: g.picture?.src || g.src, alt: g.alt }))} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </div>
  )
}

function OfferCard({ o, active, glow, onSelect, tabRef, onKeyDown, soldOut }) {
  const save = savingsFor(o)
  return (
    <button
      ref={tabRef}
      role="radio"
      aria-checked={active}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group relative flex flex-col items-center rounded-[1.1rem] px-1.5 pb-3 pt-4 text-center font-jakarta transition-[box-shadow,transform,opacity] duration-base ease-out-soft motion-safe:active:scale-[0.985] lg:items-start lg:rounded-[1.25rem] lg:px-4 lg:pb-4 lg:pt-5 lg:text-left ${
        active
          ? 'bg-gradient-to-b from-[#F3FBF7] to-white shadow-[0_14px_30px_rgba(14,122,71,0.13)] ring-2 ring-fr-green'
          : 'bg-white ring-1 ring-fr-line hover:ring-fr-green/40 can-hover:hover:-translate-y-0.5 can-hover:hover:shadow-[0_10px_24px_rgba(11,61,42,0.08)]'
      } ${soldOut ? 'opacity-60' : ''} ${glow ? 'glow-once' : ''}`}
    >
      {o.badge && (
        <span
          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[0.58rem] font-extrabold uppercase tracking-[0.06em] lg:left-4 lg:translate-x-0 lg:text-[0.62rem] ${
            o.featured ? 'bg-fr-green text-white' : 'bg-fr-deep text-white'
          }`}
          title={o.badge}
        >
          {o.featured ? 'Populaire' : 'Meilleure offre'}
        </span>
      )}
      <span
        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full transition-[transform,background-color,color] duration-base ease-out-soft lg:right-3 lg:top-3 ${
          active ? 'scale-100 bg-fr-green text-white' : 'scale-75 bg-fr-line text-transparent'
        }`}
        aria-hidden="true"
      >
        <Check size={12} strokeWidth={3} />
      </span>
      <span className={`flex h-9 items-end transition-transform duration-slow ease-out-soft lg:h-12 ${active ? '-translate-y-1' : ''}`}>
        <Packs n={o.packs} size="sm" />
      </span>
      <span className="mt-2 text-[0.88rem] font-extrabold text-fr-ink lg:text-base">
        {o.packs} sachet{o.packs > 1 ? 's' : ''}
      </span>
      <span className="text-[0.7rem] text-fr-muted lg:text-xs">{o.washes} capsules</span>
      <span className="mt-1.5 whitespace-nowrap text-[1.2rem] font-extrabold tracking-[-0.03em] text-fr-ink min-[380px]:text-[1.32rem] lg:mt-2 lg:text-[1.6rem]">
        <Chf v={o.price} format={formatCHF} />
      </span>
      {/* Économie réelle face à l'achat de sachets à l'unité (CHF 4.– chacun) ; « Épuisé » selon le stock serveur */}
      <span
        className={`mt-1 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.62rem] font-bold lg:px-2 lg:text-[0.7rem] ${
          soldOut ? 'bg-fr-ink/[0.07] text-fr-ink' : save > 0 ? 'bg-fr-mint text-fr-green' : 'invisible'
        }`}
      >
        {soldOut ? (
          'Épuisé'
        ) : save > 0 ? (
          <>
            <span className="lg:hidden">− {formatCHF(save)}</span>
            <span className="hidden lg:inline">Économisez {formatCHF(save)}</span>
          </>
        ) : (
          '—'
        )}
      </span>
    </button>
  )
}

const BuyBox = forwardRef(function BuyBox({ sel, setSel, status, reviewState }, ctaRef) {
  const { selectOffer } = useCart()
  const navigate = useNavigate()
  const [added, flash] = useFlash()
  const tiles = useRef([])
  const offer = getOffer(sel)
  const save = savingsFor(offer)
  const stock = useStock()
  const reviewSummary = reviewState.status === 'live' ? summarize(reviewState.reviews) : null
  const reviewLabel = reviewState.reviews.every((review) => review.source) ? 'avis externes' : 'avis'
  const allSoldOut = status.stock?.available === 0 || OFFERS.every((o) => isSoldOut(stock, o.id))
  const soldOut = allSoldOut || isSoldOut(stock, sel)
  // L'anneau de sélection ne s'affiche qu'après un vrai changement d'offre (jamais au chargement).
  const initialSel = useRef(sel)
  const changed = useRef(false)
  if (sel !== initialSel.current) changed.current = true

  const add = () => {
    if (soldOut) return
    selectOffer(sel)
    flash()
  }
  const direct = () => {
    if (soldOut) return
    selectOffer(sel, { openDrawer: false, feedback: false })
    navigate('/checkout')
  }

  return (
    <div className="font-jakarta">
      <p className="hidden h-7 items-center gap-2 rounded-full bg-fr-mint px-3 lg:inline-flex text-[0.66rem] font-extrabold uppercase tracking-[0.1em] text-fr-green lg:h-8 lg:text-[0.7rem]">
        <span className="h-1.5 w-1.5 rounded-full bg-fr-green" aria-hidden="true" /> Déstockage en Suisse
      </p>
      <h1 className="text-[2rem] font-extrabold leading-[1.02] tracking-[-0.022em] text-fr-ink min-[380px]:text-[2.2rem] lg:mt-4 lg:text-[3.2rem] xl:text-[3.5rem]">
        Ariel All‑in‑1&nbsp;PODS
      </h1>
      {reviewSummary && (
        <a href="#avis" className="mt-2 inline-flex items-center gap-2 rounded-md font-jakarta text-[0.78rem] text-fr-ink underline-offset-4 transition-colors hover:text-fr-green hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fr-green lg:text-sm" aria-label={`Note moyenne ${reviewSummary.average.toFixed(1).replace('.', ',')} sur 5, ${reviewSummary.count} ${reviewLabel} — voir les avis`}>
          <span className="inline-flex gap-0.5 text-fr-green" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} strokeWidth={1.5} className={n <= Math.round(reviewSummary.average) ? 'fill-current' : ''} />)}
          </span>
          <span className="font-bold">{reviewSummary.average.toFixed(1).replace('.', ',')}</span>
          <span className="text-fr-muted">· {reviewSummary.count} {reviewLabel}</span>
        </a>
      )}
      <p className="mt-1 text-[0.92rem] text-fr-muted lg:mt-3 lg:text-lg">Capsules de lessive · 60 lavages par sachet*</p>
      <div className="mt-2.5 flex items-end gap-2.5 lg:mt-5">
        <span className="pb-1.5 text-sm font-semibold text-fr-muted">Dès</span>
        <span className="text-[2.4rem] font-extrabold leading-none tracking-[-0.03em] text-fr-green lg:text-[3.6rem]"><Chf v={4} format={formatCHF} /></span>
        <span className="pb-1.5 text-[0.78rem] text-fr-muted">≈ CHF 0.07 / capsule</span>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 lg:mt-7">
        <h2 id="offres" className="scroll-mt-28 text-[1rem] font-bold text-fr-ink lg:text-[1.05rem]">
          Choisir mon offre
        </h2>
        <span className="text-[0.72rem] text-fr-muted lg:text-[0.8rem]">Prix total, livraison incluse</span>
      </div>
      <div role="radiogroup" aria-labelledby="offres" className="mt-3.5 grid grid-cols-3 gap-2 lg:mt-4 lg:gap-3">
        {OFFERS.map((o, k) => (
          <OfferCard
            key={o.id}
            o={o}
            active={o.id === sel}
            glow={o.id === sel && changed.current}
            onSelect={() => setSel(o.id)}
            soldOut={isSoldOut(stock, o.id)}
            tabRef={(el) => (tiles.current[k] = el)}
            onKeyDown={radioKeyHandler(k, OFFERS.length, (j) => setSel(OFFERS[j].id), tiles)}
          />
        ))}
      </div>
      <p className="mt-2.5 text-center text-[0.76rem] text-fr-muted lg:text-left lg:text-[0.8rem]" aria-live="polite">
        <Swap value={offer.id}>
          {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules · ≈ {cents(offer)} ct par lavage
          {save > 0 && (
            <span className="hidden font-semibold text-fr-green lg:inline">
              {' '}
              · {formatCHF(save)} de moins que {offer.packs} × {formatCHF(OFFERS[0].price)}
            </span>
          )}
        </Swap>
      </p>

      {/* Achat direct (principal) : sélection → page de commande, sans passer par le panier.
          Ajout au panier (secondaire) : pour vérifier ou modifier avant de commander. */}
      <div ref={ctaRef} className="mt-4 grid gap-2.5">
        <button
          onClick={direct}
          disabled={soldOut}
          className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-fr-green text-[1rem] font-extrabold text-white shadow-[0_14px_28px_rgba(14,122,71,0.28)] transition-[transform,background-color,box-shadow] duration-base ease-out-soft hover:bg-[#0C6B3E] can-hover:hover:-translate-y-px can-hover:hover:shadow-[0_18px_32px_rgba(14,122,71,0.32)] active:translate-y-0 motion-safe:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-fr-muted disabled:shadow-none lg:h-[3.75rem] lg:text-[1.05rem]"
        >
          {soldOut ? (
            allSoldOut ? 'Épuisé' : 'Offre épuisée'
          ) : (
            <>
              <span>
                Acheter maintenant · <Swap value={offer.id}><Chf v={offer.price} format={formatCHF} /></Swap>
              </span>
              <ArrowRight size={18} className="transition-transform duration-base ease-out-soft can-hover:group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        {soldOut && !allSoldOut && (
          <p role="status" className="text-center text-[0.8rem] font-semibold text-fr-muted lg:text-left">
            {offer.packs} sachet{offer.packs > 1 ? 's' : ''} : épuisé pour le moment. Choisissez une autre offre ci‑dessus.
          </p>
        )}
        {!soldOut && (
          <button
            onClick={add}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-fr-green bg-white text-[0.95rem] font-bold text-fr-green transition-[background-color,transform] duration-base ease-out-soft hover:bg-fr-mint motion-safe:active:scale-[0.99] lg:h-[3.25rem]"
          >
            {added ? (
              <>
                <Check size={18} strokeWidth={2.6} className="animate-pop" /> Ajouté au panier
              </>
            ) : (
              <>
                <ShoppingBag size={18} strokeWidth={1.9} /> Ajouter au panier
              </>
            )}
          </button>
        )}
      </div>

      <UrgencyPanel status={status} offer={offer} />

      <ul className="mt-4 grid grid-cols-3 gap-2 lg:mt-5 lg:gap-3">
        {[
          [Truck, 'Livraison offerte', 'en Suisse'],
          [RotateCcw, `Retour ${DELIVERY.returnWindowDays} jours`, 'après réception'],
          [LockKeyhole, 'Paiement sécurisé', 'prestataire spécialisé'],
        ].map(([Icon, t, s]) => (
          <li key={t} className="flex flex-col items-center gap-1.5 rounded-2xl bg-fr-soft px-1 py-3 text-center lg:flex-row lg:gap-3 lg:px-3.5 lg:text-left">
            <IconTile icon={Icon} size="sm" tone="white" />
            <span className="leading-tight">
              <span className="block text-[0.72rem] font-bold text-fr-ink lg:text-[0.8rem]">{t}</span>
              <span className="block text-[0.64rem] text-fr-muted lg:text-[0.7rem]">{s}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.68rem] leading-relaxed text-fr-muted">
        * Au dosage standard d’une capsule par lavage. Le nombre de lavages dépend de la charge et de la dureté de l’eau.
      </p>
    </div>
  )
})

export default function HeroF({ sel, setSel, ctaRef, status, reviewState }) {
  return (
    <section aria-label="Produit et offres" className="mx-auto max-w-[1320px] px-4 pb-10 pt-3 lg:grid lg:grid-cols-[1.08fr_1fr] lg:items-start lg:gap-12 lg:px-8 lg:pb-16 lg:pt-8 xl:gap-16">
      <div className="lg:sticky lg:top-24">
        <Stage packs={getOffer(sel).packs} />
      </div>
      <div className="pt-4 lg:pt-2">
        <BuyBox ref={ctaRef} sel={sel} setSel={setSel} status={status} reviewState={reviewState} />
      </div>
    </section>
  )
}
