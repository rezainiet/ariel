import { ClipboardCheck, Send, Truck } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'
import { DELIVERY } from '../config/store.js'

const steps = [
  {
    Icon: ClipboardCheck,
    title: 'Confirmation de commande',
    body: 'Vous recevez un e-mail récapitulatif dès la validation de votre commande.',
  },
  {
    Icon: Send,
    title: "Confirmation d'expédition",
    body: 'Un second e-mail vous informe dès que votre colis quitte notre stock.',
  },
  {
    Icon: Truck,
    title: 'Suivi de livraison',
    body: 'Lorsqu’il est disponible, un lien de suivi vous permet de localiser votre colis.',
  },
]

export default function Delivery() {
  return (
    <section id="livraison" className="scroll-mt-20 bg-forest py-16 text-white sm:py-20">
      <div className="container-edge">
        <div className="lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-sage">
              Livraison
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Livraison depuis la Suisse 🇨🇭
            </h2>
            <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-white/80">
              Vos commandes sont préparées à partir de notre stock en {DELIVERY.dispatchLocation}.
              La livraison est offerte et prend généralement environ {DELIVERY.estimateDays} jours
              ouvrables.
            </p>
            <p className="mt-4 max-w-md text-xs leading-relaxed text-white/55">
              Transporteur, lieu d'expédition exact et délais sont configurables et ne
              sont pas présentés comme vérifiés tant que le marchand ne les a pas confirmés.
            </p>
          </Reveal>

          <Reveal delay={120} className="mt-10 lg:mt-0">
            <ol className="relative space-y-6 border-l border-white/15 pl-8">
              {steps.map((s, i) => (
                <li key={s.title} className="relative">
                  <span className="absolute -left-[2.85rem] flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sage ring-1 ring-white/15">
                    <s.Icon size={17} strokeWidth={1.9} />
                  </span>
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-sage">
                    Étape {i + 1}
                  </span>
                  <h3 className="mt-0.5 text-[1rem] font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{s.body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
