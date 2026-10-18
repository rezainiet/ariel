import { useState } from 'react'
import { BadgeCheck, ChevronDown } from 'lucide-react'
import { useReviews, SORTS, formatReviewDate } from '../../data/reviews.js'
import Stars from '../shared/Stars.jsx'
import Lightbox from '../shared/Lightbox.jsx'
import { SampleBanner, EmptyReviews } from '../shared/ReviewNotice.jsx'

export default function ReviewsB() {
  const r = useReviews({ pageSize: 3 })
  const [zoom, setZoom] = useState(null)
  const [photos, setPhotos] = useState([])

  return (
    <section id="avis" className="scroll-mt-16 bg-mist py-14 lg:py-24">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-grotesk text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-forest">Avis clients</p>
            <h2 className="mt-3 font-grotesk text-[2.3rem] font-bold leading-none tracking-[-0.03em] text-night lg:text-6xl">
              Ils l’ont commandé.
            </h2>
          </div>
          {r.isSample && <SampleBanner />}
        </div>

        {r.status === 'empty' ? (
          <div className="mt-10">
            <EmptyReviews />
          </div>
        ) : (
          <>
            {/* Synthèse horizontale */}
            <div className="mt-8 grid gap-6 rounded-[2rem] bg-white p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-12">
              <div className="flex items-center gap-4">
                <p className="font-grotesk text-7xl font-bold leading-none tracking-[-0.05em] text-night">
                  {r.summary.average.toFixed(1)}
                </p>
                <div>
                  <Stars value={r.summary.average} size={18} color="text-night" />
                  <p className="mt-1 text-sm text-night/55">
                    {r.summary.count} avis{r.isSample ? ' (exemple)' : ''}
                  </p>
                </div>
              </div>
              <ul className="grid gap-1.5">
                {r.summary.distribution.map((d) => (
                  <li key={d.stars} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-3 text-sm">
                    <span className="font-grotesk font-semibold text-night">{d.stars} ★</span>
                    <span className="h-2 overflow-hidden rounded-full bg-mist">
                      <span className="block h-full rounded-full bg-night transition-all duration-500" style={{ width: `${d.pct}%` }} />
                    </span>
                    <span className="text-right tabular-nums text-night/50">{d.n}</span>
                  </li>
                ))}
              </ul>
              <label className="relative flex items-center gap-3 whitespace-nowrap text-sm text-night/60 lg:flex-col lg:items-start lg:gap-2">
                Trier par
                <select
                  value={r.sort}
                  onChange={(e) => r.setSort(e.target.value)}
                  className="h-11 w-full appearance-none rounded-full border border-night/15 bg-white pl-4 pr-10 font-grotesk text-sm font-semibold text-night focus:border-night focus:outline-none lg:w-56"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute bottom-3.5 right-4 text-night/50" />
              </label>
            </div>

            {/* Filtres par note */}
            <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 no-scrollbar lg:mx-0 lg:px-0" role="group" aria-label="Filtrer par note">
              <button
                onClick={() => r.stars && r.setStars(r.stars)}
                aria-pressed={!r.stars}
                className={`h-10 flex-none rounded-full px-4 text-sm font-semibold ${!r.stars ? 'bg-night text-white' : 'bg-white text-night/70'}`}
              >
                Toutes
              </button>
              {r.summary.distribution.map((d) => (
                <button
                  key={d.stars}
                  onClick={() => r.setStars(d.stars)}
                  aria-pressed={r.stars === d.stars}
                  disabled={!d.n}
                  className={`h-10 flex-none rounded-full px-4 text-sm font-semibold disabled:opacity-40 ${
                    r.stars === d.stars ? 'bg-night text-white' : 'bg-white text-night/70'
                  }`}
                >
                  {d.stars} ★ <span className="opacity-50">({d.n})</span>
                </button>
              ))}
            </div>

            <ul className="mt-5 gap-4 sm:columns-2 lg:columns-3">
              {r.items.map((rev) => (
                <li key={rev.id} className="mb-4 break-inside-avoid rounded-[1.5rem] bg-white p-6">
                  <div className="flex items-center justify-between">
                    <Stars value={rev.rating} size={15} color="text-night" />
                    <span className="text-xs text-night/45">{formatReviewDate(rev.date)}</span>
                  </div>
                  <h3 className="mt-4 font-grotesk text-lg font-bold leading-snug text-night">{rev.title}</h3>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-night/70">{rev.body}</p>
                  {rev.photos.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {rev.photos.map((p, k) => (
                        <button
                          key={p}
                          onClick={() => {
                            setPhotos(rev.photos.map((src) => ({ src, alt: `Photo de ${rev.author}` })))
                            setZoom(k)
                          }}
                          aria-label={`Agrandir la photo de ${rev.author}`}
                          className="h-20 w-20 overflow-hidden rounded-xl bg-mist"
                        >
                          <img src={p} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between border-t border-mist pt-4 text-sm">
                    <span>
                      <span className="font-semibold text-night">{rev.author}</span>
                      <span className="text-night/45"> · {rev.location}</span>
                    </span>
                    {rev.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-forest">
                        <BadgeCheck size={14} /> Vérifié
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {r.items.length === 0 && <p className="py-10 text-center text-sm text-night/50">Aucun avis pour ce filtre.</p>}
            {r.hasMore && (
              <div className="mt-2 text-center">
                <button onClick={r.showMore} className="h-12 rounded-full bg-night px-8 font-grotesk text-sm font-bold text-white hover:bg-night-700">
                  Afficher plus d’avis
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Lightbox images={photos} index={zoom} onClose={() => setZoom(null)} onIndex={setZoom} />
    </section>
  )
}
