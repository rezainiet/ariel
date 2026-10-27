import test from 'node:test'
import assert from 'node:assert/strict'
import { captureTrafficSource, commitMetaClickId, commitSnapClickId, getMetaClickId, getSnapClickId, getTrafficSource } from '../src/lib/trafficSource.js'

test('Meta click ID survives internal navigation for checkout', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
  }
  globalThis.window = { location: { search: '?fbclid=IwAR_sample_123&utm_source=facebook', pathname: '/offer', hostname: 'shop.example.ch' } }
  globalThis.document = { referrer: '' }
  try {
    captureTrafficSource()
    assert.equal(getMetaClickId(), '')
    assert.equal(getTrafficSource().last.fbclid, undefined)
    store.set('consent.marketing.v1', 'granted')
    commitMetaClickId()
    assert.equal(getMetaClickId(), 'IwAR_sample_123')
    assert.equal(getTrafficSource().last.channel, 'meta')
    window.location.search = ''
    window.location.pathname = '/checkout'
    captureTrafficSource()
    assert.equal(getMetaClickId(), 'IwAR_sample_123')
    assert.equal(getTrafficSource().last.fbclid, 'IwAR_sample_123')

    window.location.search = '?gclid=google123'
    captureTrafficSource()
    assert.equal(getMetaClickId(), '')
  } finally {
    delete globalThis.localStorage
    delete globalThis.window
    delete globalThis.document
  }
})

test('Snap click ID waits in the tab until consent, across page reloads, and is erased on refusal', async () => {
  const local = new Map()
  const session = new Map()
  const fake = (m) => ({ getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) })
  globalThis.localStorage = fake(local)
  globalThis.sessionStorage = fake(session)
  globalThis.window = { location: { search: '?ScCid=7d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e6', pathname: '/', hostname: 'shop.example.ch' } }
  globalThis.document = { referrer: '' }
  // A fresh module instance = a new page load (module memory is gone, the tab's session storage is not).
  const page = (n) => import(new URL(`../src/lib/trafficSource.js?page=${n}`, import.meta.url))
  try {
    const landing = await page(1)
    landing.captureTrafficSource()
    assert.equal(landing.getSnapClickId(), '')
    assert.equal(landing.getTrafficSource().last.sccid, undefined)
    window.location.search = ''
    window.location.pathname = '/conditions-generales-de-vente'
    const reloaded = await page(2)
    reloaded.captureTrafficSource()
    window.location.pathname = '/checkout'
    const checkout = await page(3)
    checkout.captureTrafficSource()
    local.set('consent.marketing.v1', 'granted')
    checkout.commitMetaClickId()
    checkout.commitSnapClickId()
    assert.equal(checkout.getSnapClickId(), '7d1e2f3a-4b5c-4d6e-8f70-81a2b3c4d5e6')
    assert.equal(checkout.getMetaClickId(), '')
    assert.equal(session.size, 0)

    // Refusal: the waiting ID is erased and never stored.
    local.clear()
    window.location.search = '?ScCid=snap_refused_1'
    const refused = await page(4)
    refused.captureTrafficSource()
    assert.equal(session.size, 1)
    local.set('consent.marketing.v1', 'denied')
    refused.discardPendingClickIds()
    refused.commitSnapClickId()
    assert.equal(session.size, 0)
    assert.equal(refused.getTrafficSource().last.sccid, undefined)

    // A visitor who already refused: nothing waits in the tab.
    window.location.search = '?ScCid=snap_refused_2'
    const again = await page(5)
    again.captureTrafficSource()
    assert.equal(session.size, 0)
    assert.equal(again.getSnapClickId(), '')
  } finally {
    delete globalThis.localStorage
    delete globalThis.sessionStorage
    delete globalThis.window
    delete globalThis.document
  }
})

test('a reload that repeats the ad platform as referrer keeps the click ID (Snapchat and Meta)', async () => {
  const local = new Map()
  const session = new Map()
  const fake = (m) => ({ getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() })
  const realPerformance = Object.getOwnPropertyDescriptor(globalThis, 'performance')
  const navigation = (type) => Object.defineProperty(globalThis, 'performance', { value: { getEntriesByType: () => [{ type }] }, configurable: true, writable: true })
  globalThis.localStorage = fake(local)
  globalThis.sessionStorage = fake(session)
  const page = (n) => import(new URL(`../src/lib/trafficSource.js?referrer=${n}`, import.meta.url))
  try {
    for (const [ad, referrer, param, getter] of [
      ['snap', 'https://www.snapchat.com/', 'ScCid', 'getSnapClickId'],
      ['meta', 'https://l.facebook.com/', 'fbclid', 'getMetaClickId'],
    ]) {
      for (const consentFirst of [true, false]) {
        local.clear(); session.clear()
        if (consentFirst) local.set('consent.marketing.v1', 'granted')
        const id = `${ad}-${consentFirst}-7d1e2f3a`
        globalThis.document = { referrer }
        globalThis.window = { location: { search: `?${param}=${id}`, pathname: '/', hostname: 'shop.example.ch' } }
        navigation('navigate')
        ;(await page(`${ad}-${consentFirst}-1`)).captureTrafficSource()
        // In-app navigation to /checkout, then the in-app browser reloads it: same referrer, no query.
        window.location.search = ''
        window.location.pathname = '/checkout'
        navigation('reload')
        const reloaded = await page(`${ad}-${consentFirst}-2`)
        reloaded.captureTrafficSource()
        if (!consentFirst) {
          local.set('consent.marketing.v1', 'granted')
          reloaded.commitMetaClickId()
          reloaded.commitSnapClickId()
        }
        assert.equal(reloaded[getter](), id, `${ad} consentFirst=${consentFirst}`)
        // Same referrer again without reload information (another page load in the same visit).
        navigation('navigate')
        const again = await page(`${ad}-${consentFirst}-3`)
        again.captureTrafficSource()
        assert.equal(again[getter](), id)
      }
    }
  } finally {
    if (realPerformance) Object.defineProperty(globalThis, 'performance', realPerformance)
    delete globalThis.localStorage
    delete globalThis.sessionStorage
    delete globalThis.window
    delete globalThis.document
  }
})

test('consent given in another tab is applied on the next page load; an older waiting ID never joins a newer ad visit', async () => {
  const local = new Map()
  const tabA = new Map()
  const tabB = new Map()
  const fake = (m) => ({ getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) })
  globalThis.localStorage = fake(local)
  globalThis.document = { referrer: '' }
  const page = (n) => import(new URL(`../src/lib/trafficSource.js?tabs=${n}`, import.meta.url))
  const inTab = (m) => { globalThis.sessionStorage = fake(m) }
  try {
    // Tab A lands from Snapchat; consent is then accepted in another tab; tab A reloads /checkout.
    inTab(tabA)
    globalThis.window = { location: { search: '?ScCid=snap-tab-a', pathname: '/', hostname: 'shop.example.ch' } }
    ;(await page(1)).captureTrafficSource()
    local.set('consent.marketing.v1', 'granted')
    window.location.search = ''
    window.location.pathname = '/checkout'
    const reloadA = await page(2)
    reloadA.captureTrafficSource()
    assert.equal(reloadA.getSnapClickId(), 'snap-tab-a')
    assert.equal(tabA.size, 0)

    // Tab A waits with ID A; tab B then lands from a newer Snapchat ad (C). Accepting in tab A
    // must not stick A onto visit C; tab B's own C is kept on its next page load.
    local.clear(); tabA.clear(); tabB.clear()
    inTab(tabA)
    window.location.search = '?ScCid=snap-older-a'
    window.location.pathname = '/'
    const a = await page(3)
    a.captureTrafficSource()
    inTab(tabB)
    window.location.search = '?ScCid=snap-newer-c'
    await new Promise((r) => setTimeout(r, 5))
    ;(await page(4)).captureTrafficSource()
    inTab(tabA)
    local.set('consent.marketing.v1', 'granted')
    a.commitSnapClickId()
    assert.equal(a.getSnapClickId(), '')
    inTab(tabB)
    window.location.search = ''
    const b = await page(5)
    b.captureTrafficSource()
    assert.equal(b.getSnapClickId(), 'snap-newer-c')
  } finally {
    delete globalThis.localStorage
    delete globalThis.sessionStorage
    delete globalThis.window
    delete globalThis.document
  }
})

test('Snap click ID survives internal navigation only after marketing consent', () => {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
  }
  globalThis.window = { location: { search: '?ScCid=snap_test_123&utm_source=snapchat', pathname: '/', hostname: 'shop.example.ch' } }
  globalThis.document = { referrer: '' }
  try {
    captureTrafficSource()
    assert.equal(getSnapClickId(), '')
    assert.equal(getTrafficSource().last.sccid, undefined)
    store.set('consent.marketing.v1', 'granted')
    commitSnapClickId()
    assert.equal(getSnapClickId(), 'snap_test_123')
    assert.equal(getMetaClickId(), '')
    window.location.search = ''
    window.location.pathname = '/checkout'
    captureTrafficSource()
    assert.equal(getSnapClickId(), 'snap_test_123')
    window.location.search = '?fbclid=meta_test_456'
    captureTrafficSource()
    assert.equal(getSnapClickId(), '')
    assert.equal(getMetaClickId(), 'meta_test_456')
  } finally {
    delete globalThis.localStorage
    delete globalThis.window
    delete globalThis.document
  }
})
