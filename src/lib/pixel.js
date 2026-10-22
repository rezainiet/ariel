// ─────────────────────────────────────────────────────────────
// Pixels publicitaires Meta, Snap et Google — chargés uniquement après consentement.
// Meta Purchase mesure la première commande en attente réellement créée par le
// serveur, au plus une fois par appareil pendant 48 h. Snap et Google Purchase
// restent liés au paiement vérifié.
//
// Correspondance des événements :
//   page vue            Meta PageView          Snap PAGE_VIEW      Google page_view
//   fiche produit       Meta ViewContent       Snap VIEW_CONTENT   Google view_item
//   ajout au panier     Meta AddToCart         Snap ADD_CART       Google add_to_cart
//   page de commande    Meta InitiateCheckout  Snap START_CHECKOUT Google begin_checkout
//   commande en attente Meta Purchase          —                  —
//   redirection         Meta AddPaymentInfo    Snap ADD_BILLING    Google add_payment_info (+ conversion Ads)
//   paiement vérifié    —                      Snap PURCHASE       Google purchase
//
// Déduplication : chaque conversion porte un identifiant d'événement (Meta eventID, Snap
// client_dedup_id, Google transaction_id) et n'est envoyée qu'une fois par session et par
// identifiant (mémoire + sessionStorage). Meta Purchase a aussi un cookie first-party
// de 48 h et ne part jamais pour une réponse serveur « duplicate ».
// Aucune donnée client (nom, e-mail, téléphone, adresse) n'est jamais transmise.
// ─────────────────────────────────────────────────────────────

import { META_PIXEL_ID } from '../config/attribution.js'
import { getOffer, PRODUCT } from '../config/offers.js'

const SNAP_PIXEL_ID = import.meta.env.VITE_SNAP_PIXEL_ID || ''
// Balise Google (G-… ou AW-…) et, en option, l'action de conversion Google Ads du clic « Acheter »
// (« AW-123456789/AbCdEfGh »). Vides = rien n'est chargé.
const GOOGLE_TAG_ID = /^(G|AW)-[A-Z0-9]+$/i.test(import.meta.env.VITE_GOOGLE_TAG_ID || '') ? import.meta.env.VITE_GOOGLE_TAG_ID : ''
const GOOGLE_ADS_SEND_TO = /^AW-\d+\/[\w-]+$/.test(import.meta.env.VITE_GOOGLE_ADS_CHECKOUT_SEND_TO || '') ? import.meta.env.VITE_GOOGLE_ADS_CHECKOUT_SEND_TO : ''

let snapInitialized = false
let metaInitialized = false
let googleInitialized = false
let lastPageView = ''
const fired = new Set() // anti-duplication en mémoire (en plus de sessionStorage)
const EVENT_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/

function firstEvent(kind, id) {
  const key = `pixel.${kind}.${id}`
  if (!EVENT_ID_RE.test(id || '') || fired.has(key)) return false
  try {
    if (sessionStorage.getItem(key)) return false
    if (kind === 'verified_purchase' && localStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    if (kind === 'verified_purchase') localStorage.setItem(key, '1')
  } catch { /* in-memory deduplication still applies */ }
  fired.add(key)
  return true
}

const anyPixel = () => snapInitialized || metaInitialized || googleInitialized

function snaptr(...args) {
  if (!snapInitialized || typeof window === 'undefined' || typeof window.snaptr !== 'function') return
  window.snaptr(...args)
}

function fbq(...args) {
  if (!metaInitialized || typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq(...args)
}

function gtag() {
  if (!googleInitialized || typeof window === 'undefined') return
  // gtag.js attend l'objet `arguments` lui-même dans dataLayer.
  window.dataLayer.push(arguments) // eslint-disable-line prefer-rest-params
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
    if (!window._fbq) window._fbq = queue // comme le code officiel : fbevents.js s'y raccroche
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }
  fbq('init', META_PIXEL_ID)
}

function initGoogle() {
  if (googleInitialized || !GOOGLE_TAG_ID || typeof window === 'undefined') return
  googleInitialized = true
  window.dataLayer = window.dataLayer || []
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_TAG_ID)}`
  document.head.appendChild(script)
  gtag('js', new Date())
  // Chargée seulement après « Tout accepter » : consentement publicitaire accordé.
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' })
  gtag('config', GOOGLE_TAG_ID, { send_page_view: false }) // pages vues envoyées par trackPageView (SPA)
  const ads = GOOGLE_ADS_SEND_TO.split('/')[0]
  if (ads && ads !== GOOGLE_TAG_ID) gtag('config', ads, { send_page_view: false })
}

export function initPixel() {
  initSnap()
  initMeta()
  initGoogle()
}

export const isPixelEnabled = () => Boolean(SNAP_PIXEL_ID || META_PIXEL_ID || GOOGLE_TAG_ID)

const metaCommerce = (payload) => ({
  currency: payload.currency || 'CHF',
  ...(Number.isFinite(payload.price) ? { value: payload.price } : {}),
  ...(payload.item_ids ? { content_ids: payload.item_ids, content_type: 'product' } : {}),
  ...(payload.number_items ? { num_items: payload.number_items } : {}),
})
const googleCommerce = (payload) => ({
  currency: payload.currency || 'CHF',
  ...(Number.isFinite(payload.price) ? { value: payload.price } : {}),
  items: [{ item_id: PRODUCT.id, item_name: PRODUCT.name, ...(payload.number_items ? { quantity: payload.number_items } : {}) }],
})

// Une page vue par adresse : l'appel au chargement (routeur) et celui qui suit le consentement
// ne comptent qu'une fois.
export function trackPageView() {
  if (!anyPixel() || typeof window === 'undefined') return
  const page = window.location.pathname + window.location.search
  if (page === lastPageView) return
  lastPageView = page
  snaptr('track', 'PAGE_VIEW')
  fbq('track', 'PageView')
  gtag('event', 'page_view', { page_location: window.location.href, page_title: document.title })
}

export function trackViewContent(payload = {}) {
  snaptr('track', 'VIEW_CONTENT', payload)
  fbq('track', 'ViewContent', metaCommerce(payload))
  gtag('event', 'view_item', googleCommerce(payload))
}

// À n'appeler QUE lors d'une vraie sélection ajoutée au panier.
export function trackAddCart(payload = {}) {
  snaptr('track', 'ADD_CART', payload)
  fbq('track', 'AddToCart', metaCommerce(payload))
  gtag('event', 'add_to_cart', googleCommerce(payload))
}

// Une seule fois par session et par offre, même si la page de commande est rechargée ou rouverte.
export function trackStartCheckout(payload = {}, offerId = '') {
  if (!anyPixel() || !firstEvent('start_checkout', offerId || 'cart')) return
  const eventId = `checkout-${offerId || 'cart'}-${sessionId()}`
  snaptr('track', 'START_CHECKOUT', { ...payload, client_dedup_id: eventId })
  fbq('track', 'InitiateCheckout', metaCommerce(payload), { eventID: eventId })
  gtag('event', 'begin_checkout', googleCommerce(payload))
}

const META_PURCHASE_COOKIE = 'ariel_meta_purchase_v1'
const META_PURCHASE_MS = 48 * 60 * 60 * 1000

function recentMetaPurchase() {
  let cookieTime = NaN
  let storedTime = NaN
  try {
    const encoded = document.cookie.split('; ').find((part) => part.startsWith(`${META_PURCHASE_COOKIE}=`))?.split('=')[1]
    cookieTime = Number(encoded?.split('.')[0])
  } catch { /* cookies unavailable */ }
  try { storedTime = Number(localStorage.getItem(META_PURCHASE_COOKIE)) } catch { /* storage unavailable */ }
  return [cookieTime, storedTime].some((time) => Number.isFinite(time) && time > 0 && Date.now() - time < META_PURCHASE_MS)
}

// Meta Purchase represents a newly recorded pending order, not a paid order.
// A server duplicate and a second order on the same browser within 48 h cannot fire it.
export function trackMetaPendingOrder(orderId, offerId, duplicate = false) {
  const offer = getOffer(offerId)
  if (!metaInitialized || duplicate || !offer || recentMetaPurchase() || !firstEvent('meta_purchase', orderId)) return false
  const now = Date.now()
  try {
    document.cookie = `${META_PURCHASE_COOKIE}=${now}.${orderId}; Max-Age=172800; Path=/; SameSite=Lax; Secure`
    localStorage.setItem(META_PURCHASE_COOKIE, String(now))
  } catch { /* memory and session deduplication still apply */ }
  fbq('track', 'Purchase', {
    currency: 'CHF', value: offer.price, content_ids: [PRODUCT.id], content_type: 'product', num_items: offer.packs,
  }, { eventID: `pending-order-${orderId}` })
  return true
}

// A successful pending order is a checkout redirect, not a paid order.
// Only catalog values reach the pixels; customer names, contact details and the
// customer-bearing hosted URL are deliberately excluded.
export function trackCheckoutRedirect(orderId, offerId) {
  const offer = getOffer(offerId)
  if (!anyPixel() || !offer || !firstEvent('checkout_redirect', orderId)) return false
  const values = { currency: 'CHF', value: offer.price, content_ids: [PRODUCT.id], content_type: 'product', num_items: offer.packs }
  fbq('track', 'AddPaymentInfo', values, { eventID: `order-${orderId}` })
  snaptr('track', 'ADD_BILLING', {
    currency: 'CHF', price: offer.price, item_ids: [PRODUCT.id], number_items: offer.packs, client_dedup_id: `order-${orderId}`,
  })
  gtag('event', 'add_payment_info', googleCommerce({ price: offer.price, number_items: offer.packs }))
  if (GOOGLE_ADS_SEND_TO) gtag('event', 'conversion', { send_to: GOOGLE_ADS_SEND_TO, value: offer.price, currency: 'CHF', transaction_id: orderId })
  return true
}

// À n'appeler QU'APRÈS un paiement vérifié côté serveur.
// Déduplication obligatoire via transaction_id.
export function trackPurchase(payload = {}) {
  const tx = payload.transaction_id
  if (!(snapInitialized || googleInitialized) || !firstEvent('verified_purchase', tx)) return
  const clean = metaCommerce(payload)
  snaptr('track', 'PURCHASE', {
    transaction_id: tx, client_dedup_id: tx, currency: clean.currency,
    ...(clean.value !== undefined ? { price: clean.value } : {}),
    item_ids: [PRODUCT.id],
    ...(clean.num_items ? { number_items: clean.num_items } : {}),
  })
  gtag('event', 'purchase', { transaction_id: tx, ...googleCommerce(payload) })
}

// Identifiant de session de navigation (déduplication de InitiateCheckout entre onglets d'une même session).
function sessionId() {
  try {
    let id = sessionStorage.getItem('pixel.session')
    if (!id) {
      id = Math.random().toString(36).slice(2, 12)
      sessionStorage.setItem('pixel.session', id)
    }
    return id
  } catch {
    return 'nosession'
  }
}
