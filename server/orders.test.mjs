import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createPendingOrder, closePendingOrder } from './everflow.mjs'
import { recordOrder, listOrders, publicOrderStatus, closeExternalOrder } from './orders.mjs'
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

test('a repeat checkout is blocked until 48 hours after the first order, even if its hold expires', () => withDir(async (dir) => {
  await setStock(dir, { onHand: 2, version: (await loadStock(dir)).version })
  const first = await createPendingOrder(click(), config, dir)
  const stock = await loadStock(dir)
  stock.reservations[0].expiresAt = new Date(Date.now() - 1000).toISOString()
  await writeFile(join(dir, 'stock.json'), JSON.stringify(stock))

  const again = await createPendingOrder(click(), config, dir)
  assert.equal(again.status, 409)
  assert.equal(again.error, 'recent_order')
  assert.equal(again.orderId, first.orderId)
  assert.equal((await files(dir)).length, 1)
}))

test('the same customer cannot create a second order for another offer or after cancellation within 48 hours', () => withDir(async (dir) => {
  const a = click('pack-1')
  const first = await createPendingOrder(a, config, dir)
  const anotherOffer = await createPendingOrder(click('pack-3'), config, dir)
  assert.equal(anotherOffer.orderId, first.orderId)
  assert.equal(anotherOffer.duplicate, true)
  assert.equal(new URL(anotherOffer.redirectUrl).pathname, '/2J23GL9/WMD7FHG/')
  await createPendingOrder(click('pack-1', { ...customer, email: 'marc@example.ch' }), config, dir)
  assert.equal((await files(dir)).length, 2)
  await closePendingOrder(dir, a.idempotencyKey, 'cancelled')
  const reorder = await createPendingOrder(click('pack-1'), config, dir)
  assert.equal(reorder.status, 409)
  assert.equal(reorder.error, 'recent_order')
  assert.equal((await files(dir)).length, 2)
}))

test('a new order with the same customer is allowed after 48 hours', () => withDir(async (dir) => {
  const firstBody = click('pack-1')
  const first = await createPendingOrder(firstBody, config, dir)
  const orderFile = join(dir, 'everflow-orders', `${firstBody.idempotencyKey}.json`)
  const record = JSON.parse(await readFile(orderFile, 'utf8'))
  record.createdAt = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString()
  await writeFile(orderFile, JSON.stringify(record))
  const dedupFile = join(dir, 'order-dedup', (await readdir(join(dir, 'order-dedup')))[0])
  const claim = JSON.parse(await readFile(dedupFile, 'utf8'))
  claim.at = record.createdAt
  await writeFile(dedupFile, JSON.stringify(claim))
  const second = await createPendingOrder(click('pack-1'), config, dir)
  assert.equal(second.status, 200)
  assert.notEqual(second.orderId, first.orderId)
  assert.equal((await files(dir)).length, 2)
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

test('concurrent external checkout attempts for different offers keep one customer order', () => withDir(async (dir) => {
  const one = { offerId: 'pack-1', packs: 1, total: 4, currency: 'CHF', customer }
  const three = { offerId: 'pack-3', packs: 3, total: 10, currency: 'CHF', customer }
  const results = await Promise.all([one, three, one].map((order) => recordOrder(dir, {
    key: crypto.randomUUID(), provider: 'external', order, source: touch('meta'),
  })))
  assert.ok(results.every((result) => result.orderId === results[0].orderId))
  assert.equal(results.filter((result) => result.duplicate === false).length, 1)
  assert.equal((await files(dir)).length, 1)
  assert.equal((await listOrders(dir)).total, 1)
}))

test('external checkout blocks a second order for 48 hours and then allows a new one', () => withDir(async (dir) => {
  const order = { offerId: 'pack-2', packs: 2, total: 7, currency: 'CHF', customer }
  const key = crypto.randomUUID()
  const first = await recordOrder(dir, { key, provider: 'external', order, source: touch('meta') })
  const sameKeyConflict = await recordOrder(dir, { key, provider: 'external', order: { ...order, total: 10 }, source: touch('meta') })
  assert.equal(sameKeyConflict.error, 'idempotency_conflict')
  await closeExternalOrder(dir, first.orderId, 'cancelled')
  const blocked = await recordOrder(dir, { key: crypto.randomUUID(), provider: 'external', order, source: touch('meta') })
  assert.equal(blocked.error, 'recent_order')
  assert.equal(blocked.orderId, first.orderId)
  const orderFile = join(dir, 'everflow-orders', `${key}.json`)
  const record = JSON.parse(await readFile(orderFile, 'utf8'))
  record.createdAt = new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString()
  await writeFile(orderFile, JSON.stringify(record))
  const dedupFile = join(dir, 'order-dedup', (await readdir(join(dir, 'order-dedup')))[0])
  const claim = JSON.parse(await readFile(dedupFile, 'utf8'))
  claim.at = record.createdAt
  await writeFile(dedupFile, JSON.stringify(claim))
  const newOrder = await recordOrder(dir, { key: crypto.randomUUID(), provider: 'external', order, source: touch('meta') })
  assert.equal(newOrder.duplicate, false)
  assert.notEqual(newOrder.orderId, first.orderId)
}))

test('public order status exposes processing and confirmation without customer data', () => withDir(async (dir) => {
  const body = click('pack-1')
  const created = await createPendingOrder(body, config, dir)
  const pending = await publicOrderStatus(dir, created.orderId)
  assert.deepEqual(Object.keys(pending).sort(), ['createdAt', 'currency', 'offerId', 'orderId', 'packs', 'status', 'total'])
  assert.equal(pending.status, 'processing')
  assert.equal(pending.total, 4)
  assert.equal(await publicOrderStatus(dir, crypto.randomUUID()), null)
  await closePendingOrder(dir, body.idempotencyKey, 'confirmed')
  assert.equal((await publicOrderStatus(dir, created.orderId)).status, 'confirmed')
}))

test('external order status changes only after an explicit admin action', () => withDir(async (dir) => {
  const order = { offerId: 'pack-2', packs: 2, total: 7, currency: 'CHF', customer }
  const created = await recordOrder(dir, { key: crypto.randomUUID(), provider: 'external', order, source: touch('direct') })
  assert.equal((await publicOrderStatus(dir, created.orderId)).status, 'processing')
  assert.equal(await closeExternalOrder(dir, created.orderId, 'confirmed'), true)
  assert.equal((await publicOrderStatus(dir, created.orderId)).status, 'confirmed')
  assert.equal(await closeExternalOrder(dir, created.orderId, 'cancelled'), false)
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
