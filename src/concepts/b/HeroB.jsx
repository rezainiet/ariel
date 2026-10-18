import { useState } from 'react'
import { ArrowDown, Truck, MapPin, RotateCcw } from 'lucide-react'
import { DELIVERY, formatCHF } from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

// Annotations positionnées sur les mentions réelles du sachet (coordonnées en % de l'image).
const NOTES = [
  { x: 15, y: 26, title: '« 60 PODS »', text: '60 capsules = 60 lavages' },
  { x: 5, y: 7, title: 'Fermeture sécurité enfants', text: '« Kindersicherer Verschluss »' },
  { x: 6, y: 38, title: 'Dissolution rapide', text: '« Schnell auflösend »' },
  { x: 91, y: 68, title: 'Même à l’eau froide', text: '« Selbst in kaltem Wasser »' },
]

// Repère numéroté posé sur la mention réelle ; la légende sous l'image porte le texte
// (rien ne masque l'emballage).
function Marker({ n, k, active, onActivate }) {
  return (
    <button
      onMouseEnter={onActivate}
      onFocus={onActivate}
      onClick={onActivate}
      aria-label={`${k + 1}. ${n.title} — ${n.text}`}
      className="absolute -ml-3.5 -mt-3.5 flex h-7 w-7 items-center justify-center"
      style={{ left: `${n.x}%`, top: `${n.y}%` }}
    >
      {active && <span className="absolute inset-0 rounded-full bg-pollen/50 motion-safe:animate-ping" />}
      <span
        className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 font-grotesk text-[0.68rem] font-bold transition-all duration-300 ${
          active ? 'scale-110 border-night bg-pollen text-night' : 'border-white/80 bg-night/80 text-white'
        }`}
      >
        {k + 1}
      </span>
    </button>
  )
}

export default function HeroB() {
  const [active, setActive] = useState(0)

  return (
    <section className="relative overflow-hidden bg-night text-white">
      {/* Socle lumineux discret derrière le produit */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-20%] top-[18%] h-[120vw] w-[120vw] rounded-full bg-[radial-gradient(closest-side,rgba(238,242,238,0.16),transparent)] lg:right-[-6%] lg:top-[-10%] lg:h-[70rem] lg:w-[70rem]"
      />

      <div className="relative mx-auto grid max-w-[1440px] gap-6 px-5 pb-10 pt-20 lg:min-h-[min(100vh,900px)] lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-10 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 font-grotesk text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-pollen" /> Déstockage en Suisse
          </span>
          <h1 className="mt-5 font-grotesk text-[2.9rem] font-bold leading-[0.92] tracking-[-0.04em] sm:text-7xl lg:text-[6.2rem]">
            60 capsules.
            <br />
            <span className="text-pollen">60 lavages.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 lg:text-lg">
            Ariel All-in-1 PODS — la lessive pré-dosée en capsule, en offre de déstockage.
          </p>

          {/* Visuel mobile (dans le flux) */}
          <div className="relative mx-auto mt-5 max-w-[17.5rem] sm:max-w-[22rem] lg:hidden">
            <img
              src={IMAGES.packshotCutout}
              alt="Pack Ariel All-in-1 PODS · 60 capsules"
              fetchpriority="high"
              className="w-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
            />
          </div>

          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-4 lg:mt-7">
            <div>
              <p className="flex items-baseline gap-2.5">
                <span className="font-grotesk text-sm uppercase tracking-[0.18em] text-white/50">Dès</span>
                <span className="font-grotesk text-5xl font-bold leading-none tracking-tight lg:text-6xl">{formatCHF(4)}</span>
              </p>
              <p className="mt-1.5 text-sm text-white/55">le pack de 60 · livraison offerte</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:mt-6">
            <button
              onClick={() => go('offres')}
              className="flex h-14 items-center justify-center gap-2 rounded-full bg-pollen px-8 font-grotesk text-base font-bold text-night transition-all hover:bg-white active:scale-[0.99]"
            >
              Choisir mon pack <ArrowDown size={18} />
            </button>
            <button
              onClick={() => go('experience')}
              className="hidden h-14 items-center justify-center rounded-full border border-white/20 px-7 font-grotesk text-base font-semibold text-white transition-colors hover:bg-white/10 sm:flex"
            >
              Découvrir le produit
            </button>
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-white/65 sm:mt-7">
            <li className="flex items-center gap-1.5">
              <Truck size={15} className="text-pollen" /> Livraison offerte
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin size={15} className="text-pollen" /> Stock en {DELIVERY.dispatchLocation}
            </li>
            <li className="flex items-center gap-1.5">
              <RotateCcw size={15} className="text-pollen" /> Retour {DELIVERY.returnWindowDays} jours
            </li>
          </ul>
        </div>

        {/* Visuel desktop annoté */}
        <div className="relative hidden lg:block">
          <div className="relative mx-auto aspect-[1000/951] w-full max-w-[540px] animate-fade-in">
            <img
              src={IMAGES.packshotCutout}
              alt="Pack Ariel All-in-1 PODS · 60 capsules"
              fetchpriority="high"
              className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]"
            />
            {NOTES.map((n, k) => (
              <Marker key={n.title} n={n} k={k} active={active === k} onActivate={() => setActive(k)} />
            ))}
          </div>
          <ul className="mx-auto mt-6 grid max-w-[560px] grid-cols-2 gap-2">
            {NOTES.map((n, k) => (
              <li key={n.title}>
                <button
                  onMouseEnter={() => setActive(k)}
                  onFocus={() => setActive(k)}
                  onClick={() => setActive(k)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-all duration-300 ${
                    active === k ? 'border-pollen/60 bg-white/[0.08]' : 'border-white/10 hover:border-white/25'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full font-grotesk text-[0.62rem] font-bold ${
                      active === k ? 'bg-pollen text-night' : 'bg-white/10 text-white'
                    }`}
                  >
                    {k + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{n.title}</span>
                    <span className="block text-xs text-white/50">{n.text}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[0.7rem] text-white/35">
            Mentions lues sur l’emballage fourni (version germanophone).
          </p>
        </div>
      </div>
    </section>
  )
}
