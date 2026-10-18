import { Check, ArrowRight } from 'lucide-react'
import ProductImage from './ui/ProductImage.jsx'
import Reveal from './ui/Reveal.jsx'
import { IMAGES } from '../config/assets.js'

function scrollToOffers() {
  document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth' })
}

const points = ['Élimine les taches', 'Efficace dès 20°C', 'Fraîcheur longue durée']

// Bannière éditoriale / « affiche » composée à partir du visuel réel
// (main tenant une capsule), reprenant le message de la campagne fournie.
export default function LifestyleBanner() {
  return (
    <section className="py-4 sm:py-8">
      <div className="container-edge">
        <Reveal className="overflow-hidden rounded-xl2 border border-line bg-forest text-white">
          <div className="grid items-stretch lg:grid-cols-2">
            {/* Visuel réel */}
            <div className="relative min-h-[260px] sm:min-h-[340px]">
              <ProductImage
                src={IMAGES.handpod}
                alt="Une main dépose une capsule Ariel dans le lave-linge"
                ratio="auto"
                rounded="rounded-none"
                className="absolute inset-0 h-full w-full"
              />
            </div>

            {/* Texte / affiche */}
            <div className="flex flex-col justify-center gap-5 p-8 sm:p-10 lg:p-12">
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage">
                Une dose suffit
              </span>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                Une dose pour un linge impeccable
              </h2>
              <ul className="space-y-2.5">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[0.95rem] text-white/85">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-sage">
                      <Check size={14} strokeWidth={2.4} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <div>
                <button
                  onClick={scrollToOffers}
                  className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-[0.9rem] font-semibold tracking-tight text-forest transition-all duration-200 hover:bg-sage active:scale-[0.985]"
                >
                  Découvrir les offres
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
