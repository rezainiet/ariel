import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('Snap and Meta initialize after consent and keep purchase events separate', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' })
  const { initPixel, trackPageView, trackViewContent, trackStartCheckout, trackCheckoutRedirect, trackPurchase } = await vite.ssrLoadModule('/src/lib/pixel.js')
  const session = new Map()
  const scripts = []
  globalThis.sessionStorage = {
    getItem: (key) => session.get(key) || null,
    setItem: (key, value) => session.set(key, value),
  }
  globalThis.localStorage = { getItem: () => null, setItem: () => {} }
  globalThis.window = { location: { pathname: '/', search: '', href: 'https://shop.example.ch/' } }
  globalThis.document = {
    title: 'Ariel', createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) },
    getElementsByTagName: () => [{ parentNode: { insertBefore: (script) => scripts.push(script) } }],
  }
  try {
    const orderId = '7f61d399-876b-4a22-af13-c0cb9ca5875c'
    const product = { price: 7, currency: 'CHF', item_ids: ['ariel-all-in-1-pods'], number_items: 2 }
    trackPageView()
    trackViewContent(product)
    trackViewContent(product)
    trackStartCheckout(product, 'pack-2')
    assert.equal(scripts.length, 0) // consent has not initialized the pixel

    initPixel()
    assert.deepEqual(scripts.map((script) => script.src), ['https://sc-static.net/scevent.min.js', 'https://connect.facebook.net/en_US/fbevents.js'])
    trackPageView()
    trackViewContent(product)
    trackViewContent(product)
    trackStartCheckout(product, 'pack-2')
    trackStartCheckout(product, 'pack-2')
    assert.equal(trackCheckoutRedirect(orderId, 'pack-2'), true)
    assert.equal(trackCheckoutRedirect(orderId, 'pack-2'), false)
    const events = window.fbq.queue.map((args) => Array.from(args))
    assert.deepEqual(events.map((event) => event[1]), ['815653229569193', 'PageView', 'ViewContent', 'InitiateCheckout', 'AddPaymentInfo'])
    assert.equal(events[3][2].value, 7)
    assert.equal(events[3][2].currency, 'CHF')
    assert.match(events[3][3].eventID, /^checkout-pack-2-/)
    assert.deepEqual(events[4][3], { eventID: `order-${orderId}` })
    assert.equal(JSON.stringify(events).includes('Purchase'), false)
    const snapEvents = window.snaptr.queue.map((args) => Array.from(args))
    assert.deepEqual(snapEvents.map((event) => event[1]), ['2b408aa3-8a2d-48aa-b535-5c8dfe935d97', 'PAGE_VIEW', 'VIEW_CONTENT', 'START_CHECKOUT', 'ADD_BILLING'])
    assert.equal(snapEvents[3][2].client_dedup_id, events[3][3].eventID)
    assert.equal(JSON.stringify(snapEvents).includes('PURCHASE'), false)

    // The caller must have server-verified payment before invoking trackPurchase.
    trackPurchase({ transaction_id: orderId, price: 7, currency: 'CHF' })
    trackPurchase({ transaction_id: orderId, price: 7, currency: 'CHF' })
    assert.equal(window.snaptr.queue.filter((event) => event[1] === 'PURCHASE').length, 1)
    assert.equal(window.fbq.queue.some((event) => event[1] === 'Purchase'), false)
    assert.equal(session.has('pixel.start_checkout.pack-2'), true)
    assert.equal(session.has(`pixel.checkout_redirect.${orderId}`), true)
  } finally {
    delete globalThis.window
    delete globalThis.document
    delete globalThis.sessionStorage
    delete globalThis.localStorage
    await vite.close()
  }
})
