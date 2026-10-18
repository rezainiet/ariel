import { ArrowDown, Truck, MapPin, Clock } from 'lucide-react'
import Button from './ui/Button.jsx'
import ProductImage from './ui/ProductImage.jsx'
import { DELIVERY, formatCHF } from '../config/store.js'
import { IMAGES } from '../config/assets.js'

function scrollToOffers() {
  document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth' })
}

// Petite ligne de réassurance compacte réutilisée mobile + desktop.
function Reassurance() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.82rem] text-ink/75">
      <li className="flex items-center gap-1.5">
        <Truck size={16} className="text-forest" strokeWidth={1.9} />
        Livraison offerte en Suisse
      </li>
      <li className="flex items-center gap-1.5">
        <MapPin size={16} className="text-forest" strokeWidth={1.9} />
        Stock en Suisse
      </li>
      <li className="flex items-center gap-1.5">
        <Clock size={16} className="text-forest" strokeWidth={1.9} />
        Estimée sous {DELIVERY.estimateDays} jours ouvrables
      </li>
    </ul>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Fond éditorial très subtil */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-sage/40 to-transparent" />

      <div className="container-edge relative pb-10 pt-5 sm:pt-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-14 lg:pb-20 lg:pt-16">
        {/* ── Colonne texte ── */}
        <div className="animate-fade-up">
          <span className="eyebrow">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-forest" />
            Déstockage en Suisse
          </span>

          <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.05] text-ink sm:text-5xl lg:text-[3.4rem]">
            Ariel All-in-1&nbsp;PODS
            <span className="mt-1 block text-forest">60 lavages</span>
          </h1>

          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-muted sm:mt-4 sm:text-lg">
            Profitez de notre offre de déstockage sur une sélection de packs Ariel.
            Le même soin du linge, à prix réduit.
          </p>

          {/* ── Image produit — version mobile compacte (dans le flux, au-dessus du pli) ── */}
          <div className="mt-5 lg:hidden">
            <div className="relative mx-auto max-w-[14rem] animate-fade-in [animation-delay:100ms]">
              <ProductImage
                src={IMAGES.packshot}
                label="Packshot Ariel · 60 lavages"
                alt="Pack Ariel All-in-1 PODS 60 lavages"
                ratio="4 / 5"
                fit="contain"
                loading="eager"
                className="bg-gradient-to-br from-white via-canvas to-sage/50"
              />
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-forest shadow-card">
                Livraison offerte 🇨🇭
              </span>
            </div>
          </div>

          {/* Prix très visible */}
          <div className="mt-6 flex items-end gap-3">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Dès
              </span>
              <span className="block text-[3rem] font-extrabold leading-none tracking-tight text-forest sm:text-6xl">
                {formatCHF(4)}
              </span>
            </div>
            <span className="mb-1.5 text-sm text-muted">le pack de 60&nbsp;lavages</span>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={scrollToOffers} className="w-full sm:w-auto">
              DÉCOUVRIR LES OFFRES
              <ArrowDown size={18} strokeWidth={2.1} />
            </Button>
          </div>

          <div className="mt-5 sm:mt-6">
            <Reassurance />
          </div>
        </div>

        {/* ── Colonne image — version desktop ── */}
        <div className="relative hidden lg:mt-0 lg:block">
          <div className="relative mx-auto max-w-[26rem] animate-fade-in [animation-delay:120ms]">
            <ProductImage
              src={IMAGES.packshot}
              label="Packshot Ariel All-in-1 PODS · 60 lavages"
              alt="Pack Ariel All-in-1 PODS 60 lavages"
              ratio="4 / 5"
              fit="contain"
              loading="eager"
              className="bg-gradient-to-br from-white via-canvas to-sage/40 shadow-card"
            />
            {/* Pastille flottante, discrète */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-5 py-2 text-sm font-semibold text-forest shadow-card">
              Livraison offerte · Suisse 🇨🇭
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
