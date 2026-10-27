import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Play, Pause, Truck, RotateCcw, LockKeyhole, Plus, ArrowUpRight, MessageCircleQuestion, Star, ShieldAlert, Languages } from 'lucide-react'
import { DELIVERY, MERCHANT, PAYMENT_METHODS, PAYMENT_LABELS, STORE, VIDEO, STOCK_VIDEO } from '../../config/store.js'
import { summarize } from '../../data/reviews.js'
import { reviewText } from '../../lib/reviewText.js'
import { useI18n } from '../../i18n/index.jsx'
import { IconTile } from './Icons.jsx'
import { Rise } from './motion.jsx'

const W = 'mx-auto max-w-[1320px] px-4 lg:px-8'

function SectionHead({ eyebrow, title, accent, aside }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <Rise>
        <p className="font-jakarta text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">{eyebrow}</p>
        <h2 className="mt-3 font-jakarta text-[1.9rem] font-extrabold leading-[1.04] tracking-[-0.022em] text-fr-ink lg:text-[2.8rem]">
          {title}
          {accent && <span className="block text-fr-green">{accent}</span>}
        </h2>
      </Rise>
      {aside}
    </div>
  )
}

function Stars({ value, size = 14 }) {
  const { t } = useI18n()
  return (
    <span className="inline-flex gap-0.5" aria-label={t.common.rating(value)}>
      {[1, 2, 3, 4, 5].map((k) => (
        <span key={k} className={`flex h-5 w-5 items-center justify-center rounded-[2px] ${k <= Math.round(value) ? 'bg-fr-green text-white' : 'bg-fr-line text-white'}`}>
          <Star size={size} strokeWidth={1.4} fill="currentColor" aria-hidden="true" />
        </span>
      ))}
    </span>
  )
}

// Titre et texte dans la langue affichée. Une traduction est signalée, avec l'original à un clic ;
// sans traduction enregistrée, l'avis s'affiche tel que publié.
function ReviewContent({ review, original, onToggle }) {
  const { t, lang } = useI18n()
  const r9 = t.reviews
  const text = reviewText(review, lang, { original })
  return (
    <>
      {text.title && <p lang={text.lang} className="mt-3 text-[1rem] font-bold text-fr-ink">{text.title}</p>}
      <p lang={text.lang} className="mt-4 flex-1 text-[0.9rem] leading-relaxed text-fr-ink">{text.body}</p>
      {text.canToggle && (
        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.72rem] text-fr-muted">
          <Languages size={13} strokeWidth={1.9} className="flex-none" aria-hidden="true" />
          <span>{text.translated ? r9.translatedFrom(text.source) : r9.original(text.source)}</span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <button type="button" onClick={onToggle} className="basis-full rounded text-left font-semibold sm:basis-auto text-fr-green underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fr-green">
            {text.translated ? r9.showOriginal : r9.showTranslation}
          </button>
        </p>
      )}
    </>
  )
}

export function ReviewsF({ reviewState }) {
  const { t, lang } = useI18n()
  const r9 = t.reviews
  const { status, reviews } = reviewState
  const [visibleCount, setVisibleCount] = useState(3)
  const [ratingFilter, setRatingFilter] = useState(null)
  // Avis affichés en version originale à la demande du visiteur (remis à zéro à chaque changement de langue).
  const [originals, setOriginals] = useState({ lang, ids: [] })
  if (status !== 'live') return null
  const showsOriginal = (id) => originals.lang === lang && originals.ids.includes(id)
  const toggleOriginal = (id) => setOriginals((current) => {
    const ids = current.lang === lang ? current.ids : []
    return { lang, ids: ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id] }
  })
  const sum = summarize(reviews)
  const hasExternal = reviews.some((review) => review.source)
  const filtered = ratingFilter ? reviews.filter((review) => review.rating === ratingFilter) : reviews
  const hasPhoto = (review) => Array.isArray(review.photos) && review.photos.length > 0
  const items = [...filtered].sort((a, b) =>
    Number(hasPhoto(b)) - Number(hasPhoto(a)) || b.date.localeCompare(a.date),
  ).slice(0, visibleCount)
  const selectRating = (rating) => {
    setRatingFilter(rating)
    setVisibleCount(3)
  }
  return (
    <section id="avis" data-analytics-section="reviews" className="scroll-mt-20 bg-[#F7FAF8] py-12 lg:py-20">
      <div className={W}>
        <Rise>
          <p className="font-jakarta text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">{hasExternal ? r9.eyebrowExternal : r9.eyebrow}</p>
          <h2 className="mt-2 font-jakarta text-[1.9rem] font-extrabold leading-[1.04] tracking-[-0.022em] text-fr-ink lg:text-[2.8rem]">{r9.title}</h2>
        </Rise>
        <div className="mt-6 grid gap-6 rounded-[1.5rem] border border-fr-line bg-white p-5 font-jakarta shadow-[0_12px_32px_rgba(11,61,42,0.04)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:max-w-[52rem] lg:p-7">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <strong className="text-[3.4rem] font-extrabold leading-none tracking-[-0.05em] text-fr-ink">{sum.average.toFixed(1).replace('.', ',')}</strong>
              <span className="text-sm font-semibold text-fr-muted">{r9.outOf5}</span>
            </div>
            <div className="mt-2"><Stars value={sum.average} size={14} /></div>
            <p className="mt-2 text-[0.8rem] text-fr-muted">{r9.average(sum.count)}</p>
          </div>
          <div className="space-y-1" aria-label={r9.distribution}>
            {sum.distribution.map(({ stars, n, pct }) => (
              <button key={stars} type="button" onClick={() => selectRating(ratingFilter === stars ? null : stars)} disabled={!n} aria-pressed={ratingFilter === stars} className="group flex w-full items-center gap-2 rounded-md py-0.5 text-xs text-fr-ink transition-colors hover:text-fr-green focus-visible:outline-2 focus-visible:outline-fr-green disabled:cursor-default disabled:opacity-45">
                <span className="w-2 text-right font-bold">{stars}</span><Star size={12} className="fill-fr-green text-fr-green" aria-hidden="true" />
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-fr-line"><span className="block h-full rounded-full bg-fr-green transition-[width] duration-300" style={{ width: `${pct}%` }} /></span>
                <span className="w-5 text-right tabular-nums text-fr-muted">{n}</span>
              </button>
            ))}
          </div>
        </div>
        {hasExternal && <p className="mt-4 max-w-3xl font-jakarta text-[0.78rem] leading-relaxed text-fr-muted">{r9.externalNote}</p>}
        <div className="mt-7 flex items-center justify-between gap-3 font-jakarta">
          <p className="text-sm font-bold text-fr-ink">{ratingFilter ? r9.filtered(filtered.length, ratingFilter) : r9.count(sum.count)}</p>
          {ratingFilter && <button type="button" onClick={() => selectRating(null)} className="text-xs font-bold text-fr-green underline underline-offset-4">{r9.allRatings}</button>}
        </div>
        <ul className="mt-3 grid gap-3 lg:grid-cols-3 lg:gap-5">
          {items.map((r, k) => (
            <Rise as="li" key={r.id || k} delay={k * 80} className="flex flex-col rounded-[1.25rem] border border-fr-line bg-white p-5 font-jakarta shadow-[0_10px_25px_rgba(11,61,42,0.035)] lg:p-6">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-fr-green">
                    <BadgeCheck size={14} strokeWidth={1.9} /> {r9.verified}
                  </span>
                )}
              </div>
              <ReviewContent review={r} original={showsOriginal(r.id)} onToggle={() => toggleOriginal(r.id)} />
              {Array.isArray(r.photos) && r.photos.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.photos.slice(0, 3).map((src) => (
                    <img key={src} src={src} alt={r9.photoBy(r.author)} loading="lazy" className="h-20 w-20 rounded-xl object-cover ring-1 ring-fr-line" />
                  ))}
                </div>
              )}
              <div className="mt-5 flex items-center gap-2.5 border-t border-fr-line pt-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fr-mint text-sm font-extrabold text-fr-green" aria-hidden="true">{r.author.charAt(0).toLocaleUpperCase()}</span>
                <span className="min-w-0 text-[0.76rem] leading-snug">
                  <strong className="block truncate font-semibold text-fr-ink">{r.author}</strong>
                  {/* Pas de date affichée ; la liste reste triée de la plus récente à la plus ancienne. */}
                  {(r.source || r.location) && <span className="text-fr-muted">{r.source ? r9.external : r.location}</span>}
                </span>
              </div>
            </Rise>
          ))}
        </ul>
        {filtered.length > visibleCount && (
          <button onClick={() => setVisibleCount((count) => count + 9)} className="mt-5 h-11 rounded-full px-6 font-jakarta text-sm font-bold text-fr-green ring-1 ring-fr-green/40 transition-[background-color,transform] duration-base ease-out-soft hover:bg-fr-mint motion-safe:active:scale-[0.98]">
            {r9.more(filtered.length - visibleCount)}
          </button>
        )}
      </div>
    </section>
  )
}

// ── Vidéos fournies par le marchand. Sans fichier : la section n'existe pas. ──
const videoTime = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
// Titres et légendes : t.video.product / t.video.stock.
const VIDEO_CLIPS = [
  { id: 'product', ...VIDEO },
  { id: 'stock', ...STOCK_VIDEO },
].filter((clip) => clip.src)

function VideoCard({ clip, activeId, setActiveId }) {
  const v = useI18n().t.video
  const ref = useRef(null)
  const playerRef = useRef(null)
  const inView = useRef(false)
  const userPaused = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = ref.current
    const player = playerRef.current
    if (!video || !player) return
    if (activeId && activeId !== clip.id) video.pause()
    const mayPlay = () => activeId === clip.id || (activeId === null && clip.id === 'product')
    const observer = new IntersectionObserver(([entry]) => {
      inView.current = entry.isIntersecting
      if (entry.isIntersecting && !userPaused.current && !document.hidden && mayPlay()) {
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }, { threshold: 0.45 })
    const onVisibilityChange = () => {
      if (document.hidden) video.pause()
      else if (inView.current && !userPaused.current && mayPlay()) video.play().catch(() => {})
    }
    observer.observe(player)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [activeId, clip.id])

  const togglePlay = () => {
    const video = ref.current
    if (!video) return
    if (video.paused) {
      userPaused.current = false
      setActiveId(clip.id)
      video.play().catch(() => {})
    } else {
      userPaused.current = true
      video.pause()
    }
  }
  return (
    <figure className="mx-auto w-full max-w-[20rem]">
      <h3 className="mb-3 font-jakarta text-[0.98rem] font-extrabold text-fr-ink">{clip.title}</h3>
      <div ref={playerRef} className="overflow-hidden rounded-[1.5rem] border border-fr-line bg-white shadow-[0_20px_45px_rgba(11,61,42,0.14)]">
        <div className="relative bg-fr-deep">
          <video
            ref={ref}
            src={clip.src}
            poster={clip.poster || undefined}
            muted
            loop
            playsInline
            preload="none"
            onPlay={() => { setPlaying(true); setActiveId(clip.id) }}
            onPause={() => setPlaying(false)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
            onTimeUpdate={(event) => setCurrent(Math.floor(event.currentTarget.currentTime))}
            className="aspect-[236/414] w-full object-contain"
            aria-label={clip.title}
          />
          {!playing && (
            <button type="button" onClick={togglePlay} className="group absolute inset-0 flex items-center justify-center bg-fr-deep/10" aria-label={v.play(clip.title)}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-fr-green shadow-xl transition-transform duration-base ease-out-soft can-hover:group-hover:scale-105 motion-safe:active:scale-95">
                <Play size={26} className="ml-1 fill-current" />
              </span>
            </button>
          )}
        </div>
        <div className="flex h-14 items-center gap-2.5 px-3 font-jakarta text-fr-ink">
          <button type="button" onClick={togglePlay} aria-label={playing ? v.pause(clip.title) : v.play(clip.title)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fr-green text-white transition-colors hover:bg-fr-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fr-green">
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5 fill-current" />}
          </button>
          <input type="range" min="0" max={Math.max(1, Math.floor(duration))} value={current} onChange={(event) => { if (ref.current) ref.current.currentTime = Number(event.target.value); setCurrent(Number(event.target.value)) }} aria-label={v.position(clip.title)} className="h-1 min-w-0 flex-1 cursor-pointer accent-fr-green" />
          <span className="shrink-0 text-[0.65rem] font-semibold tabular-nums text-fr-muted">{videoTime(current)} / {videoTime(duration)}</span>
        </div>
      </div>
      <figcaption className="mt-3 font-jakarta text-[0.72rem] leading-relaxed text-fr-muted">{clip.caption}</figcaption>
    </figure>
  )
}

export function VideoF() {
  const v = useI18n().t.video
  const [activeId, setActiveId] = useState(null)
  if (!VIDEO_CLIPS.length) return null
  const clips = VIDEO_CLIPS.map((clip) => ({ ...clip, ...v[clip.id] }))
  return (
    <section id="video" data-analytics-section="video" aria-labelledby="video-title" className="scroll-mt-20 bg-white py-12 lg:py-20">
      <div className={W}>
        <Rise>
          <p className="font-jakarta text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">{v.eyebrow}</p>
          <h2 id="video-title" className="mt-3 max-w-xl font-jakarta text-[1.9rem] font-extrabold leading-[1.04] tracking-[-0.022em] text-fr-ink lg:text-[2.8rem]">{v.title}</h2>
          <p className="mt-4 max-w-2xl font-jakarta text-[0.92rem] leading-relaxed text-fr-muted">{v.intro}</p>
        </Rise>
        <div className={`mx-auto mt-8 grid max-w-[20rem] gap-8 ${clips.length > 1 ? 'md:max-w-[48rem] md:grid-cols-2' : ''}`}>
          {clips.map((clip) => <VideoCard key={clip.id} clip={clip} activeId={activeId} setActiveId={setActiveId} />)}
        </div>
      </div>
    </section>
  )
}

// ── Livraison suisse & retours : uniquement des informations confirmées.
// Trois cartes qui entrent par la droite, l'une après l'autre ; les e-mails de suivi sont résumés dans la carte livraison. ──
export function ServiceF() {
  const { t, money, currency } = useI18n()
  const sv = t.service
  const from = MERCHANT.dispatchCity ? t.common.inSwitzerland(MERCHANT.dispatchCity) : DELIVERY.dispatchLocation
  const rows = [
    [sv.shippingCost, <span key="f" className="font-bold text-fr-green">{money(0)}</span>],
    [sv.zone, sv.zoneValue],
    DELIVERY.estimateDays && [sv.eta, sv.etaValue(DELIVERY.estimateDays)],
    from && [sv.dispatch, sv.dispatchFrom(from)],
    MERCHANT.carrier && [sv.carrier, MERCHANT.carrier],
  ].filter(Boolean)
  const card = 'rounded-[1.5rem] bg-white p-5 font-jakarta lg:p-8'
  const head = (Icon, title) => (
    <div className="flex items-center gap-3.5 lg:block">
      <IconTile icon={Icon} size="lg" className="max-lg:!h-11 max-lg:!w-11" />
      <h3 className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-fr-ink lg:mt-4 lg:text-[1.2rem]">{title}</h3>
    </div>
  )
  const more = (to, label) => (
    <Link to={to} className="mt-2 inline-flex min-h-[2.75rem] items-center gap-1 text-[0.85rem] font-bold text-fr-green hover:underline">
      {label} <ArrowUpRight size={14} />
    </Link>
  )
  return (
    <section id="livraison" data-analytics-section="delivery" className="scroll-mt-20 bg-fr-mint/45 py-14 lg:py-24">
      <div className={W}>
        <SectionHead eyebrow={sv.eyebrow} title={sv.title} accent={sv.accent} />
        <div className="mt-8 grid gap-3 lg:mt-12 lg:grid-cols-3 lg:gap-5">
          <Rise from="right" className={card}>
            {head(Truck, sv.freeDelivery)}
            <dl className="mt-3 space-y-1.5 text-[0.88rem] text-fr-muted">
              {rows.map(([dt, dd]) => (
                <div key={dt} className="flex justify-between gap-3">
                  <dt>{dt}</dt>
                  <dd className="text-right text-fr-ink">{dd}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.84rem] leading-relaxed text-fr-muted">
              {sv.emails}
            </p>
            {more('/livraison', sv.deliveryTerms)}
          </Rise>
          <Rise from="right" delay={90} className={card}>
            {head(RotateCcw, sv.returnTitle)}
            <p className="mt-3 text-[0.88rem] leading-relaxed text-fr-muted">
              {sv.returnText}
            </p>
            {more('/retours-remboursements', sv.returnTerms)}
          </Rise>
          <Rise from="right" delay={180} className={card}>
            {head(LockKeyhole, sv.payTitle)}
            {PAYMENT_METHODS.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <li key={m} className="rounded-lg bg-fr-soft px-2.5 py-1 text-xs font-bold text-fr-ink ring-1 ring-fr-line">{t.payment[m] || PAYMENT_LABELS[m] || m}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[0.88rem] leading-relaxed text-fr-muted">
              {sv.payText(currency)}
            </p>
          </Rise>
        </div>
      </div>
    </section>
  )
}

// ── Bon à savoir : informations produit et questions dans une seule liste dépliable ;
// la mention de sécurité reste toujours visible. ──
export function FaqF() {
  const fq = useI18n().t.faq
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" data-analytics-section="faq" aria-labelledby="faq-titre" className="scroll-mt-20 bg-white py-14 lg:py-24">
      <div className={`${W} grid gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16`}>
        <div>
          <Rise>
            <p className="font-jakarta text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">{fq.eyebrow}</p>
            <h2 id="faq-titre" className="mt-3 font-jakarta text-[1.9rem] font-extrabold leading-[1.04] tracking-[-0.022em] text-fr-ink lg:text-[2.8rem]">
              {fq.title}
            </h2>
          </Rise>
          <Rise delay={90} role="note" aria-label={fq.safety} className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-jakarta">
            <ShieldAlert size={20} strokeWidth={1.8} className="mt-0.5 flex-none text-amber-700" aria-hidden="true" />
            <p className="text-[0.86rem] leading-relaxed text-amber-950">
              <strong className="font-bold">{fq.safety}.</strong> {fq.safetyNote}
            </p>
          </Rise>
          <Rise delay={160} className="mt-3 flex items-start gap-3 rounded-2xl bg-fr-soft p-4 font-jakarta">
            <IconTile icon={MessageCircleQuestion} size="md" tone="white" />
            <p className="text-[0.88rem] text-fr-muted">
              {fq.other}
              {STORE.supportEmail && (
                <a href={`mailto:${STORE.supportEmail}`} className="mt-0.5 block font-bold text-fr-green underline">
                  {STORE.supportEmail}
                </a>
              )}
              <Link to="/contact" className="mt-1 flex items-center gap-1 font-bold text-fr-green hover:underline">
                {fq.contact} <ArrowUpRight size={14} />
              </Link>
            </p>
          </Rise>
        </div>
        <ul className="divide-y divide-fr-line border-y border-fr-line font-jakarta">
          {fq.items.map((f, k) => {

            const isOpen = open === f.id
            return (
              <Rise as="li" key={f.id} delay={Math.min(k, 6) * 45}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f.id)}
                    aria-expanded={isOpen}
                    aria-controls={`info-${f.id}`}
                    className="flex min-h-[3.6rem] w-full items-center justify-between gap-4 py-3 text-left text-[0.98rem] font-bold text-fr-ink transition-colors hover:text-fr-green"
                  >
                    {f.q}
                    <span
                      className={`flex h-8 w-8 flex-none items-center justify-center rounded-full transition-[transform,background-color,color] duration-slow ease-out-soft ${
                        isOpen ? 'rotate-45 bg-fr-green text-white' : 'bg-fr-mint text-fr-green'
                      }`}
                    >
                      <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  </button>
                </h3>
                <div
                  id={`info-${f.id}`}
                  inert={isOpen ? undefined : ''}
                  className={`grid transition-[grid-template-rows,opacity] duration-slow ease-out-soft ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="min-h-0 overflow-hidden pr-10 text-[0.9rem] leading-relaxed text-fr-muted">
                    <div className="space-y-1.5 pb-5">
                      {f.a.map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </Rise>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
