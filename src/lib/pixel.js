// ─────────────────────────────────────────────────────────────
// Snap Pixel — architecture d'intégration propre.
// Le pixel ne se charge QUE si VITE_SNAP_PIXEL_ID est défini.
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

const PIXEL_ID = import.meta.env.VITE_SNAP_PIXEL_ID || ''
let initialized = false
const firedPurchases = new Set() // anti-duplication des achats (par transaction_id)

function snaptr(...args) {
  if (typeof window === 'undefined' || typeof window.snaptr !== 'function') return
  window.snaptr(...args)
}

// Injecte le snippet officiel Snap une seule fois.
export function initPixel() {
  if (initialized || !PIXEL_ID || typeof window === 'undefined') return
  initialized = true

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

  snaptr('init', PIXEL_ID, {})
}

export const isPixelEnabled = () => Boolean(PIXEL_ID)

export function trackPageView() {
  snaptr('track', 'PAGE_VIEW')
}

export function trackViewContent(payload = {}) {
  snaptr('track', 'VIEW_CONTENT', payload)
}

// À n'appeler QUE lors d'une vraie sélection ajoutée au panier.
export function trackAddCart(payload = {}) {
  snaptr('track', 'ADD_CART', payload)
}

export function trackStartCheckout(payload = {}) {
  snaptr('track', 'START_CHECKOUT', payload)
}

// À n'appeler QU'APRÈS un paiement vérifié côté serveur.
// Déduplication obligatoire via transaction_id.
export function trackPurchase(payload = {}) {
  const tx = payload.transaction_id
  if (tx) {
    if (firedPurchases.has(tx)) return
    firedPurchases.add(tx)
  }
  snaptr('track', 'PURCHASE', payload)
}
