import { Link } from 'react-router-dom'
import { ArrowUpRight, Building2, MapPin, Mail, Phone, Truck, BadgeInfo } from 'lucide-react'
import { MERCHANT, STORE, OFFERS, formatCHF } from '../../config/store.js'
import { Fact, Pending } from './Pending.jsx'
import Reveal from '../../components/ui/Reveal.jsx'

export function Eyebrow({ children }) {
  return <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-forest">{children}</p>
}

export function H2({ children, className = '' }) {
  return (
    <h2 className={`mt-2 font-serif text-[1.9rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[2.6rem] ${className}`}>
      {children}
    </h2>
  )
}

const PRICE_FACTS = [
  `Trois prix fixes : ${OFFERS.map((o) => formatCHF(o.price)).join(' · ')}`,
  'Livraison incluse : aucun frais ajouté à la caisse',
  'Pas de prix barré, pas de compte à rebours',
  'Les économies affichées comparent uniquement nos propres offres',
]

// « Pourquoi ce prix ? » + « Qui vend ? » — transparence avant persuasion.
export default function TrustC() {
  const address = [MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  // En production, une ligne sans donnée n'est pas affichée (jamais de libellé vide).
  const sellerRows = [
    [Building2, 'Entreprise', MERCHANT.legalName, 'raison sociale'],
    [MapPin, 'Adresse', address, 'adresse postale'],
    [BadgeInfo, 'N° IDE', MERCHANT.uid, 'numéro IDE (CHE-…)'],
    [Mail, 'E-mail', STORE.supportEmail, 'e-mail du service client'],
    [Phone, 'Téléphone', STORE.supportPhone, null],
    [
      Truck,
      'Expédition',
      MERCHANT.dispatchCity && `Depuis ${MERCHANT.dispatchCity}${MERCHANT.carrier ? ` · ${MERCHANT.carrier}` : ''}`,
      'ville de l’entrepôt',
    ],
  ].filter(([, , v, missing]) => v || (import.meta.env.DEV && missing))
  return (
    <section id="confiance" aria-label="Prix et vendeur" className="scroll-mt-20 py-10 lg:py-16">
      <div className="mx-auto grid max-w-[1320px] gap-4 px-4 lg:grid-cols-2 lg:gap-6 lg:px-8">
        {/* Pourquoi ce prix */}
        <Reveal className="rounded-[1.5rem] bg-sand/70 p-6 lg:p-10">
          <Eyebrow>Déstockage</Eyebrow>
          <H2 className="text-[1.7rem] lg:text-[2.2rem]">Pourquoi ce prix&nbsp;?</H2>
          {MERCHANT.clearanceReason ? (
            <blockquote className="mt-4 border-l-2 border-forest pl-4 text-[0.98rem] leading-relaxed text-ink/85">
              {MERCHANT.clearanceReason}
              <footer className="mt-2 text-xs font-semibold not-italic text-muted">— Explication de {STORE.name}</footer>
            </blockquote>
          ) : (
            <div className="mt-4">
              <Pending block>raison réelle du déstockage (VITE_CLEARANCE_REASON)</Pending>
            </div>
          )}
          <ul className="mt-5 space-y-2.5">
            {PRICE_FACTS.map((f) => (
              <li key={f} className="flex gap-3 text-[0.92rem] text-ink/80">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-forest" />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>

        {/* Qui vend */}
        <Reveal delay={80} className="rounded-[1.5rem] border border-hair bg-white p-6 lg:p-10">
          <Eyebrow>Le vendeur</Eyebrow>
          <H2 className="text-[1.7rem] lg:text-[2.2rem]">Qui vous livre&nbsp;?</H2>
          {sellerRows.length > 0 && (
            <dl className="mt-5 divide-y divide-hair border-y border-hair text-[0.9rem]">
              {sellerRows.map(([Icon, label, v, missing]) => (
                <div key={label} className="grid grid-cols-[1.75rem_6.5rem_1fr] items-start gap-2 py-3">
                  <Icon size={16} className="mt-0.5 text-forest" />
                  <dt className="font-semibold text-ink">{label}</dt>
                  <dd className="text-ink/75">
                    <Fact value={v} missing={missing} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            {STORE.name} n’est pas le site officiel de la marque. Ariel est une marque de The Procter &amp; Gamble Company.
          </p>
          <Link to="/mentions-legales" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
            Mentions légales complètes <ArrowUpRight size={14} />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
