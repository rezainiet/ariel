import { useState } from 'react'
import { BadgeCheck, ChevronDown } from 'lucide-react'
import { useReviews, SORTS, formatReviewDate } from '../../data/reviews.js'
import Stars from '../shared/Stars.jsx'
import Lightbox from '../shared/Lightbox.jsx'
import { SampleBanner, EmptyReviews } from '../shared/ReviewNotice.jsx'

export default function ReviewsA() {
  const r = useReviews({ pageSize: 3 })
  const [zoom, setZoom] = useState(null)
  const [photos, setPhotos] = useState([])

  return (
    <section id="avis" className="scroll-mt-24 border-t border-hair bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-[1320px] px-5 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-forest">
              <span className="font-serif text-sm normal-case tracking-normal">04</span>
              <span className="h-px w-8 bg-forest/30" />
              Avis clients
            </p>
            <h2 className="mt-4 font-serif text-[2rem] font-medium leading-[1.08] tracking-tight text-ink lg:text-[3rem]">
              Ce qu’en disent nos clients.
            </h2>
          </div>
          {r.isSample && <SampleBanner />}
        </div>

        {r.status === 'empty' ? (
          <div className="mt-10">
            <EmptyReviews />
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[340px_1fr] lg:gap-16">
            {/* Synthèse */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="flex items-end gap-4">
                <span className="font-serif text-7xl font-light leading-none tracking-tight text-ink">
                  {r.summary.average.toFixed(1)}
                </span>
                <span className="pb-2">
                  <Stars value={r.summary.average} size={18} />
                  <span className="mt-1 block text-sm text-muted">
                    {r.summary.count} avis{r.isSample ? ' (exemple)' : ''}
                  </span>
                </span>
              </div>
              <ul className="mt-6 space-y-1.5" aria-label="Filtrer par note">
                {r.summary.distribution.map((d) => (
                  <li key={d.stars}>
                    <button
                      onClick={() => r.setStars(d.stars)}
                      aria-pressed={r.stars === d.stars}
                      disabled={!d.n}
                      className={`grid w-full grid-cols-[3rem_1fr_2rem] items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                        r.stars === d.stars ? 'bg-sand' : 'hover:bg-sand/60'
                      }`}
                    >
                      <span className="text-left text-ink">{d.stars} ★</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-hair">
                        <span className="block h-full rounded-full bg-forest" style={{ width: `${d.pct}%` }} />
                      </span>
                      <span className="text-right tabular-nums text-muted">{d.n}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {r.stars && (
                <button onClick={() => r.setStars(r.stars)} className="mt-2 text-xs font-semibold text-forest underline">
                  Afficher toutes les notes
                </button>
              )}
            </aside>

            {/* Liste */}
            <div>
              <div className="flex items-center justify-between border-b border-hair pb-4">
                <p className="text-sm text-muted">
                  {r.total} avis{r.stars ? ` · ${r.stars} étoiles` : ''}
                </p>
                <label className="relative flex items-center gap-2 text-sm text-muted">
                  Trier
                  <select
                    value={r.sort}
                    onChange={(e) => r.setSort(e.target.value)}
                    className="h-10 appearance-none rounded-full border border-hair bg-white pl-4 pr-9 text-sm font-medium text-ink focus:border-forest focus:outline-none"
                  >
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" />
                </label>
              </div>

              <ul className="divide-y divide-hair">
                {r.items.map((rev) => (
                  <li key={rev.id} className="grid gap-2 py-6 sm:grid-cols-[1fr_auto] sm:gap-8 sm:py-7">
                    <div>
                      <Stars value={rev.rating} size={14} />
                      <h3 className="mt-3 font-serif text-xl font-medium text-ink">{rev.title}</h3>
                      <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink/75">{rev.body}</p>
                      {rev.photos.length > 0 && (
                        <div className="mt-4 flex gap-2">
                          {rev.photos.map((p, k) => (
                            <button
                              key={p}
                              onClick={() => {
                                setPhotos(rev.photos.map((src) => ({ src, alt: `Photo de ${rev.author}` })))
                                setZoom(k)
                              }}
                              className="h-16 w-16 overflow-hidden rounded-lg border border-hair bg-white"
                              aria-label={`Agrandir la photo de ${rev.author}`}
                            >
                              <img src={p} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Méta : une ligne sur mobile, colonne alignée à droite sur desktop */}
                    <div className="order-first flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted sm:order-none sm:block sm:w-44 sm:text-right sm:text-sm">
                      <p className="font-semibold text-ink">{rev.author}</p>
                      <p>
                        <span className="sm:hidden">· </span>
                        {rev.location}
                      </p>
                      <p className="sm:mt-1 sm:text-xs">
                        <span className="sm:hidden">· </span>
                        {formatReviewDate(rev.date)}
                      </p>
                      {rev.verified && (
                        <p className="inline-flex items-center gap-1 text-xs font-semibold text-forest sm:mt-2">
                          <BadgeCheck size={14} /> Achat vérifié
                        </p>
                      )}
                    </div>
                  </li>
                ))}
                {r.items.length === 0 && <li className="py-10 text-center text-sm text-muted">Aucun avis pour ce filtre.</li>}
              </ul>

              {r.hasMore && (
                <button
                  onClick={r.showMore}
                  className="mt-2 h-12 w-full rounded-full border border-forest/30 text-sm font-semibold text-forest transition-colors hover:bg-sand"
                >
                  Voir plus d’avis
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <Lightbox images={photos} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </section>
  )
}
