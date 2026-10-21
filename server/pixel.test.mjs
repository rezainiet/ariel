import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('checkout redirect and verified purchase events are deduplicated and contain catalog fields only', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' })
  const { initPixel, trackCheckoutRedirect, trackPurchase } = await vite.ssrLoadModule('/src/lib/pixel.js')
  const stored = new Map()
  const scripts = []
  globalThis.sessionStorage = {
    getItem: (key) => stored.get(key) || null,
    setItem: (key, value) => stored.set(key, value),
  }
  globalThis.window = {}
  globalThis.document = {
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
  }
  try {
    const redirectId = '7f61d399-876b-4a22-af13-c0cb9ca5875c'
    assert.equal(trackCheckoutRedirect(redirectId, 'pack-2'), false) // no consent/initialization
    assert.equal(scripts.length, 0)
    initPixel() // called only after marketing consent by ConsentBanner
    assert.equal(scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js')
    assert.equal(trackCheckoutRedirect(redirectId, 'pack-2'), true)
    assert.equal(trackCheckoutRedirect(redirectId, 'pack-2'), false)
    assert.equal(trackCheckoutRedirect('not a valid id', 'pack-2'), false)
    assert.equal(trackCheckoutRedirect('another-valid-id', 'pack-9'), false)
    trackPurchase({ price: 7, currency: 'CHF', customer: { email: 'private@example.ch' } }) // no verified ID
    trackPurchase({ transaction_id: 'verified-order-1', price: 7, currency: 'CHF', customer: { email: 'private@example.ch' } })
    trackPurchase({ transaction_id: 'verified-order-1', price: 7, currency: 'CHF' })
    const events = window.fbq.queue.map((args) => Array.from(args))
    assert.deepEqual(events.map((event) => event[1]), ['815653229569193', 'AddPaymentInfo', 'Purchase'])
    assert.deepEqual(events[1][2], {
      currency: 'CHF', value: 7, content_ids: ['ariel-all-in-1-pods'], content_type: 'product', num_items: 2,
    })
    // Event IDs let Meta drop duplicates (browser retries, a later server-side event).
    assert.deepEqual(events[1][3], { eventID: `order-${redirectId}` })
    assert.deepEqual(events[2][3], { eventID: 'purchase-verified-order-1' })
    assert.equal(window._fbq, window.fbq)
    assert.equal(JSON.stringify(events).includes('private@example.ch'), false)
    assert.equal(stored.has(`pixel.checkout_redirect.${redirectId}`), true)
    assert.equal(stored.has('pixel.purchase.verified-order-1'), true)
  } finally {
    delete globalThis.window
    delete globalThis.document
    delete globalThis.sessionStorage
    await vite.close()
  }
})
