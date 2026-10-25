import { forwardRef, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ShoppingBag, ArrowRight, Truck, RotateCcw, LockKeyhole, ThermometerSnowflake, Expand, ChevronLeft, ChevronRight, Star, Crown, Shirt, Snowflake, Leaf, Package } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { OFFERS as BASE_OFFERS } from '../../config/store.js'
import { useI18n } from '../../i18n/index.jsx'
import { IMAGES } from '../../config/assets.js'
import { useFlash, radioKeyHandler, useSwipe } from '../shared/hooks.js'
import Lightbox from '../shared/Lightbox.jsx'
import { IconTile, PodIcon, Chf } from './Icons.jsx'
import UrgencyPanel from './Urgency.jsx'
import { GALLERY_F } from './mediaF.js'
import { useStock, isSoldOut } from '../../lib/stock.js'
import { Swap } from '../../lib/motion.js'
import { summarize } from '../../data/reviews.js'

// Petite pile de sachets réels (même visuel que le panier).
export function Packs({ n, size = 'md' }) {
  const w = { sm: 'w-7', md: 'w-10', lg: 'w-12', offer: 'w-11 min-[380px]:w-14 lg:w-[4.75rem]' }[size]
  const ml = { sm: '-ml-[1.05rem]', md: '-ml-6', lg: '-ml-7', offer: '-ml-7 min-[380px]:-ml-8 lg:-ml-11' }[size]
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
  const style = item.position ? { objectPosition: item.position } : undefined
  if (!item.picture)
    return <img src={item.src} alt={item.alt} loading={eager ? 'eager' : 'lazy'} className={className} style={style} />
  const p = item.picture
  return (
    <picture className="block h-full w-full">
      {p.avif && <source type="image/avif" srcSet={p.avif} sizes="(min-width:1024px) 640px, 100vw" />}
      {p.webp && <source type="image/webp" srcSet={p.webp} sizes="(min-width:1024px) 640px, 100vw" />}
      <img src={p.src} alt={item.alt} width={p.width} height={p.height} loading={eager ? 'eager' : 'lazy'} className={className} style={style} />
    </picture>
  )
}

// Textes : t.hero.chips (même ordre).
const CHIPS = [
  { icon: PodIcon, pos: 'left-4 top-4 lg:left-8 lg:top-8' },
  { icon: ThermometerSnowflake, pos: 'bottom-24 right-8 hidden lg:flex' },
  { icon: Check, pos: 'left-8 top-[6.6rem] hidden lg:flex' },
]

// Sachets en retrait (2e et 3e) : se placent derrière le sachet principal selon l'offre choisie.
const BACK_PACKS = [
  'translate-x-[-34%] translate-y-[3%] -rotate-[7deg] scale-[0.84]',
  'translate-x-[34%] translate-y-[3%] rotate-[7deg] scale-[0.84]',
]

// Scène produit : panneau menthe, packshots réels (autant que de sachets dans l'offre), puces factuelles,
// vignettes, zoom plein écran. Changer d'offre ramène la scène sur les sachets.
function Stage({ packs }) {
  const { t } = useI18n()
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(null)
  const gallery = GALLERY_F.map((g, k) => ({ ...g, ...t.gallery[k] }))
  const n = gallery.length
  const go = (d) => setI((v) => (v + d + n) % n)
  const swipe = useSwipe(() => go(-1), () => go(1))
  const item = gallery[i]
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
        {gallery.map((g, k) => (
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
          CHIPS.map((c, k) => (
            <div key={k} className={`absolute z-10 flex animate-fade-in items-center gap-2.5 rounded-2xl bg-white/95 py-2 pl-2 pr-3.5 shadow-[0_12px_30px_rgba(11,61,42,0.12)] lg:py-2.5 lg:pl-2.5 lg:pr-4 ${c.pos}`}>
              <IconTile icon={c.icon} size="sm" />
              <span className="font-jakarta leading-tight">
                <span className="block text-[0.76rem] font-bold text-fr-ink lg:text-[0.84rem]">{t.hero.chips[k][0]}</span>
                <span className="block text-[0.66rem] text-fr-muted lg:text-[0.72rem]">{t.hero.chips[k][1]}</span>
              </span>
            </div>
          ))}

        <button
          onClick={() => setZoom(i)}
          aria-label={t.hero.zoom}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-fr-deep shadow-md transition-[transform,background-color] duration-base ease-out-soft hover:bg-white can-hover:hover:scale-105 motion-safe:active:scale-95 lg:right-6 lg:top-6"
        >
          <Expand size={17} strokeWidth={1.9} />
        </button>
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 lg:hidden" role="tablist" aria-label={t.hero.photos}>
          {gallery.map((g, k) => (
            <button
              key={g.src}
              role="tab"
              aria-selected={k === i}
              aria-label={t.hero.photoN(k + 1, g.caption)}
              onClick={() => setI(k)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-slow ease-out-soft ${k === i ? 'w-5 bg-fr-deep' : 'w-1.5 bg-fr-deep/25'}`}
            />
          ))}
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 lg:flex">
          <button onClick={() => go(-1)} aria-label={t.hero.prevPhoto} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-fr-deep shadow-md transition-[transform,background-color] duration-base ease-out-soft hover:bg-white motion-safe:active:scale-95">
            <ChevronLeft size={18} />
          </button>
          <Swap value={i} anim="animate-fade-in" className="rounded-full bg-white/90 px-3 py-1.5 font-jakarta text-xs font-semibold text-fr-ink shadow-md">{item.caption}</Swap>
          <button onClick={() => go(1)} aria-label={t.hero.nextPhoto} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-fr-deep shadow-md transition-[transform,background-color] duration-base ease-out-soft hover:bg-white motion-safe:active:scale-95">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Vignettes desktop */}
      <div className="mt-3 hidden gap-3 lg:flex">
        {gallery.map((g, k) => (
          <button
            key={g.src}
            onClick={() => setI(k)}
            aria-label={t.hero.showPhoto(g.caption)}
            aria-current={k === i}
            className={`h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl bg-fr-mint transition-[opacity,box-shadow] duration-base ease-out-soft ${
              k === i ? 'ring-2 ring-fr-green ring-offset-2' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <img src={g.kind === 'cutout' ? g.src : g.thumb || g.picture?.src || g.src} alt="" loading="lazy" className={`h-full w-full ${g.kind === 'cutout' ? 'object-contain p-1.5' : 'object-cover'}`} />
          </button>
        ))}
      </div>
      <Lightbox images={gallery.map((g) => ({ src: g.picture?.src || g.src, alt: g.alt }))} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </div>
  )
}

// ── Éléments « affiche promo » (visuel de campagne validé par le marchand) ──
const RED = '#E30613'
const YELLOW = '#FFE600'
// « 4 CHF », « 24,95 CHF », « 4 € » : format de l'affiche (le reste du site garde « CHF 4.– » / « 4,00 € »).
const posterNumber = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','))
const posterUnit = (currency) => (currency === 'EUR' ? '€' : currency)
const posterPrice = (v, currency) => `${posterNumber(v)} ${posterUnit(currency)}`

// Croix suisse (drapeau carré).
function SwissFlag({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="4" fill={RED} />
      <path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#fff" />
    </svg>
  )
}

// Bandeau « OFFRE SPÉCIALE » + accroche + pastille « Stock en Suisse ».
export function PromoBanner({ className = '' }) {
  const { promo } = useI18n().t.hero
  return (
    <div className={`font-jakarta ${className}`}>
      <div className="relative mx-auto w-fit -rotate-[2deg]">
        <span className="absolute inset-x-[-0.9rem] inset-y-[-0.15rem] -skew-x-[10deg] rounded-[0.4rem] shadow-[0_10px_22px_rgba(227,6,19,0.3)]" style={{ background: `linear-gradient(180deg,#FF2A2A 0%,${RED} 60%,#B8000F 100%)` }} aria-hidden="true" />
        <p className="relative whitespace-nowrap px-1 py-1 text-[2.15rem] font-extrabold uppercase italic leading-none tracking-[-0.03em] [text-shadow:0_2px_0_rgba(90,0,8,0.35)] max-[359px]:text-[1.85rem] min-[380px]:text-[2.4rem] lg:text-[2.9rem]">
          <span className="text-white">{promo.first}</span>
          <span style={{ color: YELLOW }}>{promo.second}</span>
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 lg:mt-4">
        <p className="-rotate-[2deg] text-[0.82rem] font-extrabold uppercase italic leading-[1.1] tracking-[-0.01em] text-fr-deep min-[380px]:text-[0.9rem] lg:text-base">
          {promo.tagline[0]}
          <br />
          {promo.tagline[1]} <span className="text-fr-leaf">♡</span>
        </p>
        <span className="flex flex-none rotate-[3deg] items-center gap-1.5 rounded-md py-1 pl-1 pr-2.5 text-white shadow-[0_8px_18px_rgba(227,6,19,0.28)]" style={{ background: RED }}>
          <SwissFlag className="h-7 w-7 [&>rect]:fill-white [&>path]:fill-[#E30613]" />
          <span className="text-[0.64rem] font-extrabold uppercase leading-[1.05] lg:text-[0.72rem]">
            {promo.stock[0]}
            <br />
            {promo.stock[1]}
          </span>
        </span>
      </div>
    </div>
  )
}

const BENEFIT_ICONS = [Shirt, Snowflake, Leaf]
const sup = (text) => <sup key="sup" className="text-[0.7em]">{text}</sup>

// Trois bénéfices de l'emballage, pastilles vertes — sous la scène produit, comme sur l'affiche.
// Textes : t.hero.benefits ; le second libellé reçoit `sup` pour l'exposant français (« 1er »).
function Benefits() {
  const { benefits } = useI18n().t.hero
  return (
    <ul className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-fr-soft px-2.5 py-3 lg:mt-4 lg:gap-3 lg:px-4">
      {benefits.map(([t, s], k) => [BENEFIT_ICONS[k], t, s(sup)]).map(([Icon, t, s]) => (
        <li key={t} className="flex items-center gap-1.5 lg:gap-2.5">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-b from-fr-leaf to-fr-green text-white shadow-[0_6px_14px_rgba(14,122,71,0.28)] lg:h-11 lg:w-11">
            <Icon size={18} strokeWidth={2.1} />
          </span>
          <span className="text-[0.58rem] font-extrabold uppercase leading-[1.15] text-fr-deep min-[380px]:text-[0.62rem] lg:text-[0.72rem]">
            {t}
            <br />
            <span className="font-bold text-fr-deep/80">{s}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// Deux repères utiles, dans le même vert que l'emballage.
const BADGE_ICONS = [Truck, Package]
function PosterBadges() {
  const { badges } = useI18n().t.hero
  return (
    <ul className="mt-3 grid grid-cols-2 gap-2">
      {badges.map(([t, s], k) => [BADGE_ICONS[k], t, s]).map(([Icon, t, s]) => (
        <li key={s} className="flex min-w-0 items-center gap-2 rounded-xl border border-fr-green/10 bg-white/85 px-2.5 py-2.5 lg:gap-2.5 lg:px-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-fr-mint text-fr-green lg:h-9 lg:w-9">
            <Icon size={16} strokeWidth={2} />
          </span>
          <span className="text-[0.63rem] font-bold uppercase leading-[1.15] text-fr-deep min-[380px]:text-[0.7rem] lg:text-[0.75rem]">
            {t}
            <br />
            <span className="font-extrabold text-fr-green">{s}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// Même ordre visuel que le sachet : vert Ariel, filet jaune, packshot, puis prix rouge sur jaune.
// Seule l'offre sélectionnée porte le contour et la coche ; le badge populaire reste distinct.
function OfferCard({ o, active, glow, onSelect, tabRef, onKeyDown, soldOut }) {
  const { t, money } = useI18n()
  const h = t.hero
  return (
    <button
      ref={tabRef}
      role="radio"
      aria-checked={active}
      aria-label={h.offerAria({ packs: o.packs, washes: o.washes, price: money(o.price), compareAt: o.compareAt && money(o.compareAt), featured: o.featured, soldOut })}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`group relative flex min-w-0 flex-col rounded-[1rem] border-2 bg-white text-center font-jakarta transition-[border-color,box-shadow,transform,opacity] duration-base ease-out-soft motion-safe:active:scale-[0.985] ${
        active
          ? '-translate-y-0.5 border-fr-green shadow-[0_12px_26px_rgba(11,61,42,0.16)]'
          : 'border-fr-line shadow-[0_3px_12px_rgba(11,61,42,0.06)] can-hover:hover:-translate-y-0.5 can-hover:hover:border-fr-green/50 can-hover:hover:shadow-[0_9px_22px_rgba(11,61,42,0.12)]'
      } ${soldOut ? 'opacity-60' : ''} ${glow ? 'glow-once' : ''}`}
    >
      {o.featured && (
        <span
          className="absolute -top-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_4px_10px_rgba(227,6,19,0.18)] min-[380px]:text-[0.6rem] lg:px-3 lg:text-[0.65rem]"
          style={{ background: RED }}
        >
          <Crown size={11} strokeWidth={2.4} className="fill-[#FFE600] text-[#FFE600]" aria-hidden="true" />
          <span className="min-[360px]:hidden">{h.popularShort}</span>
          <span className="hidden min-[360px]:inline">{h.popular}</span>
        </span>
      )}

      <span className="relative block rounded-t-[0.85rem] bg-[#137D3F] px-1 pb-2 pt-3 text-white lg:pb-2.5 lg:pt-3.5">
        <span className="block text-[0.85rem] font-extrabold uppercase leading-none tracking-[-0.02em] min-[380px]:text-[1.08rem] lg:text-[1.28rem]">
          <span className="min-[380px]:hidden">{h.packsShort(o.packs)}</span>
          <span className="hidden min-[380px]:block">{t.common.sachets(o.packs)}</span>
        </span>
        <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.04em] text-white/90 min-[380px]:text-[0.68rem] lg:text-[0.76rem]">
          <span className="min-[380px]:hidden">{h.podsShort(o.washes)}</span>
          <span className="hidden min-[380px]:block">{t.common.capsules(o.washes)}</span>
        </span>
        <span
          className={`absolute -bottom-3 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#E30613] text-white ring-[3px] ring-white transition-[transform,opacity] duration-base ease-out-soft lg:h-7 lg:w-7 ${active ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
          aria-hidden="true"
        >
          <Check size={14} strokeWidth={3} />
        </span>
      </span>
      <span className="block h-1.5 w-full bg-[#FFE600]" aria-hidden="true" />

      <span className="flex h-[6rem] w-full items-center justify-center bg-[linear-gradient(180deg,#F4FBF5_0%,#FFFFFF_100%)] px-1 pt-2 lg:h-[7.25rem]">
        <span className={`transition-transform duration-slow ease-out-soft ${active ? 'scale-[1.05]' : ''}`}>
          <Packs n={o.packs} size="offer" />
        </span>
      </span>

      <span className="flex w-full flex-1 flex-col items-center justify-end px-1.5 pb-1.5 lg:px-2 lg:pb-2">
        {o.compareAt ? (
          <s className="py-1 text-[0.7rem] font-bold text-fr-muted decoration-[#E30613] decoration-[1.5px] min-[380px]:text-[0.78rem] lg:text-[0.9rem]">{posterPrice(o.compareAt, o.currency)}</s>
        ) : (
          <span className="text-[0.82rem]">&nbsp;</span>
        )}
        <span
          className="flex w-full items-baseline justify-center gap-1 rounded-[0.65rem] py-1.5 leading-none lg:py-2"
          style={{ background: YELLOW, color: RED }}
        >
          {soldOut ? (
            <span className="py-1.5 text-[0.9rem] font-extrabold uppercase text-fr-ink">{t.common.soldOut}</span>
          ) : (
            <>
              <span className="text-[1.9rem] font-extrabold tracking-[-0.055em] min-[380px]:text-[2.15rem] lg:text-[2.65rem]">
                {posterNumber(o.price)}
              </span>
              <span className="text-[1rem] font-extrabold tracking-[-0.03em] min-[380px]:text-[1.2rem] lg:text-[1.5rem]">{posterUnit(o.currency)}</span>
            </>
          )}
        </span>
      </span>
    </button>
  )
}

const BuyBox = forwardRef(function BuyBox({ sel, setSel, status, reviewState }, ctaRef) {
  const { selectOffer } = useCart()
  const { t, money, offers: OFFERS, offer: getOffer, savings } = useI18n()
  const h = t.hero
  const navigate = useNavigate()
  const [added, flash] = useFlash()
  const tiles = useRef([])
  const offer = getOffer(sel)
  const save = savings(offer)
  // Prix d'entrée et prix par capsule de l'offre la moins chère, dans la devise du visiteur.
  const entry = OFFERS.reduce((a, b) => (b.price < a.price ? b : a))
  const perCapsule = Math.round((entry.price / entry.washes) * 100) / 100
  const stock = useStock()
  const reviewSummary = reviewState.status === 'live' ? summarize(reviewState.reviews) : null
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
      <PromoBanner className="mb-7 hidden lg:block" />
      <h1 className="text-[2rem] font-extrabold leading-[1.02] tracking-[-0.022em] text-fr-ink min-[380px]:text-[2.2rem] lg:mt-4 lg:text-[3.2rem] xl:text-[3.5rem]">
        Ariel All‑in‑1&nbsp;PODS
      </h1>
      {reviewSummary && (
        <a href="#avis" className="mt-2 inline-flex items-center gap-2 rounded-md font-jakarta text-[0.78rem] text-fr-ink underline-offset-4 transition-colors hover:text-fr-green hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fr-green lg:text-sm" aria-label={h.ratingAria(reviewSummary.average.toFixed(1).replace('.', ','), reviewSummary.count)}>
          <span className="inline-flex gap-0.5 text-fr-green" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} strokeWidth={1.5} className={n <= Math.round(reviewSummary.average) ? 'fill-current' : ''} />)}
          </span>
          <span className="font-bold">{reviewSummary.average.toFixed(1).replace('.', ',')}</span>
          <span className="text-fr-muted">· {h.reviewCount(reviewSummary.count)}</span>
        </a>
      )}
      <p className="mt-1 text-[0.92rem] text-fr-muted lg:mt-3 lg:text-lg">{h.subtitle}</p>
      <div className="mt-2.5 flex items-end gap-2.5 lg:mt-5">
        <span className="pb-1.5 text-sm font-semibold text-fr-muted">{h.from}</span>
        <span className="text-[2.4rem] font-extrabold leading-none tracking-[-0.03em] text-fr-green lg:text-[3.6rem]"><Chf v={entry.price} format={money} /></span>
        <span className="pb-1.5 text-[0.78rem] text-fr-muted">{h.perCapsule(money(perCapsule))}</span>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-fr-green/10 bg-[linear-gradient(180deg,#F4FAF5_0%,#FFFFFF_100%)] p-3 shadow-[0_10px_30px_rgba(11,61,42,0.05)] lg:mt-7 lg:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="offres" className="scroll-mt-28 text-[1rem] font-extrabold text-fr-deep lg:text-[1.08rem]">{h.choose}</h2>
          <span className="text-[0.68rem] font-semibold text-fr-muted lg:text-[0.75rem]">{h.deliveryIncluded}</span>
        </div>
        <div role="radiogroup" aria-labelledby="offres" className="mt-6 grid grid-cols-3 gap-1.5 min-[380px]:gap-2 lg:mt-7 lg:gap-2.5">
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
        <PosterBadges />
      </div>
      <p className="mt-3 rounded-xl bg-fr-mint/65 px-3 py-2.5 text-[0.75rem] text-fr-deep lg:text-[0.8rem]" aria-live="polite">
        <Swap value={offer.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
          <span><strong className="font-bold">{h.yourChoice}</strong> {h.choiceLine(offer.packs, offer.washes)}</span>
          {save > 0 && (
            <span className="font-extrabold text-fr-green">{h.saveVsSingle(money(save))}</span>
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
            allSoldOut ? t.common.soldOut : t.common.offerSoldOut
          ) : (
            <>
              <span>
                {h.buyNow} · <Swap value={offer.id}><Chf v={offer.price} format={money} /></Swap>
              </span>
              <ArrowRight size={18} className="transition-transform duration-base ease-out-soft can-hover:group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        {soldOut && !allSoldOut && (
          <p role="status" className="text-center text-[0.8rem] font-semibold text-fr-muted lg:text-left">
            {h.offerSoldOutNote(offer.packs)}
          </p>
        )}
        {!soldOut && (
          <button
            onClick={add}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-fr-green bg-white text-[0.95rem] font-bold text-fr-green transition-[background-color,transform] duration-base ease-out-soft hover:bg-fr-mint motion-safe:active:scale-[0.99] lg:h-[3.25rem]"
          >
            {added ? (
              <>
                <Check size={18} strokeWidth={2.6} className="animate-pop" /> {h.added}
              </>
            ) : (
              <>
                <ShoppingBag size={18} strokeWidth={1.9} /> {h.addToCart}
              </>
            )}
          </button>
        )}
      </div>

      <UrgencyPanel status={status} offer={offer} />

      <ul className="mt-4 grid grid-cols-2 gap-2 lg:mt-5 lg:gap-3">
        {h.trust.map(([title, s], k) => [[RotateCcw, LockKeyhole][k], title, s]).map(([Icon, t, s]) => (
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
        {h.footnote}
      </p>
    </div>
  )
})

const OFFER_PACKS = Object.fromEntries(BASE_OFFERS.map((o) => [o.id, o.packs]))

export default function HeroF({ sel, setSel, ctaRef, status, reviewState }) {
  const { t } = useI18n()
  return (
    <section data-analytics-section="hero" aria-label={t.hero.section} className="mx-auto max-w-[1320px] px-4 pb-10 pt-3 lg:grid lg:grid-cols-[1.08fr_1fr] lg:items-start lg:gap-12 lg:px-8 lg:pb-16 lg:pt-8 xl:gap-16">
      <PromoBanner className="mb-4 lg:hidden" />
      <div className="lg:sticky lg:top-24">
        <Stage packs={OFFER_PACKS[sel]} />

        <Benefits />
      </div>
      <div className="pt-4 lg:pt-2">
        <BuyBox ref={ctaRef} sel={sel} setSel={setSel} status={status} reviewState={reviewState} />
      </div>
    </section>
  )
}
