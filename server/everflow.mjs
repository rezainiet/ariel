import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { getOffer, PRODUCT } from '../src/config/offers.js'
import { META_PIXEL_ID } from '../src/config/attribution.js'
import { validateOrder, normalizePhone } from '../src/lib/orderValidation.js'
import { reserve, attachOrder, loadStock } from './stock.mjs'
import { ORDERS_DIR, orderPath, claimCustomer, mergeIntoOrder, readOrder, readJsonFile, writeExclusive, fingerprintOf, findRecentCustomerOrder, withCustomerLock } from './orders.mjs'
import { sanitizeSource } from '../src/lib/trafficSource.js'

// These are the three offer links supplied for this shop. No admin setting or request
// value may replace their origin, path, or existing tracking query parameters.
export const TRACKING_LINKS = Object.freeze({
  'pack-1': 'https://www.molipy8trk.com/2J23GL9/WMD7FHG/?sub5=815653229569193',
  'pack-2': 'https://www.molipy8trk.com/2J23GL9/WMJD3P9/?sub5=815653229569193',
  'pack-3': 'https://www.molipy8trk.com/2J23GL9/WMKQZFW/?sub5=815653229569193',
})

// The live admin redirect may still be enabled while the dedicated Everflow
// checkout is off. Use the same approved URLs whenever that configuration
// points to these three offers.
export function usesApprovedEverflowLinks(redirect) {
  return redirect?.enabled === true && redirect.domain === 'www.molipy8trk.com' &&
    Object.entries(TRACKING_LINKS).every(([id, link]) =>
      redirect.pathTemplate?.replace('{code}', redirect.packages?.[id]?.code || '') === new URL(link).pathname)
}

export const IMAGE_PATHS = Object.freeze({
  'pack-1': '/images/everflow/pack-1.webp',
  'pack-2': '/images/everflow/pack-2.png',
  'pack-3': '/images/everflow/pack-3.png',
})

const PREFILL = ['sub10', 'adv3', 'sub3', 'sub4', 'sub6', 'sub7', 'sub8']
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PIXEL_RE = /^[0-9]{5,30}$/
const FBCLID_RE = /^[A-Za-z0-9_-]{1,500}$/

export function settings(env = process.env, localRequest = false) {
  let origin = ''
  try {
    const url = new URL(env.PUBLIC_ORIGIN || '')
    if (url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/' && url.hostname.includes('.')) origin = url.origin
  } catch { /* public origin is required before activation */ }
  // Local checkout preview is explicit and can never activate in production.
  // Its image URLs are useful for inspecting the generated link, but the
  // external provider cannot fetch an image hosted on localhost.
  const preview = env.EVERFLOW_LOCAL_PREVIEW === 'true' && env.NODE_ENV === 'development' && localRequest
  if (preview) origin = 'http://localhost:5173'
  const images = Object.fromEntries(Object.entries(IMAGE_PATHS).map(([offerId, path]) => [offerId, origin ? new URL(path, origin).toString() : '']))
  return {
    enabled: (env.EVERFLOW_ENABLED === 'true' && env.EVERFLOW_IMAGES_APPROVED === 'true' && Boolean(origin) && !preview) || preview,
    preview,
    images,
    metaPixel: PIXEL_RE.test(env.EVERFLOW_META_PIXEL_ID ?? META_PIXEL_ID) ? (env.EVERFLOW_META_PIXEL_ID ?? META_PIXEL_ID) : '',
    snapPixel: PIXEL_RE.test(env.EVERFLOW_SNAP_PIXEL_ID || '') ? env.EVERFLOW_SNAP_PIXEL_ID : '',
  }
}

export function buildEverflowUrl(offerId, customer, imageUrl, attribution = '', fbclid = '') {
  const approved = TRACKING_LINKS[offerId]
  const offer = getOffer(offerId)
  if (!approved || !offer) throw new Error('unsupported_offer')
  const url = new URL(approved)
  if (url.protocol !== 'https:' || url.origin !== 'https://www.molipy8trk.com') throw new Error('unapproved_destination')
  const values = {
    sub10: customer.prenom,
    adv3: customer.nom,
    sub3: customer.npa,
    sub4: customer.email,
    sub6: customer.ville,
    sub7: [customer.adresse, customer.complement].filter(Boolean).join(', '),
    sub8: normalizePhone(customer.tel).replace(/^0041/, '+41').replace(/^0([1-9]\d{8})$/, '+41$1'),
  }
  for (const key of PREFILL) if (values[key]) url.searchParams.set(key, values[key])
  url.searchParams.set('adv1', `${PRODUCT.name} – ${offer.packs} sachet${offer.packs > 1 ? 's' : ''} (${offer.washes} capsules)`)
  url.searchParams.set('adv2', imageUrl)
  if (attribution && !url.searchParams.has('sub5')) url.searchParams.set('sub5', attribution)
  if (FBCLID_RE.test(fbclid)) url.searchParams.set('fbclid', fbclid)
  return url.toString()
}

export function prepareCheckout(body, cfg) {
  if (!cfg.enabled) return { status: 409, error: 'payment_unavailable' }
  if (!ID_RE.test(body?.idempotencyKey || '')) return { status: 400, error: 'invalid_idempotency_key' }
  const result = validateOrder(body)
  if (!result.ok) return { status: 422, error: 'invalid', errors: result.errors }
  const order = result.order
  if (!order.customer.tel) return { status: 422, error: 'invalid', errors: { tel: 'Veuillez indiquer votre numéro de téléphone.' } }
  if (body.cart !== undefined || (body.packs !== undefined && body.packs !== order.packs) ||
      (body.quantity !== undefined && body.quantity !== order.packs) ||
      (body.currency !== undefined && body.currency !== 'CHF') ||
      (body.total !== undefined && body.total !== order.total)) {
    return { status: 422, error: 'unsupported_cart' }
  }
  if (!TRACKING_LINKS[order.offerId] || !cfg.images[order.offerId]) return { status: 422, error: 'unsupported_offer' }
  const attribution = body.marketingConsent === true
    ? cfg.metaPixel && cfg.snapPixel
      ? `${cfg.metaPixel}${'_'.repeat(21)}${cfg.snapPixel}`
      : cfg.metaPixel || cfg.snapPixel || ''
    : ''
  const fbclid = body.marketingConsent === true && FBCLID_RE.test(body.fbclid || '') ? body.fbclid : ''
  return { status: 200, order, attribution, fbclid }
}

// A file per idempotency key, created exclusively. Concurrent retries therefore
// read the same pending order. Persist it before returning the browser URL.
// Stock is held (server/stock.mjs) before the order exists, keyed by the same idempotency key:
// a sold-out offer never produces a pending order, and a retry never holds the stock twice.
// The same customer (e-mail + phone) ordering the same offer again within the dedup window
// (server/orders.mjs) reuses their pending order and its stock hold, updated with the latest details.
export async function createPendingOrder(body, cfg, dataDir) {
  const prepared = prepareCheckout(body, cfg)
  if (prepared.status !== 200) return prepared
  return withCustomerLock(prepared.order, () => createPendingOrderLocked(body, cfg, dataDir, prepared))
}

async function createPendingOrderLocked(body, cfg, dataDir, prepared) {
  const key = body.idempotencyKey.toLowerCase()
  const source = sanitizeSource(body.source)
  const fingerprint = fingerprintOf({ order: prepared.order, attribution: prepared.attribution, fbclid: prepared.fbclid })
  await mkdir(join(dataDir, ORDERS_DIR), { recursive: true })
  const resultFor = async (existingKey, existing) => {
    if (!existing) return null
    if (existingKey === key && existing.fingerprint !== fingerprint) return { status: 409, error: 'idempotency_conflict' }
    if (existing.provider !== 'everflow' || existing.status !== 'pending') return { status: 409, error: 'recent_order', orderId: existing.orderId }
    const stock = await loadStock(dataDir)
    const held = stock.reservations.some((r) => r.key === existingKey && r.state === 'held' && Date.parse(r.expiresAt) > Date.now())
    if (!held) return { status: 409, error: 'recent_order', orderId: existing.orderId }
    const merged = existingKey !== key && existing.order.offerId === prepared.order.offerId
      ? await mergeIntoOrder(dataDir, existingKey, { order: prepared.order, attribution: prepared.attribution, fbclid: prepared.fbclid, fingerprint, source, imageUrl: cfg.images[prepared.order.offerId] })
      : existing
    if (!merged) return { status: 409, error: 'recent_order', orderId: existing.orderId }
    return { status: 200, orderId: merged.orderId, statusText: 'pending', duplicate: true,
      redirectUrl: buildEverflowUrl(merged.order.offerId, merged.order.customer, merged.imageUrl, merged.attribution, merged.fbclid) }
  }
  const byKey = await readOrder(dataDir, key)
  if (byKey) return resultFor(key, byKey)
  const recent = await findRecentCustomerOrder(dataDir, prepared.order)
  if (recent) return resultFor(recent.key, recent.record)
  const live = await claimCustomer(dataDir, prepared.order, key, async (k) => {
    const record = await readOrder(dataDir, k, { wait: true })
    return Boolean(record)
  })
  if (live !== key) {
    const existing = await readOrder(dataDir, live, { wait: true })
    const result = await resultFor(live, existing)
    if (result) return result
  }
  const hold = await reserve(dataDir, { key, offerId: prepared.order.offerId })
  if (!hold.ok) return { status: 409, error: hold.error === 'out_of_stock' ? 'out_of_stock' : 'order_closed' }
  const path = orderPath(dataDir, key)
  let record
  try {
    record = { orderId: randomUUID(), provider: 'everflow', status: 'pending', createdAt: new Date().toISOString(),
      clicks: 1, fingerprint, order: prepared.order, attribution: prepared.attribution, fbclid: prepared.fbclid, source,
      imageUrl: cfg.images[prepared.order.offerId] }
    await writeExclusive(path, JSON.stringify(record))
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    // Another request may still be writing the newly created file.
    record = await readJsonFile(path, { wait: true })
    if (!record) throw new Error('pending_order_unreadable')
    if (record.fingerprint !== fingerprint) return { status: 409, error: 'idempotency_conflict' }
    if (record.status !== 'pending') return { status: 409, error: 'order_closed' }
  }
  await attachOrder(dataDir, key, record.orderId)
  return { status: 200, orderId: record.orderId, statusText: 'pending',
    redirectUrl: buildEverflowUrl(record.order.offerId, record.order.customer, record.imageUrl, record.attribution, record.fbclid) }
}

export async function readPendingOrder(dataDir, key) {
  const path = orderPath(dataDir, key)
  if (!path) return null
  try { return JSON.parse(await readFile(path, 'utf8')) } catch { return null }
}

// Only an administrator who has checked the payment at the provider closes an order.
// A redirect or a return visit never calls this.
export async function closePendingOrder(dataDir, key, status) {
  if (!['confirmed', 'cancelled'].includes(status)) throw new Error('invalid_status')
  const record = await readPendingOrder(dataDir, key)
  if (!record) return false
  const path = orderPath(dataDir, key)
  const temp = `${path}.tmp`
  await writeFile(temp, JSON.stringify({ ...record, status, closedAt: new Date().toISOString(), closedBy: 'admin' }), { mode: 0o600 })
  await rename(temp, path)
  return true
}
