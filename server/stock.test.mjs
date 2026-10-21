import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadStock, publicStock, stockSummary, reserve, setStock, adjustStock, commitReservation, cancelReservation, checkAvailable } from './stock.mjs'
import { createPendingOrder, readPendingOrder, closePendingOrder } from './everflow.mjs'

const config = { enabled: true, images: { 'pack-1': 'https://a.example.ch/1.webp', 'pack-2': 'https://a.example.ch/2.webp', 'pack-3': 'https://a.example.ch/3.webp' }, metaPixel: '', snapPixel: '' }
const customer = { prenom: 'Léa', nom: 'Muller', email: 'lea@example.ch', tel: '079 123 45 67', adresse: 'Rue du Lac 4', npa: '1003', ville: 'Lausanne' }
// Each call is a different customer: the same customer + offer would be merged into one order (server/orders.mjs).
let n = 0
const order = (offerId) => ({ offerId, customer: { ...customer, email: `lea+${++n}@example.ch` }, termsAccepted: true, idempotencyKey: crypto.randomUUID() })
const withDir = async (fn) => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-stock-'))
  try { await fn(dir) } finally { await rm(dir, { recursive: true, force: true }) }
}
const setQty = async (dir, onHand) => setStock(dir, { onHand, version: (await loadStock(dir)).version })

test('unknown stock stays unset and limits nothing', () => withDir(async (dir) => {
  const state = await loadStock(dir)
  assert.equal(state.onHand, null)
  assert.deepEqual(publicStock(state), { tracked: false, offers: { 'pack-1': { available: true }, 'pack-2': { available: true }, 'pack-3': { available: true } } })
  const result = await createPendingOrder(order('pack-3'), config, dir)
  assert.equal(result.status, 200)
  assert.equal((await loadStock(dir)).onHand, null)
}))

test('quantities must be nonnegative integers and a stale version is refused', () => withDir(async (dir) => {
  for (const onHand of [-1, 1.5, 'abc', '', '5', true, undefined, 2_000_000]) {
    const r = await setStock(dir, { onHand, version: 0 })
    assert.equal(r.ok, false, `refuse ${onHand}`)
    assert.ok(r.errors.onHand)
  }
  assert.equal((await setStock(dir, { onHand: 5 })).errors.version !== undefined, true)
  assert.equal((await setStock(dir, { onHand: 5, version: 0, holdMinutes: 2 })).errors.holdMinutes !== undefined, true)
  assert.equal((await setStock(dir, { onHand: 5, version: 0 })).ok, true)
  const stale = await setStock(dir, { onHand: 9, version: 0 })
  assert.equal(stale.error, 'conflict')
  assert.equal((await loadStock(dir)).onHand, 5)
  assert.equal((await setStock(dir, { onHand: 0, version: (await loadStock(dir)).version })).ok, true)
}))

test('concurrent orders never hold more sachets than are in stock', () => withDir(async (dir) => {
  await setQty(dir, 5)
  const results = await Promise.all(Array.from({ length: 6 }, () => createPendingOrder(order('pack-2'), config, dir)))
  assert.equal(results.filter((r) => r.status === 200).length, 2)
  assert.ok(results.filter((r) => r.status !== 200).every((r) => r.status === 409 && r.error === 'out_of_stock'))
  assert.equal((await readdir(join(dir, 'everflow-orders'))).length, 2)
  const summary = stockSummary(await loadStock(dir))
  assert.equal(summary.onHand, 5) // a redirect is not a payment: nothing is deducted yet
  assert.equal(summary.held, 4)
  assert.equal(summary.available, 1)
  assert.deepEqual(summary.offers.map((o) => o.available), [true, false, false])
  assert.equal(await checkAvailable(dir, 'pack-1'), true)
  assert.equal(await checkAvailable(dir, 'pack-2'), false)
}))

test('a retry with the same key does not hold the stock twice', () => withDir(async (dir) => {
  await setQty(dir, 2)
  const body = order('pack-2')
  const [a, b] = await Promise.all([createPendingOrder(body, config, dir), createPendingOrder(body, config, dir)])
  assert.equal(a.status, 200)
  assert.equal(b.orderId, a.orderId)
  const summary = stockSummary(await loadStock(dir))
  assert.equal(summary.held, 2)
  assert.equal(summary.reservations.length, 1)
  assert.equal(summary.reservations[0].orderId, a.orderId)
}))

test('an unpaid hold expires and frees the stock', () => withDir(async (dir) => {
  await setQty(dir, 3)
  const t0 = Date.parse('2026-10-20T10:00:00Z')
  const key = crypto.randomUUID()
  assert.equal((await reserve(dir, { key, offerId: 'pack-3', now: t0 })).ok, true)
  assert.equal((await reserve(dir, { key: crypto.randomUUID(), offerId: 'pack-1', now: t0 + 60_000 })).error, 'out_of_stock')
  const later = t0 + 31 * 60_000
  assert.equal(stockSummary(await loadStock(dir), later).available, 3)
  assert.equal(stockSummary(await loadStock(dir), later).reservations[0].active, false)
  // A late payment can still be confirmed while the sachets are free…
  const other = crypto.randomUUID()
  assert.equal((await reserve(dir, { key: other, offerId: 'pack-1', now: later })).ok, true)
  assert.equal((await commitReservation(dir, key, later)).error, 'insufficient_stock')
  assert.equal((await cancelReservation(dir, other, later)).ok, true)
  // …and only then deducted.
  const done = await commitReservation(dir, key, later)
  assert.equal(done.ok, true)
  assert.equal(done.stock.onHand, 0)
}))

test('admin confirmation deducts permanently; cancellation releases and closes the order', () => withDir(async (dir) => {
  await setQty(dir, 4)
  const paid = order('pack-1')
  const dropped = order('pack-3')
  assert.equal((await createPendingOrder(paid, config, dir)).status, 200)
  assert.equal((await createPendingOrder(dropped, config, dir)).status, 200)
  assert.equal(stockSummary(await loadStock(dir)).available, 0)

  const confirmed = await commitReservation(dir, paid.idempotencyKey)
  assert.equal(confirmed.stock.onHand, 3)
  await closePendingOrder(dir, paid.idempotencyKey, 'confirmed')
  assert.equal((await readPendingOrder(dir, paid.idempotencyKey)).status, 'confirmed')
  assert.equal((await commitReservation(dir, paid.idempotencyKey)).error, 'already_closed')

  assert.equal((await cancelReservation(dir, dropped.idempotencyKey)).ok, true)
  await closePendingOrder(dir, dropped.idempotencyKey, 'cancelled')
  const summary = stockSummary(await loadStock(dir))
  assert.equal(summary.onHand, 3)
  assert.equal(summary.available, 3)
  assert.deepEqual(summary.movements.map((m) => m.type).slice(0, 4), ['release', 'commit', 'hold', 'hold'])
  // The customer's retry of a closed order is refused instead of re-holding stock.
  assert.equal((await createPendingOrder(dropped, config, dir)).error, 'order_closed')
  const record = JSON.parse(await readFile(join(dir, 'everflow-orders', `${dropped.idempotencyKey}.json`), 'utf8'))
  assert.equal(record.customer, undefined)
  assert.equal(record.order.customer.email, dropped.customer.email)
}))

test('relative adjustments stay safe and never go below zero', () => withDir(async (dir) => {
  assert.equal((await adjustStock(dir, { delta: 5 })).error, 'untracked')
  await setQty(dir, 2)
  assert.equal((await adjustStock(dir, { delta: 0 })).ok, false)
  assert.equal((await adjustStock(dir, { delta: 1.5 })).ok, false)
  assert.equal((await adjustStock(dir, { delta: '3' })).ok, false)
  assert.equal((await adjustStock(dir, { delta: -3 })).ok, false)
  const [a, b] = await Promise.all([adjustStock(dir, { delta: 10 }), adjustStock(dir, { delta: -1 })])
  assert.equal(a.ok && b.ok, true)
  assert.equal((await loadStock(dir)).onHand, 11)
  assert.equal((await setStock(dir, { onHand: null, version: (await loadStock(dir)).version })).stock.onHand, null)
}))
