import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, BadgeCheck, Check } from 'lucide-react'
import { OFFERS, PRODUCT, formatCHF, savingsFor, centsPerWash } from '../../config/store.js'
import { PACK_FACTS, HOW_TO, SAFETY, OPENING_STEPS, FAQ } from '../shared/content.js'
import { useReviews, SORTS, formatReviewDate } from '../../data/reviews.js'
import Stars from '../shared/Stars.jsx'
import { SampleBanner, EmptyReviews } from '../shared/ReviewNotice.jsx'

const W = 'mx-auto max-w-[1280px] px-4 lg:px-8'

function H2({ children, sub }) {
  return (
    <div className="mb-4 lg:mb-6">
      <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-3xl">{children}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  )
}

// ── Comparatif sélectionnable ───────────────────────────────
export function CompareC({ sel, setSel }) {
  return (
    <section className={`${W} py-6 lg:py-10`}>
      <H2 sub="Prix de bundle fixes. Économie calculée vs packs à CHF 4.– achetés séparément.">Comparer les offres</H2>
      <div role="radiogroup" aria-label="Comparer et choisir une offre" className="overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] bg-cloud px-4 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-muted">
          <span>Offre</span>
          <span>Lavages</span>
          <span>Par lavage</span>
          <span className="text-right">Prix</span>
        </div>
        {OFFERS.map((o) => {
          const active = o.id === sel
          return (
            <button
              key={o.id}
              role="radio"
              aria-checked={active}
              onClick={() => {
                setSel(o.id)
                document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className={`grid w-full grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-t border-line px-4 py-3.5 text-left text-sm transition-colors ${
                active ? 'bg-mint/60' : 'bg-white hover:bg-cloud'
              }`}
            >
              <span className="flex items-center gap-2 font-bold text-ink">
                <span className={`flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 ${active ? 'border-forest bg-forest text-white' : 'border-ink/20'}`}>
                  {active && <Check size={9} strokeWidth={4} />}
                </span>
                {o.packs} pack{o.packs > 1 ? 's' : ''}
              </span>
              <span className="tabular-nums text-muted">{o.washes}</span>
              <span className="tabular-nums text-muted">{centsPerWash(o)} ct.</span>
              <span className="text-right">
                <span className="block font-extrabold tabular-nums text-forest">{formatCHF(o.price)}</span>
                {savingsFor(o) > 0 && <span className="block text-[0.66rem] font-bold text-forest/80">− {formatCHF(savingsFor(o))}</span>}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ── Détails produit (divulgation progressive) ───────────────
function Disclosure({ title, children, defaultOpen }) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-4 py-3 text-[0.98rem] font-bold text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={18} className="flex-none text-forest transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-ink/75">{children}</div>
    </details>
  )
}

export function ProductDetailsC() {
  return (
    <section id="produit" className={`${W} grid scroll-mt-24 gap-8 py-6 lg:grid-cols-2 lg:gap-12 lg:py-10`}>
      <div>
        <H2 sub="Informations issues de l’emballage fourni.">Le produit en détail</H2>
        <div className="border-t border-line">
          <Disclosure title="Ce que contient votre commande" defaultOpen>
            <p>
              {PRODUCT.name} en sachets de 60 capsules. Une capsule correspond à un lavage : 1 pack = 60 lavages,
              2 packs = 120 lavages, 3 packs = 180 lavages.
            </p>
          </Disclosure>
          <Disclosure title="Comment utiliser une capsule">
            <ol className="space-y-2">
              {HOW_TO.map((s, k) => (
                <li key={s.title}>
                  <strong className="text-ink">{k + 1}. {s.title}.</strong> {s.body}
                </li>
              ))}
            </ol>
          </Disclosure>
          <Disclosure title="Ouvrir et refermer le sachet">
            <p className="mb-2">Le sachet dispose d’une fermeture sécurité enfants :</p>
            <ol className="grid grid-cols-2 gap-2">
              {OPENING_STEPS.map((s, k) => (
                <li key={s} className="rounded-lg bg-cloud px-3 py-2">
                  <strong className="text-forest">{k + 1}.</strong> {s}
                </li>
              ))}
            </ol>
          </Disclosure>
          <Disclosure title="Consignes de sécurité">
            <ul className="list-disc space-y-1 pl-5">
              {SAFETY.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Disclosure>
          {/* Mobile : mentions de l'emballage repliées (divulgation progressive) */}
          <div className="lg:hidden">
            <Disclosure title="Ce qu’indique l’emballage">
              <ul className="space-y-2.5">
                {PACK_FACTS.map((f) => (
                  <li key={f.id}>
                    <strong className="text-ink">{f.title}</strong> — {f.body}{' '}
                    <span className="font-semibold text-forest">{f.source}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">Mentions lisibles sur le sachet (version germanophone).</p>
            </Disclosure>
          </div>
        </div>
      </div>
      <div className="hidden lg:block">
        <H2 sub="Mentions lisibles sur le sachet (version germanophone).">Sur l’emballage</H2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PACK_FACTS.map((f) => (
            <li key={f.id} className="rounded-2xl border border-line p-4">
              <p className="font-bold text-ink">{f.title}</p>
              <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{f.body}</p>
              <p className="mt-2 text-xs font-semibold text-forest">{f.source}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

// ── Avis compacts ───────────────────────────────────────────
export function ReviewsC() {
  const r = useReviews({ pageSize: 4 })
  const [expanded, setExpanded] = useState(false)
  const list = expanded ? r.items : r.items.slice(0, 4)

  return (
    <section id="avis" className="scroll-mt-24 bg-cloud py-8 lg:py-12">
      <div className={W}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-ink lg:text-3xl">Avis clients</h2>
            {r.summary.count > 0 && (
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                <Stars value={r.summary.average} size={15} />
                <strong className="text-ink">{r.summary.average.toFixed(1)}/5</strong> · {r.summary.count} avis
                {r.isSample ? ' (exemple)' : ''}
              </p>
            )}
          </div>
          {expanded && (
            <label className="relative">
              <span className="sr-only">Trier les avis</span>
              <select
                value={r.sort}
                onChange={(e) => r.setSort(e.target.value)}
                className="h-10 appearance-none rounded-full border border-line bg-white pl-4 pr-9 text-sm font-semibold text-ink"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-muted" />
            </label>
          )}
        </div>
        {r.isSample && (
          <div className="mb-4">
            <SampleBanner />
          </div>
        )}

        {r.status === 'empty' ? (
          <EmptyReviews />
        ) : (
          <>
            <ul
              className={
                expanded
                  ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4'
                  : '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0'
              }
            >
              {list.map((rev) => (
                <li key={rev.id} className={`flex flex-col rounded-2xl bg-white p-4 ${expanded ? '' : 'w-[80%] flex-none snap-start lg:w-auto'}`}>
                  <div className="flex items-center justify-between">
                    <Stars value={rev.rating} size={13} />
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-forest">
                        <BadgeCheck size={12} /> Achat vérifié
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-bold text-ink">{rev.title}</p>
                  <p className="mt-1 flex-1 text-[0.82rem] leading-relaxed text-ink/70">{rev.body}</p>
                  <p className="mt-3 text-[0.7rem] text-muted">
                    {rev.author}, {rev.location} · {formatReviewDate(rev.date)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-center gap-2">
              {!expanded && r.summary.count > 4 && (
                <button onClick={() => setExpanded(true)} className="h-11 rounded-full border-2 border-forest px-6 text-sm font-bold text-forest hover:bg-mint">
                  Voir tous les avis ({r.summary.count})
                </button>
              )}
              {expanded && r.hasMore && (
                <button onClick={r.showMore} className="h-11 rounded-full border-2 border-forest px-6 text-sm font-bold text-forest hover:bg-mint">
                  Afficher plus
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ── FAQ compacte ────────────────────────────────────────────
export function FaqC() {
  return (
    <section id="faq" className={`${W} scroll-mt-24 py-8 lg:py-12`}>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <div>
          <H2 sub="Livraison, retours, paiement, vendeur.">Questions fréquentes</H2>
          <Link to="/contact" className="inline-flex h-11 items-center rounded-full bg-cloud px-5 text-sm font-bold text-forest hover:bg-mint">
            Contacter le service client
          </Link>
        </div>
        <div className="border-t border-line">
          {FAQ.map((f) => (
            <Disclosure key={f.q} title={f.q}>
              {f.a}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  )
}
