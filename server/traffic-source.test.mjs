import test from 'node:test'
import assert from 'node:assert/strict'
import { captureTrafficSource, commitMetaClickId, getMetaClickId, getTrafficSource } from '../src/lib/trafficSource.js'

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
