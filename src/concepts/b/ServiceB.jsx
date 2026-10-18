import { Link } from 'react-router-dom'
import { Plus, ArrowUpRight } from 'lucide-react'
import { DELIVERY, STORE } from '../../config/store.js'
import { FAQ } from '../shared/content.js'
import Reveal from '../../components/ui/Reveal.jsx'

export function ServiceB() {
  const cells = [
    ['Offerte', 'Livraison', 'Sans frais en Suisse, sur toutes les offres.'],
    [`≈ ${DELIVERY.estimateDays} j.`, 'Délai estimé', 'Livraison estimée en jours ouvrables.'],
    ['CH', 'Expédition', `Depuis notre stock en ${DELIVERY.dispatchLocation}.`],
    [`${DELIVERY.returnWindowDays} j.`, 'Retours', 'Demande possible après réception, avec votre numéro de commande.'],
  ]
  return (
    <section id="livraison" className="scroll-mt-16 bg-night py-14 text-white lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-grotesk text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-pollen">Livraison & retours</p>
            <h2 className="mt-3 max-w-2xl font-grotesk text-[2.3rem] font-bold leading-none tracking-[-0.03em] lg:text-6xl">
              Livré depuis la Suisse. Sans frais.
            </h2>
          </div>
          <Link
            to="/retours-remboursements"
            className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-white/20 px-5 text-sm font-semibold hover:bg-white/10 lg:self-auto"
          >
            Politique de retour <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-white/10 lg:grid-cols-4">
          {cells.map(([big, t, d]) => (
            <Reveal key={t} className="bg-night-800 p-5 sm:p-8">
              <p className="font-grotesk text-4xl font-bold tracking-[-0.04em] text-pollen sm:text-5xl">{big}</p>
              <p className="mt-4 text-sm font-semibold">{t}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/55 sm:text-sm">{d}</p>
            </Reveal>
          ))}
        </div>
        <ol className="mt-8 grid gap-3 text-sm text-white/70 sm:grid-cols-3">
          {['Confirmation de commande par e-mail', 'Confirmation d’expédition', 'Lien de suivi, lorsqu’il est disponible'].map((s, k) => (
            <li key={s} className="flex items-center gap-3 rounded-full border border-white/10 px-4 py-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-white/10 font-grotesk text-xs font-bold text-pollen">
                {k + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function FaqB() {
  return (
    <section id="faq" className="scroll-mt-16 bg-white py-14 lg:py-24">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 lg:grid-cols-[1fr_1.7fr] lg:gap-16 lg:px-12">
        <div>
          <p className="font-grotesk text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-forest">FAQ</p>
          <h2 className="mt-3 font-grotesk text-[2.3rem] font-bold leading-none tracking-[-0.03em] text-night lg:text-6xl">
            Vos questions.
          </h2>
          <p className="mt-4 max-w-xs text-sm text-night/55">
            {STORE.supportEmail ? `Une autre question ? ${STORE.supportEmail}` : 'Une autre question ? Notre service client vous répond.'}
          </p>
        </div>
        <div className="space-y-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group rounded-[1.25rem] bg-mist px-5 open:bg-night open:text-white sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-grotesk text-base font-bold leading-snug sm:text-lg">{f.q}</span>
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white text-night transition-transform duration-300 group-open:rotate-45 group-open:bg-pollen">
                  <Plus size={16} />
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[0.95rem] leading-relaxed text-white/75">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
