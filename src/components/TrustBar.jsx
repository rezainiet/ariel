import { ShieldCheck, Truck, PackageCheck, MapPin } from 'lucide-react'
import Reveal from './ui/Reveal.jsx'

const benefits = [
  { Icon: MapPin, title: 'Stock en Suisse', sub: 'Expédition locale', flag: '🇨🇭' },
  { Icon: Truck, title: 'Livraison offerte', sub: 'Sur toute la Suisse' },
  { Icon: PackageCheck, title: 'Expédition rapide', sub: 'Préparation soignée' },
  { Icon: ShieldCheck, title: 'Paiement sécurisé', sub: 'Connexion chiffrée' },
]

export default function TrustBar() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="container-edge py-10">
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
          {benefits.map((b, i) => (
            <Reveal
              key={b.title}
              delay={i * 70}
              className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:gap-3 sm:text-left"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sage/60 text-forest">
                <b.Icon size={20} strokeWidth={1.8} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">
                  {b.title} {b.flag && <span aria-hidden>{b.flag}</span>}
                </span>
                <span className="block text-xs text-muted">{b.sub}</span>
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
