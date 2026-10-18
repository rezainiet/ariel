import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import { OFFERS, centsPerWash } from '../../config/store.js'
import { IMAGES, GALLERY } from '../../config/assets.js'
import { HOW_TO, OPENING_STEPS, SAFETY } from '../shared/content.js'
import Lightbox from '../shared/Lightbox.jsx'
import Reveal from '../../components/ui/Reveal.jsx'

const W = 'mx-auto max-w-[1440px] px-5 lg:px-12'

function Label({ children, dark }) {
  return (
    <p className={`font-grotesk text-[0.72rem] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-pollen' : 'text-forest'}`}>
      {children}
    </p>
  )
}

// ── L'expérience capsule : onglets interactifs ──────────────
const CHAPTERS = [
  {
    id: 'format',
    tab: 'Le format',
    title: 'Une capsule. Un lavage. Rien à doser.',
    img: IMAGES.podWater,
    alt: 'Capsule Ariel en gros plan',
    points: [
      'Capsule « Allin1 » pré-dosée : la lessive est déjà mesurée.',
      'Pas de bouchon doseur, pas de poudre, pas de coulure.',
      'L’emballage indique une dissolution rapide (« Schnell auflösend »).',
    ],
  },
  {
    id: 'pack',
    tab: 'Le pack',
    title: '60 capsules dans un sachet refermable.',
    img: IMAGES.stacked,
    alt: 'Packs Ariel de 60 capsules',
    points: [
      'Chaque sachet contient 60 capsules, soit 60 lavages.',
      'Fermeture sécurité enfants, ouverture en quatre étapes :',
      ...OPENING_STEPS.map((s, k) => `${k + 1}. ${s}`),
    ],
  },
  {
    id: 'routine',
    tab: 'La routine',
    title: 'Dans le tambour, avant le linge.',
    img: IMAGES.handpod,
    alt: 'Une main dépose une capsule dans le tambour',
    points: HOW_TO.map((s) => `${s.title} — ${s.body}`),
  },
  {
    id: 'safety',
    tab: 'Sécurité',
    title: 'Toujours hors de portée des enfants.',
    img: IMAGES.basket,
    alt: 'Pack Ariel rangé dans la buanderie',
    points: SAFETY,
  },
]

export function ExperienceB() {
  const [cur, setCur] = useState(0)
  const ch = CHAPTERS[cur]

  return (
    <section id="experience" className="scroll-mt-16 bg-white py-14 lg:py-24">
      <div className={W}>
        <Reveal className="grid gap-4 lg:grid-cols-2 lg:items-end">
          <div>
            <Label>L’expérience capsule</Label>
            <h2 className="mt-3 font-grotesk text-[2.3rem] font-bold leading-[0.98] tracking-[-0.03em] text-night lg:text-7xl">
              Le linge,
              <br />
              sans y penser.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-night/60 lg:justify-self-end">
            Ce que contient le pack, comment l’utiliser et ce qu’indique l’emballage — sans promesse inventée.
          </p>
        </Reveal>

        {/* Onglets — défilement horizontal sur mobile */}
        <div role="tablist" aria-label="Découvrir le produit" className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 no-scrollbar lg:mx-0 lg:mt-12 lg:px-0">
          {CHAPTERS.map((c, k) => (
            <button
              key={c.id}
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={k === cur}
              aria-controls={`panel-${c.id}`}
              onClick={() => setCur(k)}
              className={`h-11 flex-none rounded-full px-5 font-grotesk text-sm font-semibold transition-all duration-300 ${
                k === cur ? 'bg-night text-white' : 'bg-mist text-night/70 hover:bg-night/10'
              }`}
            >
              <span className="mr-2 tabular-nums opacity-50">0{k + 1}</span>
              {c.tab}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${ch.id}`}
          aria-labelledby={`tab-${ch.id}`}
          className="mt-6 grid overflow-hidden rounded-[2rem] bg-mist lg:grid-cols-[1fr_1.1fr]"
        >
          <div className="relative flex min-h-[280px] items-center justify-center bg-night p-6 lg:min-h-[480px]">
            <img
              key={ch.img}
              src={ch.img}
              alt={ch.alt}
              loading="lazy"
              className="max-h-[300px] w-auto animate-fade-in rounded-2xl object-contain shadow-2xl lg:max-h-[400px]"
            />
          </div>
          <div key={ch.id} className="flex animate-fade-up flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="font-grotesk text-sm font-semibold tabular-nums text-night/40">0{cur + 1} / 0{CHAPTERS.length}</p>
            <h3 className="mt-2 font-grotesk text-2xl font-bold leading-tight tracking-tight text-night lg:text-4xl">
              {ch.title}
            </h3>
            <ul className="mt-6 space-y-3">
              {ch.points.map((p) => (
                <li key={p} className="flex gap-3 text-[0.95rem] leading-relaxed text-night/75">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-night" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex gap-2">
              <button
                onClick={() => setCur((cur - 1 + CHAPTERS.length) % CHAPTERS.length)}
                aria-label="Chapitre précédent"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-night/15 text-night hover:bg-white"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCur((cur + 1) % CHAPTERS.length)}
                aria-label="Chapitre suivant"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-night/15 text-night hover:bg-white"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Dans chaque pack : chiffres calculés / lus sur l'emballage ──
export function NumbersB() {
  const cheapest = OFFERS[OFFERS.length - 1]
  const stats = [
    ['60', 'capsules par sachet', '« 60 PODS »'],
    ['1', 'capsule = 1 lavage', 'pré-dosée'],
    ['4', 'étapes d’ouverture', 'fermeture sécurité enfants'],
    [`${centsPerWash(cheapest)}`, 'ct. par lavage', `offre ${cheapest.packs} packs (${centsPerWash(OFFERS[0])} ct. pour 1 pack)`],
  ]
  return (
    <section className="bg-night py-14 text-white lg:py-20">
      <div className={W}>
        <Label dark>Dans chaque pack</Label>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {stats.map(([n, l, s]) => (
            <Reveal key={l} className="border-t border-white/15 pt-5">
              <p className="font-grotesk text-6xl font-bold leading-none tracking-[-0.05em] lg:text-8xl">{n}</p>
              <p className="mt-3 text-sm font-semibold text-white">{l}</p>
              <p className="mt-1 text-xs text-white/50">{s}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Galerie « pellicule » ───────────────────────────────────
export function GalleryB() {
  const track = useRef(null)
  const [zoom, setZoom] = useState(null)
  const scroll = (d) => track.current?.scrollBy({ left: d * Math.min(420, track.current.clientWidth * 0.8), behavior: 'smooth' })

  return (
    <section id="galerie" className="scroll-mt-16 bg-mist py-14 lg:py-20">
      <div className={`${W} flex items-end justify-between gap-4`}>
        <div>
          <Label>Galerie</Label>
          <h2 className="mt-3 font-grotesk text-[2.3rem] font-bold leading-none tracking-[-0.03em] text-night lg:text-6xl">
            Le produit, sous tous les angles.
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button onClick={() => scroll(-1)} aria-label="Images précédentes" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-night hover:bg-night hover:text-white">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll(1)} aria-label="Images suivantes" className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-night hover:bg-night hover:text-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 no-scrollbar lg:px-[max(3rem,calc((100vw-1440px)/2+3rem))]"
      >
        {GALLERY.map((g, k) => (
          <button
            key={g.src}
            onClick={() => setZoom(k)}
            aria-label={`Agrandir : ${g.alt}`}
            className="group relative flex-none snap-start overflow-hidden rounded-[1.5rem] bg-white"
          >
            <img
              src={g.src}
              alt={g.alt}
              loading="lazy"
              className={`h-[300px] w-auto transition-transform duration-500 group-hover:scale-[1.03] lg:h-[400px] ${
                g.fit === 'contain' ? 'object-contain p-6' : 'object-cover'
              } ${k === 0 ? 'aspect-square' : ''}`}
            />
            <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-full bg-white/90 px-3.5 py-2 text-left text-xs font-medium text-night opacity-100 backdrop-blur transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
              <span className="truncate">{g.alt}</span>
              <Expand size={14} className="ml-2 flex-none" />
            </span>
          </button>
        ))}
      </div>
      <Lightbox images={GALLERY} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </section>
  )
}
