import { Link } from 'react-router-dom'
import { Plus, ShieldAlert, Mail, ArrowUpRight } from 'lucide-react'
import { OFFERS, PRODUCT, DELIVERY, STORE, formatCHF, pricePerPack, savingsFor } from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import { PACK_FACTS, OPENING_STEPS, HOW_TO, SAFETY, FAQ } from '../shared/content.js'
import Reveal from '../../components/ui/Reveal.jsx'

const W = 'mx-auto max-w-[1320px] px-5 lg:px-10'

function Kicker({ n, children, light }) {
  return (
    <p className={`flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] ${light ? 'text-white/60' : 'text-forest'}`}>
      <span className="font-serif text-sm normal-case tracking-normal">{n}</span>
      <span className={`h-px w-8 ${light ? 'bg-white/30' : 'bg-forest/30'}`} />
      {children}
    </p>
  )
}

// Tirage encadré : présente les visuels basse résolution à taille raisonnable.
function Print({ src, alt, className = '' }) {
  return (
    <figure className={`overflow-hidden rounded-lg bg-white p-2 shadow-[0_20px_50px_rgba(23,42,32,0.14)] ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full rounded object-cover" />
    </figure>
  )
}

// ── 01 · Votre commande, en clair ────────────────────────────
export function ClarityA() {
  // Livraison / retours : traités une seule fois, dans la section 05.
  const rows = [
    ['Ce que vous recevez', `${PRODUCT.name}, sachets de 60 capsules. Une capsule = un lavage.`],
    ['Les lavages', '1 pack = 60 · 2 packs = 120 · 3 packs = 180 lavages.'],
    ['Le prix', 'Dès CHF 4.– le pack. Prix de bundle fixes, livraison incluse.'],
    ['Le vendeur', `${STORE.name} — coordonnées complètes dans les mentions légales.`],
  ]
  return (
    <section id="produit" className="scroll-mt-24 border-t border-hair bg-white py-14 lg:py-20">
      <div className={`${W} grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-20`}>
        <Reveal>
          <Kicker n="01">Votre commande</Kicker>
          <h2 className="mt-4 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[3rem]">
            Tout ce que vous achetez, en clair.
          </h2>
          <dl className="mt-8 divide-y divide-hair border-y border-hair">
            {rows.map(([t, d]) => (
              <div key={t} className="grid grid-cols-[8.5rem_1fr] gap-4 py-3.5 text-sm sm:grid-cols-[11rem_1fr]">
                <dt className="font-semibold text-ink">{t}</dt>
                <dd className="text-muted">{d}</dd>
              </div>
            ))}
          </dl>
          <Print
            src={IMAGES.stacked}
            alt="Plusieurs packs Ariel de 60 capsules"
            className="mt-10 hidden aspect-[4/5] w-[46%] lg:block"
          />
        </Reveal>

        <Reveal delay={100} className="lg:pt-14">
          <div className="overflow-hidden rounded-[1.25rem] border border-hair">
            <table className="w-full text-left text-sm">
              <caption className="bg-sand/60 px-5 py-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-forest">
                Comparer les offres
              </caption>
              <thead className="border-b border-hair text-xs text-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Offre</th>
                  <th scope="col" className="px-2 py-3 font-medium">Lavages</th>
                  <th scope="col" className="hidden px-2 py-3 font-medium sm:table-cell">Par pack</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {OFFERS.map((o) => (
                  <tr key={o.id} className={o.featured ? 'bg-sand/30' : ''}>
                    <th scope="row" className="px-5 py-4 font-semibold text-ink">
                      {o.packs} pack{o.packs > 1 ? 's' : ''}
                      {savingsFor(o) > 0 && (
                        <span className="mt-0.5 block text-[0.68rem] font-semibold text-forest">
                          − {formatCHF(savingsFor(o))} vs séparés
                        </span>
                      )}
                    </th>
                    <td className="px-2 py-4 tabular-nums text-muted">{o.washes}</td>
                    <td className="hidden px-2 py-4 tabular-nums text-muted sm:table-cell">{formatCHF(pricePerPack(o))}</td>
                    <td className="px-5 py-4 text-right font-serif text-lg font-medium tabular-nums text-ink">
                      {formatCHF(o.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted lg:text-sm">
            Les économies indiquées sont calculées par rapport à l’achat de packs séparés à {formatCHF(OFFERS[0].price)}.
            Aucun prix de référence fictif.
          </p>
          {/* Desktop : visuel lifestyle pour équilibrer la colonne */}
          <Print
            src={IMAGES.basket}
            alt="Pack Ariel de 60 lavages dans la buanderie"
            className="ml-auto mt-8 hidden aspect-[6/5] w-[62%] lg:block"
          />
        </Reveal>
      </div>
    </section>
  )
}

// ── 02 · Ce que dit l'emballage ─────────────────────────────
export function FactsA() {
  return (
    <section className="bg-ivory py-14 lg:py-20">
      <div className={W}>
        <Reveal className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Kicker n="02">Le produit</Kicker>
            <h2 className="mt-4 max-w-xl font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[3rem]">
              Ce que dit l’emballage.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Mentions relevées sur le sachet fourni (version germanophone), traduites. Nous n’ajoutons aucune
            promesse de performance.
          </p>
        </Reveal>
      </div>
      {/* Carrousel snap sur mobile, grille sur desktop */}
      <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 no-scrollbar lg:mx-auto lg:grid lg:max-w-[1320px] lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-10">
        {PACK_FACTS.map((f, k) => (
          <Reveal
            key={f.id}
            delay={k * 60}
            className="flex w-[78%] flex-none snap-start flex-col rounded-[1.1rem] border border-hair bg-white p-6 sm:w-[45%] lg:w-auto"
          >
            <span className="font-serif text-3xl font-light text-forest/70">0{k + 1}</span>
            <h3 className="mt-6 text-[1.02rem] font-semibold leading-snug text-ink">{f.title}</h3>
            <p className="mt-2 flex-1 text-[0.85rem] leading-relaxed text-muted">{f.body}</p>
            <p className="mt-5 border-t border-hair pt-3 font-serif text-sm italic text-forest">{f.source}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// ── 03 · Utilisation ────────────────────────────────────────
export function RitualA() {
  return (
    <section id="utilisation" className="scroll-mt-24 bg-white py-14 lg:py-20">
      <div className={`${W} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <Reveal className="relative order-2 mx-auto w-full max-w-[17rem] pb-4 sm:max-w-md lg:order-1">
          <Print src={IMAGES.handpod} alt="Une capsule Ariel déposée dans le tambour" className="aspect-[3/4] w-[70%]" />
          <Print
            src={IMAGES.towels}
            alt="Linge propre plié"
            className="absolute -bottom-2 right-0 aspect-[3/2] w-[52%] lg:-bottom-6"
          />
        </Reveal>

        <Reveal className="order-1 lg:order-2">
          <Kicker n="03">Utilisation</Kicker>
          <h2 className="mt-4 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[3rem]">
            Une capsule, un lavage.
          </h2>
          <ol className="mt-8 space-y-5">
            {HOW_TO.map((s, k) => (
              <li key={s.title} className="grid grid-cols-[2.5rem_1fr] gap-3">
                <span className="font-serif text-2xl text-forest/60">{k + 1}</span>
                <span>
                  <span className="block font-semibold text-ink">{s.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 rounded-xl bg-sand/60 p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-forest">
              Ouvrir le sachet sécurisé
            </p>
            <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {OPENING_STEPS.map((s, k) => (
                <li key={s} className="rounded-lg bg-white px-3 py-2.5 text-xs leading-snug text-ink">
                  <span className="mr-1 font-bold text-forest">{k + 1}.</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <details className="group mt-4 rounded-xl border border-hair px-4 py-1 open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-forest" /> Consignes de sécurité
              </span>
              <Plus size={16} className="text-forest transition-transform duration-300 group-open:rotate-45" />
            </summary>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-forest/50">
              {SAFETY.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </details>
        </Reveal>
      </div>
    </section>
  )
}

// ── 05 · Livraison & service ────────────────────────────────
export function ServiceA() {
  const cols = [
    {
      t: 'Expédition',
      d: `Préparée depuis notre stock en ${DELIVERY.dispatchLocation}. Confirmation d’expédition par e-mail.`,
    },
    { t: 'Livraison offerte', d: `Sans frais en Suisse, estimée sous ${DELIVERY.estimateDays} jours ouvrables.` },
    {
      t: 'Retours',
      d: `Demande sous ${DELIVERY.returnWindowDays} jours après réception, avec votre numéro de commande.`,
      link: ['Politique de retour', '/retours-remboursements'],
    },
    {
      t: 'Service client',
      d: STORE.supportEmail ? `Écrivez-nous à ${STORE.supportEmail}.` : 'Une question, un suivi ? Contactez-nous.',
      link: ['Nous contacter', '/contact'],
    },
  ]
  return (
    <section id="livraison" className="scroll-mt-24 bg-sand/70 py-14 lg:py-16">
      <div className={W}>
        <Reveal className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Kicker n="05">Livraison & service</Kicker>
            <h2 className="mt-4 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[2.75rem]">
              Depuis la Suisse, jusqu’à votre porte.
            </h2>
          </div>
          <ol className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            {['Confirmation de commande', 'Confirmation d’expédition', 'Suivi, lorsqu’il est disponible'].map((s, k) => (
              <li key={s}>
                <span className="font-semibold text-forest">{k + 1}.</span> {s}
              </li>
            ))}
          </ol>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[1.1rem] border border-hair bg-hair lg:grid-cols-4">
          {cols.map((c) => (
            <div key={c.t} className="flex flex-col bg-ivory p-4 sm:p-6">
              <h3 className="font-serif text-lg font-medium text-ink sm:text-xl">{c.t}</h3>
              <p className="mt-1.5 flex-1 text-[0.8rem] leading-relaxed text-muted sm:mt-2 sm:text-sm">{c.d}</p>
              {c.link && (
                <Link to={c.link[1]} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
                  {c.link[0]} <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── 06 · FAQ ────────────────────────────────────────────────
export function FaqA() {
  return (
    <section id="faq" className="scroll-mt-24 bg-ivory py-14 lg:py-20">
      <div className={`${W} grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Kicker n="06">Questions</Kicker>
          <h2 className="mt-4 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[2.75rem]">
            Questions fréquentes.
          </h2>
          <Link
            to="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-hair bg-white px-5 py-3 text-sm font-semibold text-forest hover:border-forest/40"
          >
            <Mail size={16} /> Une autre question ?
          </Link>
        </div>
        <div className="divide-y divide-hair border-y border-hair">
          {FAQ.map((f) => (
            <details key={f.q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
                <span className="font-serif text-[1.12rem] font-medium leading-snug text-ink lg:text-xl">{f.q}</span>
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-hair text-forest transition-transform duration-300 group-open:rotate-45">
                  <Plus size={15} />
                </span>
              </summary>
              <p className="-mt-1 pb-5 pr-12 text-[0.95rem] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
