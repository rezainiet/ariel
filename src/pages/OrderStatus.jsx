import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react'
import { Logo } from '../concepts/frais/ChromeF.jsx'
import { formatCHF } from '../config/store.js'

function paymentLink(orderId) {
  try {
    const value = sessionStorage.getItem(`checkout-payment-v1:${orderId}`)
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch {
    return ''
  }
}

export default function OrderStatus() {
  const { orderId } = useParams()
  const [state, setState] = useState({ loading: true, order: null, error: false })
  const checkoutUrl = paymentLink(orderId)

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

  return (
    <div className="min-h-screen bg-fr-soft font-jakarta text-fr-ink">
      <header className="border-b border-fr-line bg-white">
        <div className="mx-auto flex h-16 max-w-[900px] items-center px-4 lg:px-8"><Logo /></div>
      </header>
      <main className="mx-auto max-w-[620px] px-4 py-10 sm:py-16">
        {loading ? (
          <p role="status" className="flex items-center gap-2 text-fr-muted"><Loader2 size={20} className="animate-spin" /> Chargement du suivi de commande…</p>
        ) : error ? (
          <div className="rounded-[1.6rem] bg-white p-6 ring-1 ring-fr-line sm:p-8">
            <h1 className="text-2xl font-extrabold">Commande introuvable</h1>
            <p className="mt-3 text-fr-muted">Vérifiez le lien de suivi ou contactez-nous avec votre référence de commande.</p>
          </div>
        ) : (
          <div className="rounded-[1.6rem] bg-white p-6 ring-1 ring-fr-line sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-fr-mint text-fr-green">
                {confirmed ? <CheckCircle2 size={25} /> : order.status === 'cancelled' ? <XCircle size={25} /> : <Clock3 size={25} />}
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-fr-green">Suivi de commande</p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {confirmed ? 'Commande confirmée' : order.status === 'cancelled' ? 'Commande annulée' : 'Commande en cours de traitement'}
                </h1>
              </div>
            </div>

            <div className="mt-7 rounded-2xl bg-fr-soft p-4 text-sm sm:p-5">
              <p className="text-fr-muted">Numéro de suivi</p>
              <p className="mt-1 break-all font-bold tabular-nums">{order.orderId}</p>
              <div className="mt-4 flex justify-between gap-3 border-t border-fr-line pt-4">
                <span>{order.packs} sachet{order.packs > 1 ? 's' : ''} Ariel All-in-1 PODS</span>
                <strong className="whitespace-nowrap">{formatCHF(order.total)}</strong>
              </div>
            </div>

            {processing && (
              <div role="status" className="mt-6 space-y-3 text-[0.94rem] leading-relaxed">
                <p><strong>Votre paiement reste à terminer.</strong> Vérifiez vos coordonnées et finalisez votre commande sur la page de paiement externe ouverte dans un nouvel onglet.</p>
                <p className="text-fr-muted">Ce suivi indique que votre commande est en cours. Il ne confirme aucun paiement. Gardez ce numéro pour retrouver son état.</p>
                {checkoutUrl && (
                  <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-fr-green px-6 font-bold text-white">
                    Ouvrir la page de paiement <ArrowUpRight size={17} />
                  </a>
                )}
                {!checkoutUrl && <p className="text-fr-muted">Si la page de paiement ne s’est pas ouverte, autorisez les fenêtres contextuelles puis reprenez la commande.</p>}
              </div>
            )}
            {confirmed && <p role="status" className="mt-6 text-fr-muted">Votre commande a été confirmée après vérification du paiement.</p>}
            {order.status === 'cancelled' && <p role="status" className="mt-6 text-fr-muted">Cette commande a été annulée. Aucun paiement n’est confirmé sur cette page.</p>}
          </div>
        )}
        <Link to="/" className="mt-7 inline-flex font-semibold text-fr-green underline">Retour à la boutique</Link>
      </main>
    </div>
  )
}
