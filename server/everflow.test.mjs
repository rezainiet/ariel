import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TRACKING_LINKS, IMAGE_PATHS, settings, createPendingOrder, prepareCheckout, usesApprovedEverflowLinks, buildEverflowUrl } from './everflow.mjs'
import { getOffer } from '../src/config/offers.js'

test('offer prices and approved checkout destinations match the three campaigns', () => {
  assert.deepEqual(Object.fromEntries(Object.keys(TRACKING_LINKS).map((id) => [id, { price: getOffer(id).price, url: TRACKING_LINKS[id] }])), {
    'pack-1': { price: 4, url: 'https://www.molipy8trk.com/2J23GL9/WMD7FHG/' },
    'pack-2': { price: 7, url: 'https://www.molipy8trk.com/2J23GL9/WMJD3P9/' },
    'pack-3': { price: 10, url: 'https://www.molipy8trk.com/2J23GL9/WMKQZFW/' },
  })
  assert.ok(Object.values(TRACKING_LINKS).every((link) => !new URL(link).searchParams.has('sub5')))
})

test('live admin redirect configuration resolves to the approved links', () => {
  const redirect = {
    enabled: true, domain: 'www.molipy8trk.com', pathTemplate: '/2J23GL9/{code}/',
    packages: { 'pack-1': { code: 'WMD7FHG' }, 'pack-2': { code: 'WMJD3P9' }, 'pack-3': { code: 'WMKQZFW' } },
  }
  assert.equal(usesApprovedEverflowLinks(redirect), true)
  assert.equal(usesApprovedEverflowLinks({ ...redirect, packages: { ...redirect.packages, 'pack-2': { code: 'WRONG' } } }), false)
  const url = new URL(buildEverflowUrl('pack-2', { prenom: 'Ana', nom: 'Test', npa: '1201', email: 'ana@example.ch', ville: 'Genève', adresse: 'Rue Test 1', tel: '079 123 45 67' }, 'https://shop.example.ch/images/everflow/pack-2.png', 'IwAR_sample_123'))
  assert.equal(url.searchParams.has('sub5'), false)
  assert.equal(url.searchParams.get('sub1'), 'IwAR_sample_123')
  assert.equal(url.searchParams.get('fbclid'), 'IwAR_sample_123')
  assert.equal(url.searchParams.get('sub4'), 'ana@example.ch')
})

const images = {
  'pack-1': 'https://assets.example.ch/ariel/one.webp',
  'pack-2': 'https://assets.example.ch/ariel/two.webp',
  'pack-3': 'https://assets.example.ch/ariel/three.webp',
}
const config = { enabled: true, images, metaPixel: '815653229569193', snapPixel: '2b408aa3-8a2d-48aa-b535-5c8dfe935d97' }
const customer = {
  prenom: 'Ana María', nom: "D’Été", email: 'Ana.Maria@Example.ch',
  tel: '+41 (79) 123-45-67', adresse: "Rue de l'Église, 4/B", complement: 'Bât. A, étage 2',
  npa: '1201', ville: 'Genève',
}
const request = (offerId, consent = false, who = customer) => ({
  offerId, customer: who, termsAccepted: true, marketingConsent: consent,
  fbclid: 'IwAR123_test_ClickId',
  sccid: 'snap_test_ClickId',
  idempotencyKey: crypto.randomUUID(),
})

test('three offers preserve destination, query, prefill, images and consent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-everflow-'))
  try {
    for (const [offerId, tracking] of Object.entries(TRACKING_LINKS)) {
      for (const consent of [false, true]) {
        // Each checkout uses a distinct customer; one customer is limited to one order for 48 h.
        const who = { ...customer, email: `${offerId}-${consent ? 'yes' : 'no'}@example.ch`, tel: consent ? '079 765 43 21' : customer.tel }
        const result = await createPendingOrder(request(offerId, consent, who), config, dir)
        assert.equal(result.status, 200)
        assert.equal(result.statusText, 'pending')
        const url = new URL(result.redirectUrl)
        const original = new URL(tracking)
        assert.equal(url.origin + url.pathname, original.origin + original.pathname)
        for (const [key, value] of original.searchParams) assert.equal(url.searchParams.get(key), value)
        assert.deepEqual(Object.fromEntries(['sub10', 'adv3', 'sub3', 'sub4', 'sub6', 'sub7', 'sub8'].map((k) => [k, url.searchParams.get(k)])), {
          sub10: 'Ana María', adv3: 'D’Été', sub3: '1201', sub4: who.email,
          sub6: 'Genève', sub7: "Rue de l'Église, 4/B, Bât. A, étage 2", sub8: consent ? '+41797654321' : '+41791234567',
        })
        assert.equal(url.searchParams.get('adv2'), images[offerId])
        assert.match(url.searchParams.get('adv1'), new RegExp(`${{ 'pack-1': 1, 'pack-2': 2, 'pack-3': 3 }[offerId]} sachet`))
        assert.equal(url.searchParams.has('sub5'), false)
        assert.equal(url.searchParams.get('sub1'), consent ? 'IwAR123_test_ClickId' : null)
        assert.equal(url.searchParams.get('fbclid'), consent ? 'IwAR123_test_ClickId' : null)
        assert.equal(url.searchParams.get('ScCid'), consent ? 'snap_test_ClickId' : null)
      }
    }
    const files = await readdir(join(dir, 'everflow-orders'))
    assert.equal(files.length, 6)
    for (const file of files) assert.equal(JSON.parse(await readFile(join(dir, 'everflow-orders', file))).status, 'pending')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('unsupported carts, absent phone, and unapproved configuration stay blocked', () => {
  assert.equal(prepareCheckout(request('pack-9'), config).status, 422)
  assert.equal(prepareCheckout({ ...request('pack-1'), cart: [{ offerId: 'pack-1' }] }, config).error, 'unsupported_cart')
  assert.equal(prepareCheckout({ ...request('pack-2'), packs: 3 }, config).error, 'unsupported_cart')
  assert.equal(prepareCheckout({ ...request('pack-3'), total: 0.01 }, config).error, 'unsupported_cart')
  assert.equal(prepareCheckout({ ...request('pack-1'), customer: { ...customer, tel: '' } }, config).status, 422)
  assert.equal(prepareCheckout(request('pack-1'), { ...config, enabled: false }).status, 409)
  assert.equal(settings({ EVERFLOW_ENABLED: 'true' }).enabled, false)
  const live = settings({ EVERFLOW_ENABLED: 'true', EVERFLOW_IMAGES_APPROVED: 'true', PUBLIC_ORIGIN: 'https://shop.example.ch' })
  assert.equal(live.enabled, true)
  for (const [offerId, path] of Object.entries(IMAGE_PATHS)) assert.equal(live.images[offerId], `https://shop.example.ch${path}`)
  assert.equal(settings({ EVERFLOW_ENABLED: 'true', EVERFLOW_IMAGES_APPROVED: 'true', PUBLIC_ORIGIN: 'http://localhost:8787' }).enabled, false)
  const previewEnv = { EVERFLOW_LOCAL_PREVIEW: 'true', NODE_ENV: 'development' }
  assert.equal(settings(previewEnv).enabled, false)
  const preview = settings(previewEnv, true)
  assert.equal(preview.enabled, true)
  assert.equal(preview.preview, true)
  assert.equal(preview.images['pack-2'], 'http://localhost:5173/images/everflow/pack-2.png')
  assert.equal(settings({ EVERFLOW_LOCAL_PREVIEW: 'true' }, true).enabled, false)
  assert.equal(settings({ ...previewEnv, NODE_ENV: 'production' }, true).enabled, false)
  assert.equal(prepareCheckout(request('pack-1', true), { ...config, snapPixel: '' }).fbclid, 'IwAR123_test_ClickId')
  assert.equal(prepareCheckout(request('pack-1', false), { ...config, snapPixel: '' }).fbclid, '')
  assert.equal(prepareCheckout({ ...request('pack-1', true), fbclid: 'bad&injection' }, config).fbclid, '')
  assert.equal(prepareCheckout({ ...request('pack-1', true), sccid: 'bad&injection' }, config).sccid, '')
  assert.equal(settings({}).metaPixel, '815653229569193')
  assert.equal(settings({}).snapPixel, '2b408aa3-8a2d-48aa-b535-5c8dfe935d97')
})

test('retry reuses pending order and changed payload conflicts', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-everflow-'))
  try {
    const body = request('pack-2')
    const [first, second] = await Promise.all([createPendingOrder(body, config, dir), createPendingOrder(body, config, dir)])
    assert.equal(first.orderId, second.orderId)
    assert.equal(first.redirectUrl, second.redirectUrl)
    const conflict = await createPendingOrder({ ...body, offerId: 'pack-3' }, config, dir)
    assert.equal(conflict.status, 409)
    assert.equal(conflict.error, 'idempotency_conflict')
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('Pixel IDs and declined consent never add sub5 or click attribution', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-everflow-meta-'))
  try {
    const metaOnly = { ...config, metaPixel: '815653229569193', snapPixel: '' }
    const accepted = await createPendingOrder(request('pack-2', true), metaOnly, dir)
    const declined = await createPendingOrder(request('pack-2', false, { ...customer, email: 'another@example.ch' }), metaOnly, dir)
    const acceptedUrl = new URL(accepted.redirectUrl)
    const declinedUrl = new URL(declined.redirectUrl)
    assert.equal(acceptedUrl.searchParams.has('sub5'), false)
    assert.equal(declinedUrl.searchParams.has('sub5'), false)
    assert.equal(acceptedUrl.searchParams.get('sub1'), 'IwAR123_test_ClickId')
    assert.equal(acceptedUrl.searchParams.get('fbclid'), 'IwAR123_test_ClickId')
    assert.equal(declinedUrl.searchParams.has('sub1'), false)
    assert.equal(declinedUrl.searchParams.has('fbclid'), false)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
