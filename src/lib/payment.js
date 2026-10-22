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
//   4. Seulement alors : e-mail de confirmation + événements de paiement vérifié Snap/Google.
// Tant que rien n'est configuré, aucune commande n'est simulée.
// ─────────────────────────────────────────────────────────────

import { trackCheckoutRedirect, trackMetaPendingOrder } from './pixel.js'
import { trackAnalyticsEvent } from './analytics.js'
import { getTrafficSource } from './trafficSource.js'

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
      trackAnalyticsEvent('paymentRedirect')
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
    if (data?.everflow?.enabled === true) return { enabled: true, domain: data.everflow.domain, provider: 'everflow' }
    return { enabled: data?.externalRedirect?.enabled === true, domain: data?.externalRedirect?.domain || '', provider: 'external' }
  } catch {
    return { enabled: false, domain: '' }
  }
}

let attemptMemory = null
const ATTEMPT_MS = 48 * 60 * 60 * 1000

// order = { offerId, termsAccepted, customer } → { status: 'ready', orderId, redirectUrl } or an error.
export async function startRedirectPayment(order, provider = 'external') {
  try {
    // Chaque clic sur « Acheter » enregistre une commande côté serveur. Même clé pour un nouvel essai
    // identique (double clic, retour arrière, rechargement) : le serveur renvoie la même commande.
    let marketingConsent = false
    try { marketingConsent = localStorage.getItem('consent.marketing.v1') === 'granted' } catch { /* storage unavailable */ }
    const fingerprint = JSON.stringify({ provider, order, marketingConsent })
    let stored = attemptMemory
    try { stored = JSON.parse(sessionStorage.getItem('everflow-attempt-v1') || 'null') || stored } catch { /* use memory */ }
    const reuse = stored?.fingerprint === fingerprint && Date.now() - Number(stored.at) < ATTEMPT_MS
    const idempotencyKey = reuse ? stored.key : crypto.randomUUID()
    attemptMemory = { fingerprint, key: idempotencyKey, at: reuse ? stored.at : Date.now() }
    try { sessionStorage.setItem('everflow-attempt-v1', JSON.stringify(attemptMemory)) } catch { /* use memory */ }
    const payload = { ...order, idempotencyKey, source: getTrafficSource(), ...(provider === 'everflow' ? { marketingConsent } : {}) }
    const res = await fetch(provider === 'everflow' ? '/api/checkout/everflow' : '/api/checkout/redirect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 422) return { status: 'invalid', errors: data.errors || {} }
    if (res.status === 409 && data.error === 'out_of_stock') return { status: 'sold_out' }
    if (res.status === 409 && data.error === 'recent_order' && data.orderId) return { status: 'existing', orderId: data.orderId }
    if (res.status === 409) return { status: 'unavailable' }
    if (res.ok && /^[0-9a-f-]{36}$/i.test(data.orderId || '') && /^https:\/\//.test(data.redirectUrl || '')) {
      if (!data.duplicate) {
        trackCheckoutRedirect(data.orderId, order.offerId)
        trackMetaPendingOrder(data.orderId, order.offerId)
        trackAnalyticsEvent('paymentRedirect')
      }
      return { status: 'ready', orderId: data.orderId, redirectUrl: data.redirectUrl, duplicate: Boolean(data.duplicate) }
    }
    return { status: 'error' }
  } catch {
    return { status: 'error' }
  }
}
