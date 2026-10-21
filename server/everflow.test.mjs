import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TRACKING_LINKS, IMAGE_PATHS, settings, createPendingOrder, prepareCheckout } from './everflow.mjs'

const images = {
  'pack-1': 'https://assets.example.ch/ariel/one.webp',
  'pack-2': 'https://assets.example.ch/ariel/two.webp',
  'pack-3': 'https://assets.example.ch/ariel/three.webp',
}
const config = { enabled: true, images, metaPixel: '123456789', snapPixel: '987654321' }
const customer = {
  prenom: 'Ana María', nom: "D’Été", email: 'Ana.Maria@Example.ch',
  tel: '+41 (79) 123-45-67', adresse: "Rue de l'Église, 4/B", complement: 'Bât. A, étage 2',
  npa: '1201', ville: 'Genève',
}
const request = (offerId, consent = false, who = customer) => ({
  offerId, customer: who, termsAccepted: true, marketingConsent: consent,
  idempotencyKey: crypto.randomUUID(),
})

test('three offers preserve destination, query, prefill, images and consent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-everflow-'))
  try {
    for (const [offerId, tracking] of Object.entries(TRACKING_LINKS)) {
      for (const consent of [false, true]) {
        // A second customer for the consent run: the same customer + offer would be merged (server/orders.mjs).
        const who = consent ? { ...customer, tel: '079 765 43 21' } : customer
        const result = await createPendingOrder(request(offerId, consent, who), config, dir)
        assert.equal(result.status, 200)
        assert.equal(result.statusText, 'pending')
        const url = new URL(result.redirectUrl)
        const original = new URL(tracking)
        assert.equal(url.origin + url.pathname, original.origin + original.pathname)
        for (const [key, value] of original.searchParams) assert.equal(url.searchParams.get(key), value)
        assert.deepEqual(Object.fromEntries(['sub10', 'adv3', 'sub3', 'sub4', 'sub6', 'sub7', 'sub8'].map((k) => [k, url.searchParams.get(k)])), {
          sub10: 'Ana María', adv3: 'D’Été', sub3: '1201', sub4: 'ana.maria@example.ch',
          sub6: 'Genève', sub7: "Rue de l'Église, 4/B, Bât. A, étage 2", sub8: consent ? '+41797654321' : '+41791234567',
        })
        assert.equal(url.searchParams.get('adv2'), images[offerId])
        assert.match(url.searchParams.get('adv1'), new RegExp(`${{ 'pack-1': 1, 'pack-2': 2, 'pack-3': 3 }[offerId]} sachet`))
        assert.equal(url.searchParams.get('sub5'), consent ? `123456789${'_'.repeat(21)}987654321` : null)
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
  assert.equal(prepareCheckout(request('pack-1', true), { ...config, snapPixel: '' }).attribution, '123456789')
  assert.equal(prepareCheckout(request('pack-1', false), { ...config, snapPixel: '' }).attribution, '')
  assert.equal(settings({}).metaPixel, '815653229569193')
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

test('Meta-only attribution is present only after marketing consent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-everflow-meta-'))
  try {
    const metaOnly = { ...config, metaPixel: '815653229569193', snapPixel: '' }
    const accepted = await createPendingOrder(request('pack-2', true), metaOnly, dir)
    const declined = await createPendingOrder(request('pack-2', false), metaOnly, dir)
    assert.equal(new URL(accepted.redirectUrl).searchParams.get('sub5'), '815653229569193')
    assert.equal(new URL(declined.redirectUrl).searchParams.has('sub5'), false)
  } finally { await rm(dir, { recursive: true, force: true }) }
})
