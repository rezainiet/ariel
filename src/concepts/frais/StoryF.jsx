import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WashingMachine, Play, ArrowRight, Check } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { centsPerWash } from '../../config/store.js'
import { useI18n } from '../../i18n/index.jsx'
import { IMAGES } from '../../config/assets.js'
import { isSoldOut } from '../../lib/stock.js'
import { Swap } from '../../lib/motion.js'
import { radioKeyHandler } from '../shared/hooks.js'
import { IconTile, PodIcon, Chf } from './Icons.jsx'
import { Rise, RevealFrame, useRevealed } from './motion.jsx'
import { STORY } from './mediaF.js'
import { COLD_HOTSPOTS } from './contentF.js'
import { Packs } from './HeroF.jsx'

// ─────────────────────────────────────────────────────────────
// Récit produit, de haut en bas : 1. le geste · 2. la quantité (reliée à l'offre choisie)
// · 3. ce que promet l'emballage. Chaque section a sa propre entrée (cadre, côté, échelle),
// toujours avec les mêmes durées ; rien ne bouge en continu.
// ─────────────────────────────────────────────────────────────

const W = 'mx-auto max-w-[1320px] px-4 lg:px-8'
const cents = (o) => String(centsPerWash(o)).replace('.', ',')

// Achat direct : l'offre est placée au panier (sans doublon) puis la commande s'ouvre.
function useBuyNow() {
  const { selectOffer } = useCart()
  const navigate = useNavigate()
  return (id) => {
    selectOffer(id, { openDrawer: false, feedback: false })
    navigate('/checkout')
  }
}

function Pic({ p, alt, className, sizes = '(min-width:1024px) 50vw, 100vw' }) {
  return (
    <picture>
      {p.avif && <source type="image/avif" srcSet={p.avif} sizes={sizes} />}
      {p.webp && <source type="image/webp" srcSet={p.webp} sizes={sizes} />}
      <img src={p.src} alt={alt} width={p.width} height={p.height} loading="lazy" className={className} />
    </picture>
  )
}

function Kicker({ n, children }) {
  return (
    <p className="flex items-center gap-3 font-jakarta text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">
      <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-fr-green px-1.5 text-[0.66rem] tracking-normal text-white">{n}</span>
      {children}
    </p>
  )
}

function Title({ id, children, className = '' }) {
  return (
    <h2 id={id} className={`mt-4 font-jakarta text-[1.85rem] font-extrabold leading-[1.04] tracking-[-0.022em] text-fr-ink min-[400px]:text-[2.05rem] lg:text-[2.9rem] xl:text-[3.2rem] ${className}`}>
      {children}
    </h2>
  )
}

// ── 1 · Le geste : la photo s'ouvre, puis les trois étapes se posent le long d'un fil qui se dessine ──
const GESTURE_ICONS = { pod: PodIcon, load: WashingMachine, run: Play }

function Gesture() {
  const g = useI18n().t.story.gesture
  const [ref, shown] = useRevealed({ threshold: 0.2 })
  return (
    <section id="pourquoi" data-analytics-section="story" aria-labelledby="geste-titre" className={`${W} scroll-mt-20 grid items-center gap-8 py-14 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:py-24`}>
      <div className="relative">
        <RevealFrame className="aspect-[4/3.3] bg-fr-mint lg:aspect-[5/6]">
          <Pic p={STORY.podHand} alt={g.photoAlt} className="h-full w-full object-cover object-[50%_38%]" sizes="(min-width:1024px) 640px, 100vw" />
        </RevealFrame>
        <Rise from="scale" delay={380} className="absolute -bottom-5 right-4 w-[30%] max-w-[12rem] lg:-bottom-8 lg:-right-6">
          <div className="overflow-hidden rounded-full border-[5px] border-white shadow-[0_18px_40px_rgba(11,61,42,0.22)] lg:border-[7px]">
            <img src={STORY.podWater.src} alt={g.closeUpAlt} loading="lazy" className="aspect-square w-full object-cover" />
          </div>
        </Rise>
        <Rise delay={240} className="absolute left-4 top-4 lg:left-6 lg:top-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/95 py-1.5 pl-1.5 pr-3.5 font-jakarta text-[0.78rem] font-bold text-fr-ink shadow-md">
            <IconTile icon={PodIcon} size="sm" round /> {g.dose}
          </span>
        </Rise>
      </div>

      <div className="pt-2 lg:pt-0">
        <Rise>
          <Kicker n="1">{g.kicker}</Kicker>
          <Title id="geste-titre">
            {g.title[0]}
            <span className="block text-fr-green">{g.title[1]}</span>
          </Title>
          <p className="mt-4 max-w-md font-jakarta text-[0.98rem] leading-relaxed text-fr-muted lg:mt-5 lg:text-[1.05rem]">
            {g.intro}
          </p>
        </Rise>
        <ol ref={ref} className={`relative mt-6 space-y-4 lg:mt-8 lg:space-y-5 ${shown ? 'is-in' : ''}`}>
          <span className="reveal-line absolute bottom-5 left-[1.06rem] top-5 w-px bg-gradient-to-b from-fr-green/50 to-fr-line lg:left-[1.37rem]" aria-hidden="true" />
          {g.steps.map((s, k) => (
            <Rise as="li" from="left" key={s.key} delay={160 + k * 110} className="relative flex items-start gap-3.5 font-jakarta">
              <IconTile icon={GESTURE_ICONS[s.key]} size="sm" className="relative lg:!h-11 lg:!w-11 lg:!rounded-[14px]" />
              <span className="pt-0.5">
                <span className="block text-[0.95rem] font-bold leading-snug text-fr-ink lg:text-[1.02rem]">
                  <span className="sr-only">{g.step(k + 1)}</span>
                  {s.title}
                </span>
                <span className="block text-[0.84rem] leading-snug text-fr-muted lg:text-[0.9rem]">{s.body}</span>
              </span>
            </Rise>
          ))}
        </ol>
        <p className="mt-5 font-jakarta text-[0.78rem] text-fr-muted">{g.note}</p>
      </div>
    </section>
  )
}

// ── 2 · La quantité : reliée à l'offre choisie dans le héros (même état, même prix) ──
function CapsuleGrid({ packs, shown }) {
  return (
    <div className="flex items-end justify-center gap-3 lg:gap-5" aria-hidden="true">
      {Array.from({ length: packs }).map((_, g) => (
        <div key={g} className="flex animate-swap-in flex-col items-center gap-2" style={{ animationDelay: `${g * 70}ms` }}>
          <img src={IMAGES.packshotCutout} alt="" className="w-10 drop-shadow-[0_6px_8px_rgba(11,61,42,0.18)] lg:w-14" />
          <div className="grid grid-cols-6 gap-[3px] rounded-xl bg-fr-mint p-2 lg:gap-1 lg:p-2.5">
            {Array.from({ length: 60 }).map((_, k) => (
              <span
                key={k}
                className="h-[7px] w-[7px] rounded-[2.5px] bg-gradient-to-br from-[#3FC283] to-[#4C9BE8] transition-[opacity,transform] duration-base ease-out-soft lg:h-2 lg:w-2"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'scale(1)' : 'scale(0.3)',
                  transitionDelay: shown ? `${g * 110 + k * 4}ms` : '0ms',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Quantity({ sel, setSel, stock, soldOut }) {
  const buyNow = useBuyNow()
  const { t, money, local, localAmount, localSavings, estimated, offers: OFFERS, offer: getOffer } = useI18n()
  const q = t.story.quantity
  const sachets = t.common.sachets
  const [ref, shown] = useRevealed({ threshold: 0.25 })
  const tiles = useRef([])
  const offer = getOffer(sel)
  const idx = OFFERS.findIndex((o) => o.id === sel)
  const save = localSavings(offer)
  return (
    <section id="f-quantite" data-analytics-section="quantity" aria-labelledby="quantite-titre" className="scroll-mt-20 bg-gradient-to-b from-fr-mint/70 to-fr-mint/20 py-14 lg:py-24">
      <div className={`${W} grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16`}>
        <div>
          <Rise from="right">
            <Kicker n="2">{q.kicker}</Kicker>
          </Rise>
          <Rise from="right" delay={80} className="relative mt-2 flex items-end gap-4 lg:mt-0">
            <span className="bg-gradient-to-br from-fr-leaf via-fr-green to-fr-deep bg-clip-text font-jakarta text-[6rem] font-extrabold leading-[0.85] tracking-[-0.05em] text-transparent lg:text-[13.5rem]">
              60
            </span>
            <img
              src={IMAGES.packshotCutout}
              alt={q.packAlt}
              loading="lazy"
              className="mb-1 w-[30%] max-w-[15rem] rotate-[5deg] drop-shadow-[0_24px_28px_rgba(11,61,42,0.25)] lg:mb-3 lg:w-[38%]"
            />
          </Rise>
          <Rise from="right" delay={150}>
            <Title id="quantite-titre" className="!mt-3">
              {q.title}
            </Title>
            <p className="mt-4 max-w-md font-jakarta text-[0.98rem] leading-relaxed text-fr-muted lg:text-[1.05rem]">
              {q.intro}
            </p>
          </Rise>
        </div>

        <Rise from="scale" delay={100}>
          <div ref={ref} className="rounded-[1.75rem] bg-white p-4 shadow-[0_24px_60px_rgba(11,61,42,0.10)] ring-1 ring-fr-line lg:p-7">
            {/* Même sélection que « Choisir mon offre » : la pastille glisse d'une offre à l'autre */}
            <div role="radiogroup" aria-label={q.group} className="relative grid grid-cols-3 rounded-full bg-fr-soft p-1 font-jakarta">
              <span
                aria-hidden="true"
                className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-fr-deep shadow-md transition-transform duration-slow ease-out-soft"
                style={{ transform: `translateX(${idx * 100}%)` }}
              />
              {OFFERS.map((o, k) => {
                const on = o.id === sel
                const out = isSoldOut(stock, o.id)
                return (
                  <button
                    key={o.id}
                    ref={(el) => (tiles.current[k] = el)}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setSel(o.id)}
                    onKeyDown={radioKeyHandler(k, OFFERS.length, (j) => setSel(OFFERS[j].id), tiles)}
                    className={`relative z-10 flex h-12 flex-col items-center justify-center rounded-full leading-tight transition-colors duration-base ${
                      on ? 'text-white' : 'text-fr-muted hover:text-fr-ink'
                    }`}
                  >
                    <span className="text-[0.82rem] font-bold">{sachets(o.packs)}</span>
                    <span className={`text-[0.68rem] font-semibold ${on ? 'text-fr-mint' : ''}`}>{out ? t.common.soldOut : local(o.price)}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex min-h-[10rem] items-end justify-center lg:min-h-[12.5rem]">
              <CapsuleGrid key={offer.packs} packs={offer.packs} shown={shown} />
            </div>
            <dl className="mt-6 grid grid-cols-3 divide-x divide-fr-line border-y border-fr-line py-3 text-center font-jakarta">
              <div>
                <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-fr-muted">{q.capsules}</dt>
                <dd className="mt-0.5 text-[1.35rem] font-extrabold tabular-nums text-fr-ink lg:text-[1.6rem]">
                  <Swap value={offer.id}>{offer.washes}</Swap>
                </dd>
              </div>
              <div>
                <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-fr-muted">{q.total}</dt>
                <dd className="mt-0.5 text-[1.35rem] font-extrabold tabular-nums text-fr-ink lg:text-[1.6rem]">
                  <Swap value={offer.id}>
                    <Chf v={offer.price} format={local} />
                  </Swap>
                </dd>
              </div>
              <div>
                <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-fr-muted">{q.perWash}</dt>
                <dd className="mt-0.5 text-[1.35rem] font-extrabold tabular-nums text-fr-green lg:text-[1.6rem]">
                  {/* Centimes en CHF ; en monnaie locale, le montant par lavage dans cette devise */}
                  <Swap value={offer.id}>{estimated ? local(offer.price / offer.washes) : q.cents(cents(offer))}</Swap>
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex min-h-[2.75rem] flex-wrap items-center justify-between gap-3">
              <Swap value={offer.id} as="p" className="font-jakarta text-[0.8rem] text-fr-muted">
                {save > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-fr-mint px-2.5 py-1 font-bold text-fr-green">
                    <Check size={13} strokeWidth={3} /> {q.saveVs(localAmount(save), offer.packs, local(OFFERS[0].price))}
                  </span>
                ) : (
                  q.discovery
                )}
              </Swap>
              {/* Desktop : action directe ici. Mobile : la barre d'achat en bas d'écran suit déjà cette sélection. */}
              <button
                type="button"
                onClick={() => buyNow(sel)}
                disabled={soldOut}
                className="hidden h-11 items-center gap-2 rounded-full bg-fr-green px-5 font-jakarta text-[0.88rem] font-bold text-white transition-[background-color,transform] duration-base ease-out-soft hover:bg-[#0C6B3E] motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-fr-muted lg:inline-flex"
              >
                {soldOut ? (
                  t.common.offerSoldOut
                ) : (
                  <>
                    {q.buy(offer.packs)}<Chf v={offer.price} format={local} /> <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
            {soldOut && (
              <p role="status" className="mt-3 animate-reveal-down rounded-xl bg-fr-soft px-3 py-2 font-jakarta text-[0.8rem] font-semibold text-fr-ink lg:hidden">
                {q.soldOutNote(offer.packs)}
              </p>
            )}
            <p className="mt-3 font-jakarta text-[0.7rem] text-fr-muted">
              {q.footnote}
              {estimated && <span className="mt-0.5 block">{t.price.charged(money(offer.price))} · {t.price.short(offer.currency)}</span>}
            </p>
          </div>
        </Rise>
      </div>
    </section>
  )
}

// ── 3 · Sur l'emballage : la photo se pose, puis les repères apparaissent un à un ──
function OnPack() {
  const p = useI18n().t.story.onPack
  // Positions sur la photo + libellés de la langue affichée (quote = texte imprimé, absent en allemand).
  const spots = COLD_HOTSPOTS.map((pos, k) => ({ ...pos, ...p.hotspots[k] }))
  const [active, setActiveRaw] = useState(null)
  const [explored, setExplored] = useState(false)
  const [photoRef, photoShown] = useRevealed({ threshold: 0.3 })
  const setActive = (k) => {
    setActiveRaw(k)
    if (k !== null) setExplored(true)
  }
  return (
    <section id="f-froid" data-analytics-section="product" aria-labelledby="froid-titre" className={`${W} scroll-mt-20 grid items-center gap-7 py-14 lg:grid-cols-[1fr_1.08fr] lg:gap-16 lg:py-24`}>
      <div className="order-2 lg:order-1">
        <Rise from="left">
          <Kicker n="3">{p.kicker}</Kicker>
          <Title id="froid-titre">
            {p.title[0]}
            <span className="block text-fr-green">{p.title[1]}</span>
          </Title>
          <p className="mt-4 max-w-md font-jakarta text-[0.98rem] leading-relaxed text-fr-muted lg:mt-5 lg:text-[1.05rem]">
            {p.intro}
          </p>
        </Rise>
        <ol className="mt-6 space-y-2" onMouseLeave={() => setActive(null)}>
          {spots.map((h, k) => (
            <Rise
              as="li"
              from="left"
              key={k}
              delay={120 + k * 90}
              onMouseEnter={() => setActive(k)}
              className={`flex cursor-default items-start gap-3.5 rounded-2xl p-3 font-jakarta lg:p-3.5 ${active === k ? 'bg-fr-mint' : 'bg-fr-soft lg:bg-transparent'}`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[0.7rem] font-extrabold text-white transition-colors duration-base ${
                  active === k ? 'bg-fr-deep' : 'bg-fr-green'
                }`}
              >
                {k + 1}
              </span>
              <span>
                <span lang={h.quote ? undefined : 'de'} className="block text-[0.95rem] font-bold leading-snug text-fr-ink">{h.label}</span>
                {h.quote && (
                  <span lang="de" className="mt-0.5 block text-[0.78rem] italic text-fr-muted">
                    « {h.quote} »
                  </span>
                )}
              </span>
            </Rise>
          ))}
        </ol>
        <p className="mt-4 font-jakarta text-[0.72rem] text-fr-muted">{p.note}</p>
      </div>

      {/* Photo avec repères posés à côté des mentions imprimées */}
      <div ref={photoRef} className={`relative order-1 lg:order-2 ${photoShown ? 'is-in' : ''}`}>
        {/* Cadre au format exact de la photo (4:5) : les repères, en % de l'image, restent sur le texte imprimé. */}
        <RevealFrame className="aspect-[4/5]">
          <Pic p={STORY.cold} alt={p.photoAlt} className="h-full w-full object-cover" />
        </RevealFrame>
        {spots.map((h, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActive(active === k ? null : k)}
            onMouseEnter={() => setActive(k)}
            onFocus={() => setActive(k)}
            onBlur={() => setActive(null)}
            aria-label={p.marker(k + 1, h.label)}
            aria-pressed={active === k}
            className="group absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            {!explored && photoShown && (
              <span className="absolute inset-2 animate-ping rounded-full bg-white/70 motion-reduce:hidden" style={{ animationDuration: '2.4s', animationIterationCount: 2, animationDelay: `${900 + k * 160}ms` }} />
            )}
            <span className="seq-item" style={{ '--seq-delay': `${500 + k * 160}ms` }}>
              <span
                className={`relative flex h-7 w-7 items-center justify-center rounded-full font-jakarta text-[0.72rem] font-extrabold text-white shadow-[0_6px_16px_rgba(10,30,20,0.35)] ring-2 ring-white transition-[transform,background-color] duration-base ease-out-soft lg:h-8 lg:w-8 ${
                  active === k ? 'scale-110 bg-fr-deep' : 'bg-fr-green can-hover:group-hover:scale-110'
                }`}
              >
                {k + 1}
              </span>
            </span>
          </button>
        ))}
        <div
          className={`pointer-events-none absolute inset-x-3 top-3 z-20 rounded-2xl bg-white/95 p-3 font-jakarta shadow-[0_14px_34px_rgba(11,61,42,0.18)] transition-[opacity,transform] duration-base ease-out-soft lg:inset-x-6 lg:top-6 lg:p-4 ${
            active === null ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          aria-live="polite"
        >
          {active !== null && (
            <>
              <p lang={spots[active].quote ? undefined : 'de'} className="text-[0.92rem] font-bold text-fr-ink">{spots[active].label}</p>
              {spots[active].quote && (
                <p lang="de" className="text-[0.76rem] italic text-fr-muted">
                  « {spots[active].quote} »
                </p>
              )}
            </>
          )}
        </div>
        <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-jakarta text-[0.72rem] font-semibold text-fr-ink shadow-md lg:bottom-5 lg:left-5">
          <span className="h-1.5 w-1.5 rounded-full bg-fr-green" /> {p.touch}
        </span>
      </div>
    </section>
  )
}

// ── Récit complet ──
export default function StoryF({ sel, setSel, stock, soldOut }) {
  return (
    <div className="bg-white">
      <Gesture />
      <Quantity sel={sel} setSel={setSel} stock={stock} soldOut={soldOut} />
      <OnPack />
    </div>
  )
}

// ── Dernière étape (desktop) : rappel de l'offre choisie et une seule action.
// Sur mobile, la barre d'achat en bas d'écran tient ce rôle : pas de second appel concurrent. ──
export function FinalCta({ sel, soldOut }) {
  const buyNow = useBuyNow()
  const { t, money, local, estimated, offer: getOffer } = useI18n()
  const f = t.story.final
  const offer = getOffer(sel)
  return (
    <section data-analytics-section="final" aria-label={f.label} className="hidden bg-white pb-20 lg:block">
      <div className={W}>
        <Rise from="scale" className="flex items-center gap-8 rounded-[2rem] bg-gradient-to-br from-fr-deep to-[#0E5A3A] px-10 py-8 font-jakarta text-white">
          <span className="flex h-24 w-32 flex-none items-end justify-center rounded-2xl bg-white/10 pb-2">
            <Swap value={offer.id} anim="animate-swap-in" className="flex">
              <Packs n={offer.packs} size="lg" />
            </Swap>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-leaf">{f.kicker}</p>
            <p className="mt-1 text-[1.6rem] font-extrabold tracking-[-0.02em]">
              <Swap value={offer.id}>
                {f.line(offer.packs, offer.washes)}<Chf v={offer.price} format={local} />
              </Swap>
            </p>
            {estimated && <p className="text-[0.8rem] font-semibold text-fr-mint/80">{t.price.charged(money(offer.price))} · {t.price.short(offer.currency)}</p>}

            <p className="mt-1 text-[0.86rem] text-fr-mint/80">
              {f.note}
              <a href="#offres" className="font-semibold text-white underline-offset-2 hover:underline">
                {f.change}
              </a>
            </p>
          </div>
          <button
            type="button"
            onClick={() => buyNow(sel)}
            disabled={soldOut}
            className="flex h-14 flex-none items-center gap-2.5 rounded-full bg-white px-7 text-[1rem] font-extrabold text-fr-deep shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition-[transform,background-color] duration-base ease-out-soft hover:bg-fr-mint can-hover:hover:-translate-y-px motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {soldOut ? t.common.offerSoldOut : f.buyNow} {!soldOut && <ArrowRight size={18} />}

          </button>
        </Rise>
      </div>
    </section>
  )
}
