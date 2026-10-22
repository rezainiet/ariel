import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

test('Meta Purchase fires only for a new pending order, once per browser for 48 hours', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' })
  const { initPixel, trackMetaPendingOrder, trackCheckoutRedirect, trackPurchase } = await vite.ssrLoadModule('/src/lib/pixel.js')
  const session = new Map()
  const local = new Map()
  const scripts = []
  let cookie = ''
  globalThis.sessionStorage = {
    getItem: (key) => session.get(key) || null,
    setItem: (key, value) => session.set(key, value),
  }
  globalThis.localStorage = {
    getItem: (key) => local.get(key) || null,
    setItem: (key, value) => local.set(key, value),
  }
  globalThis.window = {}
  globalThis.document = {
    get cookie() { return cookie },
    set cookie(value) { cookie = value.split(';')[0] },
    createElement: () => ({}),
    head: { appendChild: (script) => scripts.push(script) },
  }
  try {
    const first = '7f61d399-876b-4a22-af13-c0cb9ca5875c'
    const second = '423e7114-e518-4180-ab15-f1e45092301b'
    const third = '022f3f26-bbec-42e1-8e30-b2db71f5f9c9'
    assert.equal(trackMetaPendingOrder(first, 'pack-2'), false) // no consent/initialization
    assert.equal(trackCheckoutRedirect(first, 'pack-2'), false)
    assert.equal(scripts.length, 0)
    initPixel() // called only after marketing consent
    assert.equal(scripts[0].src, 'https://connect.facebook.net/en_US/fbevents.js')
    assert.equal(trackMetaPendingOrder(first, 'pack-2', true), false) // server duplicate
    assert.equal(trackMetaPendingOrder(first, 'pack-2'), true)
    assert.equal(trackMetaPendingOrder(first, 'pack-2'), false)
    assert.equal(trackMetaPendingOrder(second, 'pack-2'), false) // different order, same browser and 48 h
    assert.equal(trackCheckoutRedirect(first, 'pack-2'), true)
    assert.equal(trackCheckoutRedirect(first, 'pack-2'), false)
    assert.equal(trackMetaPendingOrder('not-an-order', 'pack-9'), false)
    trackPurchase({ transaction_id: first, price: 7, currency: 'CHF', customer: { email: 'private@example.ch' } })
    const old = String(Date.now() - 49 * 60 * 60 * 1000)
    cookie = `ariel_meta_purchase_v1=${old}.${first}`
    local.set('ariel_meta_purchase_v1', old)
    assert.equal(trackMetaPendingOrder(third, 'pack-2'), true)
    const events = window.fbq.queue.map((args) => Array.from(args))
    assert.deepEqual(events.map((event) => event[1]), ['815653229569193', 'Purchase', 'AddPaymentInfo', 'Purchase'])
    assert.deepEqual(events[1][2], {
      currency: 'CHF', value: 7, content_ids: ['ariel-all-in-1-pods'], content_type: 'product', num_items: 2,
    })
    assert.deepEqual(events[1][3], { eventID: `pending-order-${first}` })
    assert.deepEqual(events[2][3], { eventID: `order-${first}` })
    assert.equal(window._fbq, window.fbq)
    assert.equal(JSON.stringify(events).includes('private@example.ch'), false)
    assert.equal(session.has(`pixel.checkout_redirect.${first}`), true)
    assert.equal(session.has(`pixel.meta_purchase.${first}`), true)
  } finally {
    delete globalThis.window
    delete globalThis.document
    delete globalThis.sessionStorage
    delete globalThis.localStorage
    await vite.close()
  }
})
