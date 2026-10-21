// ─────────────────────────────────────────────────────────────
// Pixels publicitaires Meta et Snap — chargés uniquement après consentement.
// Aucun événement de conversion n'est déclenché pour une action
// factice ou une transaction non vérifiée (voir trackPurchase).
//
// Correspondance des événements Snap Pixel :
//   PAGE_VIEW      -> 'PAGE_VIEW'
//   VIEW_CONTENT   -> 'VIEW_CONTENT'
//   ADD_CART       -> 'ADD_CART'
//   START_CHECKOUT -> 'START_CHECKOUT'
//   PURCHASE       -> 'PURCHASE'
// ─────────────────────────────────────────────────────────────

import { META_PIXEL_ID } from '../config/attribution.js'
import { getOffer, PRODUCT } from '../config/offers.js'

const SNAP_PIXEL_ID = import.meta.env.VITE_SNAP_PIXEL_ID || ''
let snapInitialized = false
let metaInitialized = false
const firedPurchases = new Set() // anti-duplication des achats (par transaction_id)
const firedRedirects = new Set()
const EVENT_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/

function firstEvent(kind, id, memory) {
  if (!EVENT_ID_RE.test(id || '') || memory.has(id)) return false
  const key = `pixel.${kind}.${id}`
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
  } catch { /* in-memory deduplication still applies */ }
  memory.add(id)
  return true
}

function snaptr(...args) {
  if (!snapInitialized || typeof window === 'undefined' || typeof window.snaptr !== 'function') return
  window.snaptr(...args)
}

function fbq(...args) {
  if (!metaInitialized || typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq(...args)
}

function initSnap() {
  if (snapInitialized || !SNAP_PIXEL_ID || typeof window === 'undefined') return
  snapInitialized = true

  /* eslint-disable */
  ;(function (e, t, n) {
    if (e.snaptr) return
    var a = (e.snaptr = function () {
      a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments)
    })
    a.queue = []
    var s = 'script'
    var r = t.createElement(s)
    r.async = !0
    r.src = n
    var u = t.getElementsByTagName(s)[0]
    u.parentNode.insertBefore(r, u)
  })(window, document, 'https://sc-static.net/scevent.min.js')
  /* eslint-enable */

  snaptr('init', SNAP_PIXEL_ID, {})
}

function initMeta() {
  if (metaInitialized || !META_PIXEL_ID || typeof window === 'undefined') return
  metaInitialized = true
  if (!window.fbq) {
    const queue = function () {
      if (queue.callMethod) queue.callMethod.apply(queue, arguments)
      else queue.queue.push(arguments)
    }
    queue.queue = []
    queue.push = queue
    queue.loaded = true
    queue.version = '2.0'
    window.fbq = queue
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }
  fbq('init', META_PIXEL_ID)
}

export function initPixel() {
  initSnap()
  initMeta()
}

export const isPixelEnabled = () => Boolean(SNAP_PIXEL_ID || META_PIXEL_ID)

const metaCommerce = (payload) => ({
  currency: payload.currency || 'CHF',
  ...(Number.isFinite(payload.price) ? { value: payload.price } : {}),
  ...(payload.item_ids ? { content_ids: payload.item_ids, content_type: 'product' } : {}),
  ...(payload.number_items ? { num_items: payload.number_items } : {}),
})

export function trackPageView() {
  snaptr('track', 'PAGE_VIEW')
  fbq('track', 'PageView')
}

export function trackViewContent(payload = {}) {
  snaptr('track', 'VIEW_CONTENT', payload)
  fbq('track', 'ViewContent', metaCommerce(payload))
}

// À n'appeler QUE lors d'une vraie sélection ajoutée au panier.
export function trackAddCart(payload = {}) {
  snaptr('track', 'ADD_CART', payload)
  fbq('track', 'AddToCart', metaCommerce(payload))
}

export function trackStartCheckout(payload = {}) {
  snaptr('track', 'START_CHECKOUT', payload)
  fbq('track', 'InitiateCheckout', metaCommerce(payload))
}

// A successful pending order is a checkout redirect, never a paid purchase.
// Only catalog values reach Meta; customer names, contact details and the
// customer-bearing hosted URL are deliberately excluded.
export function trackCheckoutRedirect(orderId, offerId) {
  const offer = getOffer(offerId)
  if (!metaInitialized || !offer || !firstEvent('checkout_redirect', orderId, firedRedirects)) return false
  fbq('trackCustom', 'CheckoutRedirect', {
    currency: 'CHF', value: offer.price, content_ids: [PRODUCT.id], content_type: 'product', num_items: offer.packs,
  })
  return true
}

// À n'appeler QU'APRÈS un paiement vérifié côté serveur.
// Déduplication obligatoire via transaction_id.
export function trackPurchase(payload = {}) {
  const tx = payload.transaction_id
  if ((!snapInitialized && !metaInitialized) || !firstEvent('purchase', tx, firedPurchases)) return
  const clean = metaCommerce(payload)
  snaptr('track', 'PURCHASE', {
    transaction_id: tx, currency: clean.currency,
    ...(clean.value !== undefined ? { price: clean.value } : {}),
    item_ids: [PRODUCT.id],
    ...(clean.num_items ? { number_items: clean.num_items } : {}),
  })
  fbq('track', 'Purchase', clean)
}
