import { Link } from 'react-router-dom'
import { ArrowUpRight, Building2, MapPin, Mail, Phone, Truck, BadgeInfo, Check } from 'lucide-react'
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
  `Trois prix fixes : ${OFFERS.map((o) => formatCHF(o.price)).join(' · ')}, livraison incluse`,
  'Aucun frais ajouté à la caisse : le prix affiché est le montant payé',
  `Les économies indiquées comparent nos propres offres (2 sachets : ${formatCHF(OFFERS[1].price)} au lieu de 2 × ${formatCHF(OFFERS[0].price)})`,
  MERCHANT.vatNote,
].filter(Boolean)

function Num({ children }) {
  return <span className="font-serif text-[0.95rem] italic text-forest/70">{children}</span>
}

// Transparence avant persuasion : le prix (et sa raison, fournie par le marchand) puis le vendeur.
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
  // Sans raison réelle fournie, la question n'est pas posée : on n'affiche que les faits.
  const hasReason = Boolean(MERCHANT.clearanceReason)
  return (
    <section id="confiance" aria-label="Prix et vendeur" className="scroll-mt-20 py-12 lg:py-20">
      <div className="mx-auto max-w-[1320px] px-4 lg:px-8">
        <Reveal className="max-w-2xl">
          <Eyebrow>Transparence</Eyebrow>
          <H2>
            Un prix bas,
            <span className="block italic text-forest">des réponses claires.</span>
          </H2>
        </Reveal>

        <div className="mt-8 grid border-t border-ink/15 lg:mt-10 lg:grid-cols-2">
          <Reveal className="border-b border-ink/15 py-7 lg:border-b-0 lg:border-r lg:py-10 lg:pr-14">
            <Num>01</Num>
            <h3 className="mt-1 font-serif text-[1.55rem] font-medium leading-tight text-ink lg:text-[1.9rem]">
              {hasReason || import.meta.env.DEV ? 'Pourquoi ce prix ?' : 'Le prix, en clair'}
            </h3>
            {hasReason ? (
              <blockquote className="mt-4 border-l-2 border-forest pl-4 text-[1rem] leading-relaxed text-ink/85">
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
                <li key={f} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-ink/80">
                  <Check size={16} strokeWidth={2.6} className="mt-[0.2rem] flex-none text-forest" />
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={80} className="py-7 lg:py-10 lg:pl-14">
            <Num>02</Num>
            <h3 className="mt-1 font-serif text-[1.55rem] font-medium leading-tight text-ink lg:text-[1.9rem]">Qui vous livre ?</h3>
            {sellerRows.length > 0 && (
              <dl className="mt-4 divide-y divide-hair border-y border-hair text-[0.9rem]">
                {sellerRows.map(([Icon, label, v, missing]) => (
                  <div key={label} className="grid grid-cols-[1.5rem_5.5rem_1fr] items-start gap-2 py-2.5 min-[400px]:grid-cols-[1.5rem_6.5rem_1fr]">
                    <Icon size={16} className="mt-0.5 text-forest" />
                    <dt className="font-semibold text-ink">{label}</dt>
                    <dd className="min-w-0 text-ink/75">
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
      </div>
    </section>
  )
}
