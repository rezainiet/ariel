import { useState } from 'react'
import {
  WashingMachine,
  Hand,
  ThermometerSnowflake,
  Shirt,
  Play,
  ShieldCheck,
  ChevronDown,
  ArrowDown,
  Check,
  Snowflake,
} from 'lucide-react'
import { OFFERS, formatCHF, savingsFor, centsPerWash } from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import { IconTile, PodIcon, PouchIcon, Chf } from './Icons.jsx'
import { Rise, RevealFrame, useRevealed } from './motion.jsx'
import { STORY } from './mediaF.js'
import { COLD_HOTSPOTS, ROUTINE, PRODUCT_DETAILS } from './contentF.js'
import { Packs } from './HeroF.jsx'

const W = 'mx-auto max-w-[1320px] px-4 lg:px-8'
const cents = (o) => String(centsPerWash(o)).replace('.', ',')

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

function Title({ children, className = '' }) {
  return (
    <h3 className={`mt-4 font-jakarta text-[1.85rem] font-extrabold leading-[1.04] tracking-[-0.022em] text-fr-ink min-[400px]:text-[2.05rem] lg:text-[2.9rem] xl:text-[3.2rem] ${className}`}>
      {children}
    </h3>
  )
}

const CHAPTERS = [
  ['f-format', PodIcon, 'Le format'],
  ['f-quantite', PouchIcon, '60 capsules'],
  ['f-froid', Snowflake, 'Lavage à froid'],
  ['f-quotidien', Shirt, 'Au quotidien'],
]

// ── 1 · Le format ────────────────────────────────────────────
function FeatureFormat() {
  const points = [
    [PodIcon, 'Dose pré-mesurée', 'Rien à verser, rien à mesurer.'],
    [WashingMachine, 'Directement dans le tambour', 'Au fond du tambour vide, avant le linge.'],
    [Hand, 'Mains sèches', 'Manipulez la capsule avec des mains sèches.'],
  ]
  return (
    <article id="f-format" className={`${W} scroll-mt-24 grid items-center gap-7 lg:grid-cols-[1.12fr_1fr] lg:gap-16`}>
      <div className="relative">
        <RevealFrame className="aspect-square bg-fr-mint lg:aspect-[5/6]">
          <Pic p={STORY.podHand} alt="Une capsule Ariel tenue au-dessus du tambour d’un lave-linge" className="h-full w-full object-cover object-[50%_35%]" sizes="(min-width:1024px) 640px, 100vw" />
        </RevealFrame>
        <Rise delay={350} className="absolute -bottom-5 right-4 w-[34%] max-w-[13rem] lg:-bottom-8 lg:-right-6">
          <div className="overflow-hidden rounded-full border-[5px] border-white shadow-[0_18px_40px_rgba(11,61,42,0.22)] lg:border-[7px]">
            <img src={STORY.podWater.src} alt="La capsule en gros plan" loading="lazy" className="aspect-square w-full object-cover" />
          </div>
        </Rise>
        <Rise delay={200} className="absolute left-4 top-4 lg:left-6 lg:top-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3.5 font-jakarta text-[0.78rem] font-bold text-fr-ink shadow-md backdrop-blur">
            <IconTile icon={PodIcon} size="sm" round /> 1 capsule = 1 dose
          </span>
        </Rise>
      </div>

      <div className="pt-3 lg:pt-0">
        <Rise>
          <Kicker n="1">Le format</Kicker>
          <Title>
            Une capsule.
            <span className="block text-fr-green">Un geste simple.</span>
          </Title>
          <p className="mt-4 max-w-md font-jakarta text-[0.98rem] leading-relaxed text-fr-muted lg:mt-5 lg:text-[1.08rem]">
            Chaque capsule contient une dose de lessive prête à l’emploi. Posez-la au fond du tambour, ajoutez le linge, lancez
            votre programme.
          </p>
        </Rise>
        <ul className="mt-6 grid grid-cols-3 gap-2 lg:mt-8 lg:grid-cols-1 lg:gap-0 lg:divide-y lg:divide-fr-line lg:border-y lg:border-fr-line">
          {points.map(([Icon, t, b], k) => (
            <Rise as="li" key={t} delay={120 + k * 90} className="group flex flex-col items-center gap-2 rounded-2xl bg-fr-soft p-3 text-center lg:flex-row lg:items-center lg:gap-4 lg:rounded-none lg:bg-transparent lg:px-0 lg:py-4 lg:text-left">
              <IconTile icon={Icon} size="md" className="group-hover:bg-fr-green group-hover:text-white" />
              <span className="font-jakarta">
                <span className="block text-[0.74rem] font-bold leading-tight text-fr-ink lg:text-[0.98rem]">{t}</span>
                <span className="mt-0.5 hidden text-[0.88rem] text-fr-muted lg:block">{b}</span>
              </span>
            </Rise>
          ))}
        </ul>
        <p className="mt-4 font-jakarta text-[0.78rem] text-fr-muted">Jamais dans le bac à produits · d’après le mode d’emploi Ariel</p>
      </div>
    </article>
  )
}

// ── 2 · 60 capsules ─────────────────────────────────────────
function CapsuleGrid({ packs, shown }) {
  return (
    <div className="flex items-end justify-center gap-3 lg:gap-5" aria-hidden="true">
      {Array.from({ length: packs }).map((_, g) => (
        <div key={g} className="flex flex-col items-center gap-2">
          <img src={IMAGES.packshotCutout} alt="" className="w-11 drop-shadow-[0_6px_8px_rgba(11,61,42,0.18)] lg:w-14" />
          <div className="grid grid-cols-6 gap-[3px] rounded-xl bg-fr-mint p-2 lg:gap-1 lg:p-2.5">
            {Array.from({ length: 60 }).map((_, k) => (
              <span
                key={k}
                className="h-[7px] w-[7px] rounded-[2.5px] bg-gradient-to-br from-[#3FC283] to-[#4C9BE8] transition-[opacity,transform] duration-300 lg:h-2 lg:w-2"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'scale(1)' : 'scale(0.3)',
                  transitionDelay: shown ? `${g * 160 + k * 7}ms` : '0ms',
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function FeatureQuantity({ setSel }) {
  const [n, setN] = useState(3)
  const [ref, shown] = useRevealed({ threshold: 0.3 })
  const offer = OFFERS[n - 1]
  const save = savingsFor(offer)
  const choose = () => {
    setSel(offer.id)
    document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <article id="f-quantite" className="scroll-mt-24 bg-gradient-to-b from-fr-mint/70 to-fr-mint/20 py-14 lg:py-24">
      <div className={`${W} grid items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-16`}>
        <div className="relative">
          <Rise>
            <Kicker n="2">La quantité</Kicker>
          </Rise>
          <Rise delay={80} className="relative mt-2 flex items-end gap-4 lg:mt-0">
            <span className="bg-gradient-to-br from-fr-leaf via-fr-green to-fr-deep bg-clip-text font-jakarta text-[7.5rem] font-extrabold leading-[0.85] tracking-[-0.05em] text-transparent lg:text-[13.5rem]">
              60
            </span>
            <img
              src={IMAGES.packshotCutout}
              alt="Le sachet Ariel All-in-1 PODS de 60 capsules"
              loading="lazy"
              className="mb-1 w-[38%] max-w-[15rem] rotate-[5deg] drop-shadow-[0_24px_28px_rgba(11,61,42,0.25)] lg:mb-3"
            />
          </Rise>
          <Rise delay={140}>
            <Title className="!mt-3">capsules dans un seul sachet.</Title>
            <p className="mt-4 max-w-md font-jakarta text-[0.98rem] leading-relaxed text-fr-muted lg:text-[1.05rem]">
              Un sachet refermable de 60 capsules, soit 60 lavages au dosage standard d’une capsule. Le nombre réel dépend de la
              taille de la charge, du degré de salissure et de la dureté de l’eau.
            </p>
          </Rise>
        </div>

        {/* Comparaison des quantités, reliée au sélecteur d'offre */}
        <Rise delay={120}>
          <div ref={ref} className="rounded-[1.75rem] bg-white p-4 shadow-[0_24px_60px_rgba(11,61,42,0.10)] ring-1 ring-fr-line lg:p-7">
            <div role="tablist" aria-label="Comparer les offres" className="grid grid-cols-3 gap-1 rounded-full bg-fr-soft p-1 font-jakarta">
              {OFFERS.map((o) => (
                <button
                  key={o.id}
                  role="tab"
                  aria-selected={o.packs === n}
                  onClick={() => setN(o.packs)}
                  className={`h-10 rounded-full text-[0.82rem] font-bold transition-all duration-200 ${
                    o.packs === n ? 'bg-fr-deep text-white shadow-md' : 'text-fr-muted hover:text-fr-ink'
                  }`}
                >
                  {o.packs} sachet{o.packs > 1 ? 's' : ''}
                </button>
              ))}
            </div>
            <div className="mt-6 flex min-h-[10.5rem] items-end justify-center lg:min-h-[12.5rem]">
              <CapsuleGrid key={n} packs={n} shown={shown} />
            </div>
            <dl className="mt-6 grid grid-cols-3 divide-x divide-fr-line border-y border-fr-line py-3 text-center font-jakarta">
              <div>
                <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-fr-muted">Capsules</dt>
                <dd className="mt-0.5 text-[1.35rem] font-extrabold tabular-nums text-fr-ink lg:text-[1.6rem]">{offer.washes}</dd>
              </div>
              <div>
                <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-fr-muted">Prix total</dt>
                <dd className="mt-0.5 text-[1.35rem] font-extrabold tabular-nums text-fr-ink lg:text-[1.6rem]"><Chf v={offer.price} format={formatCHF} /></dd>
              </div>
              <div>
                <dt className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-fr-muted">Par lavage*</dt>
                <dd className="mt-0.5 text-[1.35rem] font-extrabold tabular-nums text-fr-green lg:text-[1.6rem]">{cents(offer)} ct</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="font-jakarta text-[0.8rem] text-fr-muted">
                {save > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-fr-mint px-2.5 py-1 font-bold text-fr-green">
                    <Check size={13} strokeWidth={3} /> {formatCHF(save)} de moins que {n} × {formatCHF(OFFERS[0].price)}
                  </span>
                ) : (
                  'Le format découverte'
                )}
              </p>
              <button onClick={choose} className="inline-flex h-11 items-center gap-2 rounded-full bg-fr-green px-5 font-jakarta text-[0.88rem] font-bold text-white transition-colors hover:bg-[#0C6B3E]">
                Choisir {n} sachet{n > 1 ? 's' : ''} <ArrowDown size={15} className="-rotate-90 lg:rotate-0" />
              </button>
            </div>
            <p className="mt-3 font-jakarta text-[0.7rem] text-fr-muted">* Au dosage standard d’une capsule par lavage.</p>
          </div>
        </Rise>
      </div>
    </article>
  )
}

// ── 3 · Lavage à froid ──────────────────────────────────────
// Cadran : l'arc se dessine jusqu'au froid quand la section apparaît.
function ColdDial({ shown }) {
  const R = 46
  const C = 2 * Math.PI * R
  return (
    <div className="relative h-28 w-28 flex-none lg:h-32 lg:w-32" aria-hidden="true">
      <span className={`absolute inset-3 rounded-full bg-fr-mint transition-transform duration-[1200ms] ${shown ? 'scale-100' : 'scale-75'}`} />
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#E4ECE7" strokeWidth="5" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="url(#coldGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={shown ? C * 0.3 : C}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1) 0.2s' }}
        />
        <defs>
          <linearGradient id="coldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#19A463" />
            <stop offset="100%" stopColor="#2F7FD8" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-fr-green">
        <ThermometerSnowflake size={38} strokeWidth={1.5} />
      </span>
    </div>
  )
}

function FeatureCold() {
  const [active, setActive] = useState(null)
  const [ref, shown] = useRevealed({ threshold: 0.25 })
  return (
    <article id="f-froid" className={`${W} scroll-mt-24 grid items-center gap-7 py-14 lg:grid-cols-[1fr_1.08fr] lg:gap-16 lg:py-24`}>
      <div ref={ref} className="order-2 lg:order-1">
        <Rise className="flex items-start gap-5 lg:block">
          <div className="hidden lg:mb-7 lg:block">
            <ColdDial shown={shown} />
          </div>
          <div>
            <Kicker n="3">La performance</Kicker>
            <Title>
              Pensé pour votre
              <span className="block text-fr-green">routine de lavage.</span>
            </Title>
          </div>
        </Rise>
        <Rise delay={100}>
          <p className="mt-4 max-w-md font-jakarta text-[0.98rem] leading-relaxed text-fr-muted lg:mt-5 lg:text-[1.05rem]">
            Ce que promet l’emballage, traduit de l’allemand : une capsule qui se dissout rapidement et un détachage dès le premier
            lavage, même à l’eau froide.
          </p>
        </Rise>
        <ol className="mt-6 space-y-2" onMouseLeave={() => setActive(null)}>
          {COLD_HOTSPOTS.map((h, k) => (
            <Rise
              as="li"
              key={h.de}
              delay={150 + k * 80}
              onMouseEnter={() => setActive(k)}
              className={`flex cursor-default items-start gap-3.5 rounded-2xl p-3 font-jakarta transition-colors duration-200 lg:p-3.5 ${
                active === k ? 'bg-fr-mint' : 'bg-fr-soft lg:bg-transparent'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[0.7rem] font-extrabold transition-colors ${
                  active === k ? 'bg-fr-deep text-white' : 'bg-fr-green text-white'
                }`}
              >
                {k + 1}
              </span>
              <span>
                <span className="block text-[0.95rem] font-bold leading-snug text-fr-ink">{h.fr}</span>
                <span lang="de" className="mt-0.5 block text-[0.78rem] italic text-fr-muted">
                  « {h.de} »
                </span>
              </span>
            </Rise>
          ))}
        </ol>
        <p className="mt-4 font-jakarta text-[0.72rem] text-fr-muted">Mentions de la face avant du sachet. Allégations du fabricant.</p>
      </div>

      {/* Photo avec repères interactifs posés à côté des mentions imprimées */}
      <div className="relative order-1 lg:order-2">
        <RevealFrame className="aspect-[4/5]">
          <Pic p={STORY.cold} alt="Le sachet Ariel posé sur une tablette en bois, devant des serviettes blanches" className="h-full w-full object-cover" />
        </RevealFrame>
        {COLD_HOTSPOTS.map((h, k) => (
          <button
            key={h.de}
            type="button"
            onClick={() => setActive(active === k ? null : k)}
            onMouseEnter={() => setActive(k)}
            onFocus={() => setActive(k)}
            aria-label={`Repère ${k + 1} : ${h.fr}`}
            aria-pressed={active === k}
            className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
          >
            <span className={`absolute inset-0 rounded-full bg-white/70 ${active === k ? '' : 'animate-ping'} motion-reduce:hidden`} style={{ animationDuration: '2.4s' }} />
            <span
              className={`relative flex h-7 w-7 items-center justify-center rounded-full font-jakarta text-[0.72rem] font-extrabold shadow-[0_6px_16px_rgba(10,30,20,0.35)] ring-2 ring-white transition-transform duration-200 lg:h-8 lg:w-8 ${
                active === k ? 'scale-110 bg-fr-deep text-white' : 'bg-fr-green text-white group-hover:scale-110'
              }`}
            >
              {k + 1}
            </span>
          </button>
        ))}
        <div
          className={`pointer-events-none absolute inset-x-3 top-3 z-20 rounded-2xl bg-white/95 p-3 font-jakarta shadow-[0_14px_34px_rgba(11,61,42,0.18)] backdrop-blur transition-all duration-300 lg:inset-x-6 lg:top-6 lg:p-4 ${
            active === null ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
          }`}
          aria-live="polite"
        >
          {active !== null && (
            <>
              <p className="text-[0.92rem] font-bold text-fr-ink">{COLD_HOTSPOTS[active].fr}</p>
              <p lang="de" className="text-[0.76rem] italic text-fr-muted">« {COLD_HOTSPOTS[active].de} »</p>
            </>
          )}
        </div>
        <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-jakarta text-[0.72rem] font-semibold text-fr-ink shadow-md lg:bottom-5 lg:left-5">
          <span className="h-1.5 w-1.5 rounded-full bg-fr-green" /> Touchez les repères
        </span>
      </div>
    </article>
  )
}

// ── 4 · Au quotidien ────────────────────────────────────────
const ROUTINE_ICONS = { sort: Shirt, pod: PodIcon, load: WashingMachine, run: Play }
const DETAIL_ICONS = { 'pour-quel-linge': Shirt, dosage: PodIcon, securite: ShieldCheck, ouverture: PouchIcon }

function Detail({ d }) {
  const [open, setOpen] = useState(false)
  const Icon = DETAIL_ICONS[d.id]
  return (
    <div className={`rounded-2xl bg-white ring-1 transition-colors duration-200 ${open ? 'ring-fr-green/40' : 'ring-fr-line hover:ring-fr-green/25'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`detail-${d.id}`}
        className="flex w-full items-center gap-3 p-3.5 text-left font-jakarta lg:p-4"
      >
        <IconTile icon={Icon} size="sm" />
        <span className="flex-1 text-[0.92rem] font-bold text-fr-ink">{d.title}</span>
        <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-fr-soft text-fr-green transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} />
        </span>
      </button>
      <div id={`detail-${d.id}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <ul className="space-y-1.5 px-4 pb-4 pl-[3.6rem] font-jakarta text-[0.86rem] leading-relaxed text-fr-muted">
            {d.body.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function FeatureEveryday() {
  return (
    <article id="f-quotidien" className="scroll-mt-24 bg-fr-soft py-14 lg:py-24">
      <div className={W}>
        <div className="relative lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <RevealFrame className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/3.4]">
            <picture>
              <source media="(min-width: 640px)" type="image/avif" srcSet={STORY.routineWide.avif} sizes="(min-width:1024px) 720px, 100vw" />
              <source media="(min-width: 640px)" type="image/webp" srcSet={STORY.routineWide.webp} sizes="(min-width:1024px) 720px, 100vw" />
              <source type="image/avif" srcSet={STORY.routineTall.avif} sizes="100vw" />
              <source type="image/webp" srcSet={STORY.routineTall.webp} sizes="100vw" />
              <img
                src={STORY.routineTall.src}
                alt="Trois sachets Ariel sur une tablette en bois, devant des serviettes blanches"
                loading="lazy"
                className="h-full w-full object-cover object-[35%_80%]"
              />
            </picture>
          </RevealFrame>

          <Rise className="relative mt-4 rounded-[1.6rem] bg-white p-5 shadow-[0_24px_60px_rgba(11,61,42,0.12)] ring-1 ring-fr-line lg:-ml-14 lg:mr-0 lg:mt-0 lg:p-9">
            <Kicker n="4">Au quotidien</Kicker>
            <Title className="!text-[1.7rem] lg:!text-[2.5rem]">
              Le soin du linge
              <span className="block text-fr-green">au quotidien.</span>
            </Title>
            <ol className="relative mt-5 space-y-3.5 lg:mt-7 lg:space-y-4">
              <span className="absolute bottom-4 left-[1.06rem] top-4 w-px bg-gradient-to-b from-fr-green/40 to-fr-line lg:left-[1.37rem]" aria-hidden="true" />
              {ROUTINE.map((r, k) => {
                const Icon = ROUTINE_ICONS[r.key]
                return (
                  <Rise as="li" key={r.key} delay={100 + k * 90} className="relative flex items-start gap-3.5 font-jakarta">
                    <IconTile icon={Icon} size="sm" className="relative lg:!h-11 lg:!w-11 lg:!rounded-[14px]" />
                    <span className="pt-0.5">
                      <span className="block text-[0.92rem] font-bold leading-snug text-fr-ink lg:text-[1rem]">{r.title}</span>
                      <span className="block text-[0.8rem] leading-snug text-fr-muted lg:text-[0.88rem]">{r.body}</span>
                    </span>
                  </Rise>
                )
              })}
            </ol>
          </Rise>
        </div>

        <div className="mt-8 lg:mt-12">
          <p className="font-jakarta text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-muted">Détails du produit</p>
          <div className="mt-3 grid gap-2.5 lg:grid-cols-2 lg:gap-3">
            {PRODUCT_DETAILS.map((d) => (
              <Detail key={d.id} d={d} />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

// ── Section complète ────────────────────────────────────────
export default function StoryF({ setSel }) {
  return (
    <section id="pourquoi" aria-labelledby="pourquoi-titre" className="scroll-mt-20 bg-white pt-14 lg:pt-24">
      <div className={`${W} lg:flex lg:items-end lg:justify-between lg:gap-12`}>
        <Rise className="max-w-2xl">
          <p className="font-jakarta text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">Pourquoi choisir Ariel All‑in‑1 PODS ?</p>
          <h2 id="pourquoi-titre" className="mt-3 font-jakarta text-[2.1rem] font-extrabold leading-[1.02] tracking-[-0.025em] text-fr-ink lg:text-[3.6rem]">
            Tout tient dans
            <span className="block text-fr-green">une capsule.</span>
          </h2>
        </Rise>
        {/* Sommaire : accès direct à chaque chapitre */}
        <Rise delay={120} as="nav" aria-label="Chapitres" className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:mt-0 lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0">
          {CHAPTERS.map(([id, Icon, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex flex-none items-center gap-2 rounded-full bg-fr-soft py-1.5 pl-1.5 pr-4 font-jakarta text-[0.8rem] font-bold text-fr-ink ring-1 ring-fr-line transition-colors hover:bg-fr-mint hover:ring-fr-green/30"
            >
              <IconTile icon={Icon} size="sm" round tone="white" className="!h-7 !w-7" /> {label}
            </a>
          ))}
        </Rise>
      </div>
      <div className="mt-10 space-y-0 lg:mt-16">
        <div className="pb-14 lg:pb-24">
          <FeatureFormat />
        </div>
        <FeatureQuantity setSel={setSel} />
        <FeatureCold />
        <FeatureEveryday />
      </div>
      {/* Rappel discret, non répétitif : un lien vers les offres, pas une bannière */}
      <div className={`${W} flex flex-col items-center gap-3 py-10 text-center lg:flex-row lg:justify-between lg:py-12 lg:text-left`}>
        <p className="font-jakarta text-[1.05rem] font-bold text-fr-ink lg:text-[1.2rem]">
          Dès {formatCHF(4)} le sachet de 60 capsules · livraison offerte en Suisse
        </p>
        <a href="#offres" className="inline-flex h-12 items-center gap-2 rounded-full bg-fr-deep px-6 font-jakarta text-[0.92rem] font-bold text-white transition-colors hover:bg-fr-green">
          Choisir mon offre <ArrowDown size={16} />
        </a>
      </div>
    </section>
  )
}

