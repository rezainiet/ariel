import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPendingOrder, closePendingOrder } from './everflow.mjs'
import { recordOrder, listOrders } from './orders.mjs'
import { loadStock, setStock, stockSummary } from './stock.mjs'
import { classify, sanitizeSource } from '../src/lib/trafficSource.js'

const config = { enabled: true, images: { 'pack-1': 'https://a.example.ch/1.webp', 'pack-2': 'https://a.example.ch/2.webp', 'pack-3': 'https://a.example.ch/3.webp' }, metaPixel: '', snapPixel: '' }
const customer = { prenom: 'Léa', nom: 'Muller', email: 'lea@example.ch', tel: '079 123 45 67', adresse: 'Rue du Lac 4', npa: '1003', ville: 'Lausanne' }
const touch = (channel, extra = {}) => ({ last: { channel, utmSource: '', utmMedium: '', utmCampaign: '', clickIdType: '', referrerHost: '', landingPath: '/', at: new Date().toISOString(), ...extra } })
const click = (offerId = 'pack-2', who = customer, source = touch('meta')) => ({
  offerId, customer: who, termsAccepted: true, idempotencyKey: crypto.randomUUID(), source,
})
const withDir = async (fn) => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-orders-'))
  try { await fn(dir) } finally { await rm(dir, { recursive: true, force: true }) }
}
const files = async (dir) => (await readdir(join(dir, 'everflow-orders'))).filter((f) => f.endsWith('.json'))

test('the same customer and offer from a new tab is merged into one order with the latest details', () => withDir(async (dir) => {
  await setStock(dir, { onHand: 10, version: (await loadStock(dir)).version })
  const first = await createPendingOrder(click(), config, dir)
  const again = await createPendingOrder(click('pack-2', { ...customer, tel: '+41 79 123 45 67', adresse: 'Rue du Lac 6' }, touch('snapchat')), config, dir)
  assert.equal(again.status, 200)
  assert.equal(again.duplicate, true)
  assert.equal(again.orderId, first.orderId)
  assert.equal(new URL(again.redirectUrl).searchParams.get('sub7'), 'Rue du Lac 6')
  assert.equal((await files(dir)).length, 1)
  const summary = stockSummary(await loadStock(dir))
  assert.equal(summary.held, 2) // one hold of 2 sachets, not two
  const { total, orders } = await listOrders(dir)
  assert.equal(total, 1)
  assert.equal(orders[0].clicks, 2)
  assert.equal(orders[0].channel, 'snapchat') // latest ad click wins
}))

test('concurrent clicks from two tabs create a single order', () => withDir(async (dir) => {
  const results = await Promise.all(Array.from({ length: 4 }, () => createPendingOrder(click(), config, dir)))
  assert.ok(results.every((r) => r.status === 200 && r.orderId === results[0].orderId))
  assert.equal((await files(dir)).length, 1)
}))

test('a repeat checkout after its stock hold expires creates a new reserved order', () => withDir(async (dir) => {
  await setStock(dir, { onHand: 2, version: (await loadStock(dir)).version })
  const first = await createPendingOrder(click(), config, dir)
  const stock = await loadStock(dir)
  stock.reservations[0].expiresAt = new Date(Date.now() - 1000).toISOString()
  await writeFile(join(dir, 'stock.json'), JSON.stringify(stock))

  const again = await createPendingOrder(click(), config, dir)
  assert.equal(again.status, 200)
  assert.notEqual(again.orderId, first.orderId)
  assert.equal((await files(dir)).length, 2)
  assert.equal(stockSummary(await loadStock(dir)).held, 2)
}))

test('another offer or another customer is a separate order; a closed order is never reused', () => withDir(async (dir) => {
  const a = click('pack-1')
  await createPendingOrder(a, config, dir)
  await createPendingOrder(click('pack-3'), config, dir)
  await createPendingOrder(click('pack-1', { ...customer, email: 'marc@example.ch' }), config, dir)
  assert.equal((await files(dir)).length, 3)
  await closePendingOrder(dir, a.idempotencyKey, 'cancelled')
  const reorder = await createPendingOrder(click('pack-1'), config, dir)
  assert.equal(reorder.duplicate, undefined)
  assert.equal((await files(dir)).length, 4)
}))

test('external redirect clicks are recorded and deduplicated too', () => withDir(async (dir) => {
  const order = { offerId: 'pack-2', packs: 2, total: 7, currency: 'CHF', customer }
  const one = await recordOrder(dir, { key: crypto.randomUUID(), provider: 'external', order, source: touch('google') })
  const two = await recordOrder(dir, { key: crypto.randomUUID(), provider: 'external', order, source: touch('google') })
  assert.equal(two.orderId, one.orderId)
  assert.equal(two.duplicate, true)
  const list = await listOrders(dir)
  assert.equal(list.total, 1)
  assert.equal(list.orders[0].provider, 'external')
  assert.equal(list.byChannel.google, 1)
}))

test('orders are counted per channel and in total', () => withDir(async (dir) => {
  const people = ['a', 'b', 'c', 'd', 'e', 'f']
  const channels = ['meta', 'meta', 'snapchat', 'google', 'other', 'direct']
  for (const [k, p] of people.entries()) {
    await createPendingOrder(click('pack-1', { ...customer, email: `${p}@example.ch` }, touch(channels[k])), config, dir)
  }
  await createPendingOrder(click('pack-1', { ...customer, email: 'g@example.ch' }, { last: { channel: 'evil<script>' } }), config, dir)
  const { total, byChannel } = await listOrders(dir)
  assert.equal(total, 7)
  assert.deepEqual(byChannel, { meta: 2, snapchat: 1, google: 1, other: 1, direct: 2 })
}))

test('arrivals are classified from click IDs, UTM source and referrer', () => {
  const c = (q, ref = '', host = 'shop.example.ch') => classify(new URLSearchParams(q), ref, host).channel
  assert.equal(c('fbclid=IwAR123'), 'meta')
  assert.equal(c('utm_source=ig&utm_medium=paid'), 'meta')
  assert.equal(c('ScCid=abc-123'), 'snapchat')
  assert.equal(c('utm_source=snapchat'), 'snapchat')
  assert.equal(c('gclid=Cj0KCQ'), 'google')
  assert.equal(c('gbraid=0AAAA'), 'google')
  assert.equal(c('', 'https://www.google.ch/'), 'google')
  assert.equal(c('', 'https://l.facebook.com/l.php'), 'meta')
  assert.equal(c('utm_source=newsletter'), 'other')
  assert.equal(c('', 'https://shop.example.ch/checkout'), 'direct')
  assert.equal(c(''), 'direct')
  const kept = classify(new URLSearchParams('fbclid=IwAR123'), '', '')
  assert.equal(kept.clickIdType, 'fbclid')
  assert.equal(JSON.stringify(kept).includes('IwAR123'), false) // click ID values are never stored
  assert.equal(sanitizeSource({ last: { channel: 'tiktok' } }).channel, 'direct')
  assert.equal(sanitizeSource({ last: { channel: 'meta', utmCampaign: '<b>promo</b>' } }).last.utmCampaign, 'bpromo/b')
})
