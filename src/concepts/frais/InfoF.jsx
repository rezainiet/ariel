import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Play, Truck, RotateCcw, LockKeyhole, Mail, PackageCheck, MapPin, Plus, ArrowUpRight, MessageCircleQuestion, Star } from 'lucide-react'
import { DELIVERY, MERCHANT, PAYMENT_METHODS, PAYMENT_LABELS, STORE, VIDEO } from '../../config/store.js'
import { summarize, formatReviewDate, REVIEWS_ENDPOINT } from '../../data/reviews.js'
import { IconTile } from './Icons.jsx'
import { Rise } from './motion.jsx'
import { FAQ_F } from './contentF.js'

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

// ── Avis : UNIQUEMENT depuis la plateforme d'avis vérifiés (VITE_REVIEWS_ENDPOINT). ──
// Sans source, ou si la source ne renvoie aucun avis : la section n'existe pas.
function useVerifiedReviews() {
  const [state, setState] = useState({ status: REVIEWS_ENDPOINT ? 'loading' : 'none', reviews: [] })
  useEffect(() => {
    if (!REVIEWS_ENDPOINT) return
    let alive = true
    fetch(REVIEWS_ENDPOINT, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list) => {
        const reviews = Array.isArray(list)
          ? list.filter((r) => r && r.rating >= 1 && r.rating <= 5 && r.body && r.author && /^\d{4}-\d{2}-\d{2}$/.test(r.date || ''))
          : []
        if (alive) setState({ status: reviews.length ? 'live' : 'none', reviews })
      })
      .catch(() => alive && setState({ status: 'none', reviews: [] }))
    return () => {
      alive = false
    }
  }, [])
  return state
}

function Stars({ value, size = 14 }) {
  return (
    <span className="flex gap-0.5" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <Star key={k} size={size} strokeWidth={1.6} className={k <= Math.round(value) ? 'fill-fr-green text-fr-green' : 'text-fr-line'} />
      ))}
    </span>
  )
}

export function ReviewsF() {
  const { status, reviews } = useVerifiedReviews()
  const [all, setAll] = useState(false)
  if (status !== 'live') return null
  const sum = summarize(reviews)
  const items = [...reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, all ? 12 : 3)
  return (
    <section id="avis" className="scroll-mt-20 bg-white py-14 lg:py-24">
      <div className={W}>
        <SectionHead
          eyebrow="Avis clients"
          title="Ce qu’en disent"
          accent="nos clients."
          aside={
            <div className="flex items-center gap-3 font-jakarta">
              <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.03em] text-fr-ink">{sum.average.toFixed(1)}</span>
              <span>
                <Stars value={sum.average} size={16} />
                <span className="mt-1 block text-[0.8rem] text-fr-muted">{sum.count} avis</span>
              </span>
            </div>
          }
        />
        <ul className="mt-8 grid gap-3 lg:grid-cols-3 lg:gap-5">
          {items.map((r, k) => (
            <Rise as="li" key={r.id || k} delay={k * 80} className="flex flex-col rounded-[1.5rem] bg-fr-soft p-5 font-jakarta lg:p-7">
              <div className="flex items-center justify-between">
                <Stars value={r.rating} />
                {r.verified && (
                  <span className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-fr-green">
                    <BadgeCheck size={14} strokeWidth={1.9} /> Achat vérifié
                  </span>
                )}
              </div>
              {r.title && <p className="mt-3 text-[1rem] font-bold text-fr-ink">{r.title}</p>}
              <p className="mt-1.5 flex-1 text-[0.9rem] leading-relaxed text-fr-muted">{r.body}</p>
              <p className="mt-4 text-[0.76rem] text-fr-muted">
                <strong className="font-semibold text-fr-ink">{r.author}</strong>
                {r.location ? ` · ${r.location}` : ''} · {formatReviewDate(r.date)}
              </p>
            </Rise>
          ))}
        </ul>
        {reviews.length > 3 && !all && (
          <button onClick={() => setAll(true)} className="mt-5 h-11 rounded-full px-6 font-jakarta text-sm font-bold text-fr-green ring-1 ring-fr-green/40 transition-[background-color,transform] duration-base ease-out-soft hover:bg-fr-mint motion-safe:active:scale-[0.98]">
            Voir plus d’avis
          </button>
        )}
      </div>
    </section>
  )
}

// ── Vidéo réelle (fichier du marchand). Sans fichier : la section n'existe pas. ──
export function VideoF() {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  if (!VIDEO.src) return null
  return (
    <section aria-label="Vidéo" className="bg-white pb-14 lg:pb-20">
      <div className={W}>
        <figure className="relative overflow-hidden rounded-[1.75rem] bg-fr-deep lg:rounded-[2rem]">
          <video
            ref={ref}
            src={VIDEO.src}
            poster={VIDEO.poster || undefined}
            controls={playing}
            playsInline
            preload="none"
            onPlay={() => setPlaying(true)}
            className="aspect-video w-full object-cover"
          />
          {!playing && (
            <button
              onClick={() => ref.current?.play()}
              className="group absolute inset-0 flex items-center justify-center bg-gradient-to-t from-fr-deep/50 to-transparent"
              aria-label="Lire la vidéo"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-fr-green shadow-xl transition-transform duration-base ease-out-soft can-hover:group-hover:scale-105 lg:h-20 lg:w-20">
                <Play size={26} className="ml-1 fill-current" />
              </span>
            </button>
          )}
          {VIDEO.caption && <figcaption className="px-5 py-3 font-jakarta text-sm text-fr-mint">{VIDEO.caption}</figcaption>}
        </figure>
      </div>
    </section>
  )
}

// ── Livraison suisse & retours : uniquement des informations confirmées. ──
export function ServiceF() {
  const from = MERCHANT.dispatchCity ? `${MERCHANT.dispatchCity} (Suisse)` : DELIVERY.dispatchLocation
  const rows = [
    ['Frais de port', <span key="f" className="font-bold text-fr-green">CHF 0.–</span>],
    ['Zone', 'Toute la Suisse'],
    DELIVERY.estimateDays && ['Délai estimé', `${DELIVERY.estimateDays} jours ouvrables`],
    from && ['Expédition', `depuis ${from}`],
    MERCHANT.carrier && ['Transporteur', MERCHANT.carrier],
  ].filter(Boolean)
  const steps = [
    [Mail, 'Confirmation', 'Un e-mail récapitulatif dès la commande.'],
    [PackageCheck, 'Expédition', 'Un second e-mail confirme l’envoi de votre colis.'],
    [MapPin, 'Suivi', 'Un lien de suivi vous est transmis lorsqu’il est disponible.'],
  ]
  return (
    <section id="livraison" className="scroll-mt-20 bg-fr-mint/45 py-14 lg:py-24">
      <div className={W}>
        <SectionHead eyebrow="Livraison & retours" title="Livré en Suisse," accent="sans frais." />
        <div className="mt-8 grid gap-3 lg:mt-12 lg:grid-cols-3 lg:gap-5">
          <Rise className="rounded-[1.5rem] bg-white p-5 font-jakarta lg:p-8">
            <div className="flex items-center gap-3.5 lg:block">
              <IconTile icon={Truck} size="lg" className="max-lg:!h-11 max-lg:!w-11" />
              <h3 className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-fr-ink lg:mt-4 lg:text-[1.2rem]">Livraison offerte</h3>
            </div>
            <dl className="mt-3 space-y-1.5 text-[0.88rem] text-fr-muted">
              {rows.map(([dt, dd]) => (
                <div key={dt} className="flex justify-between gap-3">
                  <dt>{dt}</dt>
                  <dd className="text-right text-fr-ink">{dd}</dd>
                </div>
              ))}
            </dl>
            <Link to="/livraison" className="mt-3 inline-flex items-center gap-1 text-[0.85rem] font-bold text-fr-green hover:underline">
              Conditions de livraison <ArrowUpRight size={14} />
            </Link>
          </Rise>
          <Rise delay={80} className="rounded-[1.5rem] bg-white p-5 font-jakarta lg:p-8">
            <div className="flex items-center gap-3.5 lg:block">
              <IconTile icon={RotateCcw} size="lg" className="max-lg:!h-11 max-lg:!w-11" />
              <h3 className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-fr-ink lg:mt-4 lg:text-[1.2rem]">Retour sous {DELIVERY.returnWindowDays} jours</h3>
            </div>
            <p className="mt-3 text-[0.88rem] leading-relaxed text-fr-muted">
              Vous pouvez demander un retour dans les {DELIVERY.returnWindowDays} jours suivant la réception. C’est un engagement de
              notre boutique : la loi suisse ne prévoit pas de droit de rétractation en ligne.
            </p>
            <Link to="/retours-remboursements" className="mt-3 inline-flex items-center gap-1 text-[0.85rem] font-bold text-fr-green hover:underline">
              Conditions de retour <ArrowUpRight size={14} />
            </Link>
          </Rise>
          <Rise delay={160} className="rounded-[1.5rem] bg-white p-5 font-jakarta lg:p-8">
            <div className="flex items-center gap-3.5 lg:block">
              <IconTile icon={LockKeyhole} size="lg" className="max-lg:!h-11 max-lg:!w-11" />
              <h3 className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-fr-ink lg:mt-4 lg:text-[1.2rem]">Paiement sécurisé</h3>
            </div>
            {PAYMENT_METHODS.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <li key={m} className="rounded-lg bg-fr-soft px-2.5 py-1 text-xs font-bold text-fr-ink ring-1 ring-fr-line">{PAYMENT_LABELS[m] || m}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[0.88rem] leading-relaxed text-fr-muted">
              Montant total en CHF affiché avant l’achat. Le paiement est traité sur la page sécurisée d’un prestataire
              spécialisé : aucune donnée de carte ne transite par notre boutique.
            </p>
          </Rise>
        </div>
        <ol className="mt-8 grid gap-4 font-jakarta sm:grid-cols-3 lg:mt-10">
          {steps.map(([Icon, t, b], k) => (
            <Rise as="li" key={t} delay={k * 80} className="flex items-start gap-3">
              <IconTile icon={Icon} size="sm" tone="white" round />
              <span>
                <span className="block text-[0.9rem] font-bold text-fr-ink">{k + 1}. {t}</span>
                <span className="block text-[0.82rem] text-fr-muted">{b}</span>
              </span>
            </Rise>
          ))}
        </ol>
      </div>
    </section>
  )
}

// ── FAQ compacte ──
export function FaqF() {
  const [open, setOpen] = useState(null)
  return (
    <section id="faq" className="scroll-mt-20 bg-white py-14 lg:py-24">
      <div className={`${W} grid gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:gap-16`}>
        <div>
          <SectionHead eyebrow="Questions fréquentes" title="Bon à savoir." />
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-fr-soft p-4 font-jakarta">
            <IconTile icon={MessageCircleQuestion} size="md" tone="white" />
            <p className="text-[0.88rem] text-fr-muted">
              Une autre question&nbsp;?
              {STORE.supportEmail && (
                <a href={`mailto:${STORE.supportEmail}`} className="mt-0.5 block font-bold text-fr-green underline">
                  {STORE.supportEmail}
                </a>
              )}
              <Link to="/contact" className="mt-1 flex items-center gap-1 font-bold text-fr-green hover:underline">
                Contact &amp; suivi de commande <ArrowUpRight size={14} />
              </Link>
            </p>
          </div>
        </div>
        <div className="divide-y divide-fr-line border-y border-fr-line font-jakarta">
          {FAQ_F.map((f, k) => {
            const isOpen = open === k
            return (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : k)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${k}`}
                  className="flex min-h-[3.6rem] w-full items-center justify-between gap-4 py-3 text-left text-[0.98rem] font-bold text-fr-ink transition-colors hover:text-fr-green"
                >
                  {f.q}
                  <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full transition-[transform,background-color,color] duration-slow ease-out-soft ${isOpen ? 'rotate-45 bg-fr-green text-white' : 'bg-fr-mint text-fr-green'}`}>
                    <Plus size={16} strokeWidth={2.2} />
                  </span>
                </button>
                <div
                  id={`faq-${k}`}
                  inert={isOpen ? undefined : ''}
                  className={`grid transition-[grid-template-rows,opacity] duration-slow ease-out-soft ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <p className="min-h-0 overflow-hidden pr-10 text-[0.9rem] leading-relaxed text-fr-muted">
                    <span className="block pb-5">{f.a}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
