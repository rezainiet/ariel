// ─────────────────────────────────────────────────────────────
// FRONTIÈRE D'INTÉGRATION PAIEMENT
// Le navigateur ne traite JAMAIS de données de carte. Le flux prévu :
//   1. startPayment(order) → POST vers NOTRE serveur (VITE_CHECKOUT_API),
//      qui crée une session chez le prestataire (TWINT/cartes/wallets…)
//      et renvoie une URL de redirection hébergée par le prestataire.
//   2. Le prestataire redirige vers /commande/confirmation?session=…
//   3. verifyOrder(session) → NOTRE serveur vérifie le paiement auprès du
//      prestataire (webhook/API) et renvoie la commande confirmée.
//   4. Seulement alors : e-mail de confirmation + événement PURCHASE.
// Tant que rien n'est configuré, aucune commande n'est simulée.
// ─────────────────────────────────────────────────────────────

const PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || ''
const API = import.meta.env.VITE_CHECKOUT_API || ''

export function isPaymentConfigured() {
  return Boolean(PROVIDER && API)
}

export async function startPayment(order) {
  if (!isPaymentConfigured()) return { status: 'not_configured' }
  try {
    const res = await fetch(`${API}/checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    if (!res.ok) return { status: 'error' }
    const data = await res.json()
    if (data?.redirectUrl) {
      window.location.assign(data.redirectUrl)
      return { status: 'redirecting' }
    }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}

// Renvoie { verified: true, orderId, total, currency, packs } ou null.
export async function verifyOrder(sessionId) {
  if (!isPaymentConfigured() || !sessionId) return null
  try {
    const res = await fetch(`${API}/orders/verify?session=${encodeURIComponent(sessionId)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data?.verified === true ? data : null
  } catch {
    return null
  }
}
