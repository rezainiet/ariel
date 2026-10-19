// ─────────────────────────────────────────────────────────────
// FRONTIÈRE D'INTÉGRATION PAIEMENT
// Le navigateur ne traite JAMAIS de données de carte. Le flux prévu :
//   1. startPayment(order) → POST vers NOTRE serveur (VITE_CHECKOUT_API),
//      qui crée une session chez le prestataire (TWINT/cartes/wallets…)
//      et renvoie une URL de redirection hébergée par le prestataire.
//      Retours à configurer chez le prestataire :
//        succès   → /checkout/confirmation?session=…
//        annulé   → /checkout?paiement=annule      (le formulaire est conservé)
//        erreur   → /checkout?paiement=erreur
//   2. Le prestataire redirige vers /checkout/confirmation?session=…
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
      // Pas de montant : le serveur le recalcule depuis offerId (server/validate-order.mjs).
      body: JSON.stringify({
        ...order,
        returnUrls: {
          success: `${window.location.origin}/checkout/confirmation`,
          cancel: `${window.location.origin}/checkout?paiement=annule`,
          error: `${window.location.origin}/checkout?paiement=erreur`,
        },
      }),
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

// ─────────────────────────────────────────────────────────────
// Paiement par REDIRECTION EXTERNE (réglé dans /admin, servi par server/index.mjs).
// Le serveur valide la commande (mêmes règles que le navigateur) puis construit l'URL
// (domaine + code de l'offre + paramètres). Aucune URL n'est construite côté navigateur.
// ─────────────────────────────────────────────────────────────
export async function getRedirectPayment() {
  try {
    const res = await fetch('/api/payment/config', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return { enabled: false, domain: '' }
    const data = await res.json()
    return { enabled: data?.externalRedirect?.enabled === true, domain: data?.externalRedirect?.domain || '' }
  } catch {
    return { enabled: false, domain: '' }
  }
}

// order = { offerId, termsAccepted, customer } → { status: 'redirecting' | 'invalid' | 'unavailable' | 'error', errors? }
export async function startRedirectPayment(order) {
  try {
    const res = await fetch('/api/checkout/redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 422) return { status: 'invalid', errors: data.errors || {} }
    if (res.status === 409) return { status: 'unavailable' }
    if (res.ok && /^https:\/\//.test(data.redirectUrl || '')) {
      window.location.assign(data.redirectUrl)
      return { status: 'redirecting' }
    }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}
