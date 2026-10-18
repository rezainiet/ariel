import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Truck, RotateCcw, CreditCard, BadgeCheck, ArrowUpRight, Mail } from 'lucide-react'
import { PAYMENT_METHODS, PAYMENT_LABELS, STORE } from '../../config/store.js'
import { useReviews, SORTS, formatReviewDate, STORE_REVIEWS_PREVIEW } from '../../data/reviews.js'
import Stars from '../shared/Stars.jsx'
import { SampleBanner } from '../shared/ReviewNotice.jsx'
import Reveal from '../../components/ui/Reveal.jsx'
import GalleryC from './GalleryC.jsx'
import { Eyebrow, H2 } from './TrustC.jsx'
import { Pending, Fact } from './Pending.jsx'
import { deliveryFacts, ORDER_STEPS, FAQ_C } from './contentC.js'

const W = 'mx-auto max-w-[1320px] px-4 lg:px-8'

// Photos (mobile uniquement — dès 768 px, la galerie est dans le héros)
export function PhotosSection() {
  return (
    <section aria-label="Photos du produit" className="py-10 md:hidden">
      <div className="px-4">
        <Eyebrow>Photos</Eyebrow>
        <H2 className="text-[1.7rem]">Le produit en images</H2>
        <GalleryC className="mt-5" />
      </div>
    </section>
  )
}

// Livraison, retours & paiement — section unique et détaillée
export function DeliverySection() {
  const f = deliveryFacts()
  return (
    <section id="livraison" className="scroll-mt-20 bg-sand/60 py-12 lg:py-20">
      <div className={W}>
        <Reveal>
          <Eyebrow>Service</Eyebrow>
          <H2>Livraison, retours & paiement</H2>
        </Reveal>
        <div className="mt-8 grid gap-3 lg:grid-cols-3 lg:gap-5">
          <div className="rounded-[1.25rem] bg-white p-4 lg:p-7">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink"><Truck size={19} className="text-forest" /> Livraison offerte</h3>
            <dl className="mt-3 space-y-1.5 text-[0.88rem] text-ink/75">
              <div className="flex justify-between gap-3"><dt>Frais</dt><dd className="font-semibold text-forest">CHF 0.–</dd></div>
              <div className="flex justify-between gap-3"><dt>Délai estimé</dt><dd>{f.days} jours ouvrables</dd></div>
              <div className="flex justify-between gap-3"><dt>Expédition</dt><dd className="text-right">depuis {f.from}</dd></div>
              <div className="flex justify-between gap-3">
                <dt>Transporteur</dt>
                <dd className="text-right"><Fact value={f.carrier} missing="transporteur" /></dd>
              </div>
            </dl>
          </div>
          <div className="rounded-[1.25rem] bg-white p-4 lg:p-7">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink"><RotateCcw size={19} className="text-forest" /> Retour sous {f.returnDays} jours</h3>
            <p className="mt-3 text-[0.88rem] leading-relaxed text-ink/75">
              Demandez un retour dans les {f.returnDays} jours suivant la réception, avec votre numéro de commande. C’est un
              engagement de notre boutique : la loi suisse ne prévoit pas de droit de rétractation pour les achats en ligne.
            </p>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-ink/75">Article endommagé ou erroné : contactez-nous dès réception.</p>
            <Link to="/retours-remboursements" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
              Conditions de retour <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="rounded-[1.25rem] bg-white p-4 lg:p-7">
            <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink"><CreditCard size={19} className="text-forest" /> Paiement</h3>
            {PAYMENT_METHODS.length ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <li key={m} className="rounded-md border border-hair px-2.5 py-1 text-xs font-semibold text-ink">
                    {PAYMENT_LABELS[m] || m}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3">
                <Pending block>moyens de paiement réellement activés</Pending>
              </div>
            )}
            <p className="mt-3 text-[0.88rem] leading-relaxed text-ink/75">
              Montant total en CHF affiché avant l’achat. Le paiement est traité par un prestataire spécialisé : aucune donnée de
              carte ne transite par notre boutique.
            </p>
          </div>
        </div>

        <ol className="mt-4 grid divide-y divide-hair rounded-[1.25rem] border border-hair bg-white/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {ORDER_STEPS.map((s, k) => (
            <li key={s.title} className="flex gap-3 p-3.5 lg:p-4">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-forest text-[0.7rem] font-bold text-white">{k + 1}</span>
              <span>
                <span className="block text-sm font-bold text-ink">{s.title}</span>
                <span className="block text-xs leading-relaxed text-ink/70">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// Avis — affichés UNIQUEMENT si une source vérifiée existe (ou aperçu dev explicite).
export function ReviewsSection() {
  const r = useReviews({ pageSize: 4, allowSample: STORE_REVIEWS_PREVIEW })
  const [all, setAll] = useState(false)
  if (r.status === 'empty') return null
  const items = all ? r.items : r.items.slice(0, 3)

  return (
    <section id="avis" className="scroll-mt-20 py-12 lg:py-20">
      <div className={W}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Avis clients</Eyebrow>
            <H2>Ce qu’en disent nos clients</H2>
            <p className="mt-2 flex items-center gap-2 text-sm text-ink/75">
              <Stars value={r.summary.average} size={15} />
              <strong className="text-ink">{r.summary.average.toFixed(1)}/5</strong> · {r.summary.count} avis
            </p>
          </div>
          <label className="relative">
            <span className="sr-only">Trier les avis</span>
            <select
              value={r.sort}
              onChange={(e) => r.setSort(e.target.value)}
              className="h-10 appearance-none rounded-full border border-hair bg-white pl-4 pr-9 text-sm font-semibold text-ink"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-muted" />
          </label>
        </div>
        {r.isSample && (
          <div className="mt-4">
            <SampleBanner />
          </div>
        )}
        <ul className="mt-6 grid gap-3 md:grid-cols-3">
          {items.map((rev) => (
            <li key={rev.id} className="rounded-2xl border border-hair bg-white p-5">
              <div className="flex items-center justify-between">
                <Stars value={rev.rating} size={13} />
                {rev.verified && (
                  <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-forest">
                    <BadgeCheck size={12} /> Achat vérifié
                  </span>
                )}
              </div>
              <p className="mt-2 font-bold text-ink">{rev.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink/75">{rev.body}</p>
              <p className="mt-3 text-xs text-muted">
                {rev.author} · {formatReviewDate(rev.date)}
              </p>
            </li>
          ))}
        </ul>
        {(r.hasMore || !all) && r.total > 3 && (
          <button
            onClick={() => (all ? r.showMore() : setAll(true))}
            className="mt-4 h-11 rounded-full border-2 border-forest px-6 text-sm font-bold text-forest hover:bg-mint"
          >
            Voir plus d’avis
          </button>
        )}
      </div>
    </section>
  )
}

function Disclosure({ q, a }) {
  return (
    <details className="group border-b border-hair">
      <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[0.98rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown size={18} className="flex-none text-forest transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <p className="pb-5 pr-6 text-[0.9rem] leading-relaxed text-ink/75">{a}</p>
    </details>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-12 lg:py-20">
      <div className={`${W} grid gap-6 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16`}>
        <div>
          <Eyebrow>Questions fréquentes</Eyebrow>
          <H2>Bon à savoir</H2>
          <p className="mt-3 text-sm text-ink/70">
            Une autre question&nbsp;?{' '}
            {STORE.supportEmail ? (
              <a href={`mailto:${STORE.supportEmail}`} className="font-semibold text-forest underline">{STORE.supportEmail}</a>
            ) : (
              <Pending>e-mail du service client</Pending>
            )}
          </p>
          <Link to="/contact" className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-sand px-5 text-sm font-bold text-forest hover:bg-mint">
            <Mail size={16} /> Contacter le service client
          </Link>
        </div>
        <div className="border-t border-hair">
          {FAQ_C.map((f) => (
            <Disclosure key={f.q} {...f} />
          ))}
        </div>
      </div>
    </section>
  )
}
