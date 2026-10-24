import '@fontsource-variable/space-grotesk'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, Clock3, Copy, Loader2, LockKeyhole, XCircle } from 'lucide-react'
import { Logo } from '../concepts/frais/ChromeF.jsx'
import { formatCHF, getOffer, PRODUCT } from '../config/store.js'
import { trackPurchase } from '../lib/pixel.js'
import { cleanCheckoutUrl } from '../lib/checkoutUrl.js'

const dateLabel = new Intl.DateTimeFormat('fr-CH', {
  timeZone: 'Europe/Zurich', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

function paymentLink(orderId, routeUrl) {
  try {
    const value = routeUrl || sessionStorage.getItem(`checkout-payment-v1:${orderId}`)
    return cleanCheckoutUrl(value)
  } catch {
    return ''
  }
}

function Step({ n, label, current, done }) {
  return (
    <li className="flex min-w-0 items-center gap-2">
      <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border text-xs font-bold ${done ? 'border-fr-green bg-fr-green text-white' : current ? 'border-fr-green bg-fr-mint text-fr-deep' : 'border-fr-line text-fr-muted'}`}>
        {done ? <Check size={15} strokeWidth={2.5} /> : n}
      </span>
      <span className={`truncate text-[0.69rem] font-semibold sm:text-xs ${current ? 'text-fr-deep' : 'text-fr-muted'}`}>{label}</span>
    </li>
  )
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const location = useLocation()
  const [state, setState] = useState({ loading: true, order: null, error: false })
  const [opening, setOpening] = useState(false)
  const [copied, setCopied] = useState(false)
  const openingRef = useRef(false)
  const checkoutUrl = paymentLink(orderId, location.state?.checkoutUrl)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, { cache: 'no-store' })
        if (!response.ok) throw new Error('not_found')
        const order = await response.json()
        if (alive) setState({ loading: false, order, error: false })
      } catch {
        if (alive) setState({ loading: false, order: null, error: true })
      }
    }
    load()
    const timer = window.setInterval(() => {
      if (!document.hidden) load()
    }, 15000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [orderId])

  const { loading, order, error } = state
  const processing = order?.status === 'processing'
  const confirmed = order?.status === 'confirmed'
  const cancelled = order?.status === 'cancelled'
  const offer = order ? getOffer(order.offerId) : null

  useEffect(() => {
    if (confirmed) trackPurchase({
      transaction_id: order.orderId, price: order.total, currency: 'CHF',
      item_ids: [PRODUCT.id], number_items: order.packs,
    })
  }, [confirmed, order?.orderId, order?.total, order?.packs])

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(order.orderId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch { /* the reference remains selectable */ }
  }
  const openPayment = (event) => {
    if (openingRef.current) {
      event.preventDefault()
      return
    }
    openingRef.current = true
    setOpening(true)
    window.setTimeout(() => {
      openingRef.current = false
      setOpening(false)
    }, 4000)
  }

  return (
    <div className="min-h-screen bg-[#F1F5F2] font-jakarta text-fr-ink">
      <header className="border-b border-fr-line bg-white">
        <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between px-4 sm:px-6">
          <Logo />
          <span className="hidden text-[0.68rem] font-bold uppercase tracking-[0.18em] text-fr-muted min-[380px]:block">Suivi sécurisé</span>
        </div>
      </header>

      <main className="mx-auto max-w-[680px] px-3 pb-12 pt-5 sm:px-5 sm:pt-9">
        {loading ? (
          <div role="status" className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-white px-5 py-20 text-fr-muted ring-1 ring-fr-line">
            <Loader2 size={20} className="animate-spin" /> Chargement du bon de commande…
          </div>
        ) : error ? (
          <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-fr-line sm:p-8">
            <h1 className="font-grotesk text-2xl font-bold">Commande introuvable</h1>
            <p className="mt-2 text-sm leading-relaxed text-fr-muted">Vérifiez le lien de suivi ou contactez-nous avec votre référence de commande.</p>
          </div>
        ) : (
          <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_70px_rgba(11,61,42,0.09)] ring-1 ring-fr-line animate-fade-up" aria-label="Bon de commande">
            <div className="bg-fr-deep px-5 pb-6 pt-5 text-white sm:px-8 sm:pt-7">
              <div className="flex items-center justify-between gap-3">
                <p className="font-grotesk text-[0.68rem] font-bold uppercase tracking-[0.2em] text-white/65">Bon de commande</p>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em]">
                  {confirmed ? 'Confirmée' : cancelled ? 'Annulée' : 'Paiement en attente'}
                </span>
              </div>
              <div className="mt-5 flex items-start gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white/10 text-[#8BE0AF]">
                  {confirmed ? <CheckCircle2 size={22} /> : cancelled ? <XCircle size={22} /> : <Clock3 size={22} className="motion-safe:animate-pulse-soft" />}
                </span>
                <div>
                  <h1 className="font-grotesk text-[1.48rem] font-bold leading-[1.12] tracking-[-0.035em] sm:text-[1.8rem]">
                    {confirmed ? 'Commande confirmée' : cancelled ? 'Commande annulée' : 'Commande en cours'}
                  </h1>
                  <p className="mt-1 text-[0.81rem] text-white/72">
                    {confirmed ? 'Paiement vérifié par notre équipe.' : cancelled ? 'Cette commande a été clôturée.' : 'Finalisez le paiement dans l’onglet sécurisé.'}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-1 border-t border-white/15 pt-3 text-[0.72rem] text-white/65">
                <span>Réf. <strong className="font-grotesk tracking-[0.06em] text-white">{order.orderId.slice(0, 8).toUpperCase()}</strong></span>
                <time dateTime={order.createdAt}>{dateLabel.format(new Date(order.createdAt))}</time>
              </div>
            </div>

            <div className="px-5 pb-6 pt-5 sm:px-8 sm:pb-8">
              <ol className="grid grid-cols-3 gap-1 rounded-xl bg-fr-soft px-2.5 py-3 sm:px-4" aria-label="Progression de la commande">
                <Step n="1" label="Informations" done />
                <Step n="2" label="Paiement" current={processing} done={confirmed} />
                <Step n="3" label="Confirmation" current={confirmed} />
              </ol>

              <div className="mt-5 flex items-center gap-3">
                {offer && <img src={offer.image} alt="" className="h-14 w-14 flex-none rounded-xl bg-fr-soft object-contain p-1" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[0.84rem] font-bold">Ariel All-in-1 PODS</p>
                  <p className="text-[0.74rem] text-fr-muted">{order.packs} sachet{order.packs > 1 ? 's' : ''} · {offer?.washes || order.packs * 60} capsules</p>
                </div>
                <strong className="font-grotesk text-[0.94rem] tabular-nums">{formatCHF(order.total)}</strong>
              </div>

              <div className="mt-4 border-t border-dashed border-fr-line pt-4">
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-fr-muted">{confirmed ? 'Total payé' : cancelled ? 'Montant de la commande' : 'Total à régler'}</p>
                    <p className="mt-0.5 text-[0.72rem] text-fr-muted">Livraison offerte en Suisse</p>
                  </div>
                  <strong className="font-grotesk text-[1.68rem] font-bold leading-none tabular-nums tracking-[-0.045em] text-fr-deep">{formatCHF(order.total)}</strong>
                </div>
              </div>

              {processing && (
                <div className="mt-5 rounded-xl border border-fr-mint2 bg-fr-mint px-3.5 py-3.5 animate-fade-up [animation-delay:90ms]">
                  <p className="flex items-start gap-2.5 text-[0.79rem] leading-[1.5] text-fr-deep">
                    <LockKeyhole size={17} className="mt-0.5 flex-none" />
                    <span><strong>Étape suivante :</strong> vérifiez vos coordonnées et terminez le paiement sur la page externe. Ce bon ne confirme pas encore un paiement.</span>
                  </p>
                </div>
              )}

              {processing && checkoutUrl && (
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" onClick={openPayment} aria-disabled={opening} className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-fr-green px-4 text-[0.87rem] font-bold text-white shadow-[0_9px_18px_rgba(14,122,71,0.18)] transition duration-base hover:bg-[#0B6A3D] ${opening ? 'cursor-wait opacity-70' : ''}`}>
                  {opening ? 'Page de paiement ouverte' : 'Finaliser le paiement'} <ArrowUpRight size={17} />
                </a>
              )}
              {processing && !checkoutUrl && (
                <Link to="/checkout" className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-fr-green px-4 text-[0.87rem] font-bold text-white">
                  Reprendre le paiement
                </Link>
              )}
              {cancelled && <p className="mt-5 rounded-xl bg-fr-soft p-3 text-[0.8rem] text-fr-muted">Aucun paiement n’est confirmé pour cette commande.</p>}

              <div className="mt-5 flex items-center justify-between gap-2 border-t border-fr-line pt-4">
                <div className="min-w-0">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-fr-muted">Référence complète</p>
                  <p className="mt-0.5 break-all font-grotesk text-[0.74rem] font-medium tabular-nums text-fr-ink">{order.orderId}</p>
                </div>
                <button type="button" onClick={copyReference} aria-label="Copier la référence" className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-fr-line text-fr-green transition hover:bg-fr-mint">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </article>
        )}
        <Link to="/" className="mt-5 inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-fr-muted hover:text-fr-green"><ArrowLeft size={15} /> Retour à la boutique</Link>
      </main>
    </div>
  )
}
