import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { PRODUCT, storeRef } from '../config/store.js'
import { verifyOrder } from '../lib/payment.js'
import { trackPurchase } from '../lib/pixel.js'
import { trackAnalyticsEvent } from '../lib/analytics.js'
import { Logo } from '../concepts/frais/ChromeF.jsx'

// Confirmation : n'affiche un succès et ne déclenche les événements de paiement
// vérifié (Snap/Google) qu'après vérification SERVEUR. Meta Purchase est envoyé
// lors du clic valide sur « Acheter ».
export default function OrderConfirmation() {
  const [params] = useSearchParams()
  const session = params.get('session')
  const [state, setState] = useState({ status: 'loading', order: null })
  const { clear } = useCart()
  const fired = useRef(false)

  useEffect(() => {
    let alive = true
    verifyOrder(session).then((order) => {
      if (!alive) return
      if (order && !fired.current) {
        fired.current = true
        clear()
        try {
          sessionStorage.removeItem('checkout-form-v1') // commande confirmée : on efface les coordonnées saisies
        } catch {
          /* stockage indisponible */
        }
        trackPurchase({
          transaction_id: order.orderId,
          price: order.total,
          currency: order.currency || 'CHF',
          item_ids: [PRODUCT.id],
          number_items: order.packs,
        })
        trackAnalyticsEvent('verifiedPurchase')
      }
      setState({ status: order ? 'verified' : 'unverified', order })
    })
    return () => {
      alive = false
    }
  }, [session, clear])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fr-soft px-6 py-16 text-center font-jakarta">
      <Logo />
      {state.status === 'loading' && (
        <p className="mt-10 flex items-center gap-2 text-fr-ink/75" role="status">
          <Loader2 size={18} className="animate-spin" /> Vérification de votre paiement…
        </p>
      )}
      {state.status === 'verified' && (
        <div className="mt-10 max-w-md">
          <CheckCircle2 size={44} className="mx-auto text-fr-green" />
          <h1 className="mt-4 font-extrabold tracking-[-0.03em] text-3xl text-fr-ink">Merci pour votre commande</h1>
          <p className="mt-2 text-fr-ink/75">
            Commande n° <strong>{state.order.orderId}</strong>. Une confirmation a été envoyée par e-mail. Vous serez averti dès
            l’expédition.
          </p>
        </div>
      )}
      {state.status === 'unverified' && (
        <div className="mt-10 max-w-md">
          <Clock size={40} className="mx-auto text-fr-muted" />
          <h1 className="mt-4 font-extrabold tracking-[-0.03em] text-3xl text-fr-ink">Paiement non confirmé</h1>
          <p className="mt-2 text-fr-ink/75">
            Nous n’avons pas pu confirmer de paiement pour cette page. Si vous avez été débité, contactez {storeRef()} avec la
            référence de votre paiement.
          </p>
        </div>
      )}
      <Link to="/" className="mt-8 flex h-12 items-center rounded-full bg-fr-green px-6 font-bold text-white">Retour à la boutique</Link>
    </div>
  )
}
