import { createHash, randomUUID } from 'node:crypto'
import { mkdir, open, readFile, readdir, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { normalizePhone } from '../src/lib/orderValidation.js'
import { CHANNELS, sanitizeSource } from '../src/lib/trafficSource.js'

// ─────────────────────────────────────────────────────────────
// Commandes : chaque clic sur « Acheter » (après validation serveur) devient une fiche commande
// avec les coordonnées du client et sa provenance (Meta / Snapchat / Google / autre / direct).
//
// Déduplication à deux niveaux :
//  1. Clé d'idempotence (un fichier par clé, créé en exclusivité) : double clic, rechargement,
//     nouvel essai identique → même commande.
//  2. Client : même e-mail et téléphone pendant 48 h → une seule commande,
//     même depuis un autre onglet ou appareil. Une commande close ne peut pas
//     être réouverte avant la fin de cette fenêtre.
// ─────────────────────────────────────────────────────────────

export const ORDERS_DIR = 'everflow-orders' // nom historique : toutes les commandes y sont rangées
const DEDUP_DIR = 'order-dedup'
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const DEDUP_MS = 48 * 60 * 60 * 1000

export const isOrderKey = (key) => ID_RE.test(key || '')
export const orderPath = (dataDir, key) => (isOrderKey(key) ? join(dataDir, ORDERS_DIR, `${key.toLowerCase()}.json`) : null)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function writeExclusive(path, text) {
  const handle = await open(path, 'wx', 0o600)
  try {
    await handle.writeFile(text)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

export async function writeAtomic(path, text) {
  const temp = `${path}.${randomUUID()}.tmp`
  await writeFile(temp, text, { mode: 0o600 })
  await rename(temp, path)
}

// Lecture tolérante : un fichier en cours d'écriture (ou pas encore créé si `wait`) est relu un instant.
export async function readJsonFile(path, { wait = false } = {}) {
  for (let attempt = 0; attempt < (wait ? 25 : 20); attempt++) {
    try {
      return JSON.parse(await readFile(path, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT' && !wait) return null
      await sleep(error.code === 'ENOENT' ? 40 : 20)
    }
  }
  return null
}

export async function readOrder(dataDir, key, options) {
  const path = orderPath(dataDir, key)
  return path ? readJsonFile(path, options) : null
}

// Empreinte client, indépendante de l'offre (aucune donnée lisible dans le nom de fichier).
function customerHash(order) {
  const email = String(order.customer.email || '').trim().toLowerCase()
  const phone = normalizePhone(order.customer.tel).replace(/^(\+41|0041|0)/, '')
  return createHash('sha256').update(`${email}|${phone}`).digest('hex')
}

const sameCustomer = (a, b) => customerHash(a) === customerHash(b)

// Serialize check-and-create for a customer in this single Node service. The
// persisted claim file still carries the 48 h window across restarts.
const customerLocks = new Map()
export async function withCustomerLock(order, work) {
  const id = customerHash(order)
  const previous = customerLocks.get(id) || Promise.resolve()
  let release
  const current = new Promise((resolve) => { release = resolve })
  customerLocks.set(id, current)
  await previous
  try { return await work() } finally {
    if (customerLocks.get(id) === current) customerLocks.delete(id)
    release()
  }
}

// Also finds records created before the customer-only dedup key was introduced.
export async function findRecentCustomerOrder(dataDir, order) {
  let names
  try {
    names = (await readdir(join(dataDir, ORDERS_DIR))).filter((name) => /^[0-9a-f-]{36}\.json$/.test(name))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
  const records = await Promise.all(names.map(async (name) => ({ key: name.slice(0, -5), record: await readJsonFile(join(dataDir, ORDERS_DIR, name)) })))
  return records.filter(({ record }) => record?.order?.customer &&
    Date.now() - Date.parse(record.createdAt) < DEDUP_MS && sameCustomer(record.order, order))
    .sort((a, b) => Date.parse(b.record.createdAt) - Date.parse(a.record.createdAt))[0] || null
}

// Réserve le couple client + offre pour `key`. Renvoie la clé de la commande à utiliser :
// `key` (nouvelle commande) ou la clé d'une commande encore en attente dans la fenêtre.
export async function claimCustomer(dataDir, order, key, isLive) {
  const dir = join(dataDir, DEDUP_DIR)
  await mkdir(dir, { recursive: true })
  const path = join(dir, `${customerHash(order)}.json`)
  const entry = JSON.stringify({ key, at: new Date().toISOString() })
  try {
    await writeExclusive(path, entry)
    return key
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
  const previous = await readJsonFile(path)
  if (previous?.key === key) return key
  if (isOrderKey(previous?.key) && Date.now() - Date.parse(previous.at) < DEDUP_MS && (await isLive(previous.key))) return previous.key
  await writeAtomic(path, entry)
  return key
}

// Nouvel essai d'un client qui a déjà une commande en attente : mêmes identifiant et réservation,
// coordonnées et provenance les plus récentes, compteur de clics.
export async function mergeIntoOrder(dataDir, key, update) {
  const path = orderPath(dataDir, key)
  const record = await readJsonFile(path, { wait: true })
  if (!record || record.status !== 'pending') return null
  // Un double clic (même contenu, quelques secondes) n'est pas compté comme un nouveau clic.
  const last = Date.parse(record.updatedAt || record.createdAt)
  const repeat = update.fingerprint === record.fingerprint && Date.now() - last < 60_000
  const next = {
    ...record,
    ...update,
    source: update.source?.last ? update.source : record.source,
    clicks: (record.clicks || 1) + (repeat ? 0 : 1),
    updatedAt: new Date().toISOString(),
  }
  await writeAtomic(path, JSON.stringify(next))
  return next
}

export const fingerprintOf = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

// Commande enregistrée pour les chemins sans fiche dédiée (redirection externe).
export async function recordOrder(dataDir, { key, provider, order, source }) {
  if (!isOrderKey(key)) return { error: 'invalid_idempotency_key' }
  return withCustomerLock(order, () => recordOrderLocked(dataDir, { key, provider, order, source }))
}

async function recordOrderLocked(dataDir, { key, provider, order, source }) {
  const idempotencyKey = key.toLowerCase()
  const fingerprint = fingerprintOf(order)
  await mkdir(join(dataDir, ORDERS_DIR), { recursive: true })
  const resultFor = async (existingKey, existing) => {
    if (!existing) return null
    if (existingKey === idempotencyKey && existing.fingerprint !== fingerprint) return { error: 'idempotency_conflict', orderId: existing.orderId }
    if (existing.provider !== provider || existing.status !== 'pending') return { error: 'recent_order', orderId: existing.orderId }
    if (existing.order.offerId !== order.offerId) return { orderId: existing.orderId, duplicate: true, order: existing.order }
    const merged = existingKey === idempotencyKey ? existing : await mergeIntoOrder(dataDir, existingKey, { order, fingerprint, source: sanitizeSource(source) })
    return merged ? { orderId: merged.orderId, duplicate: true, order: merged.order } : { error: 'recent_order', orderId: existing.orderId }
  }
  const byKey = await readOrder(dataDir, idempotencyKey)
  if (byKey) return resultFor(idempotencyKey, byKey)
  const recent = await findRecentCustomerOrder(dataDir, order)
  if (recent) return resultFor(recent.key, recent.record)
  const live = await claimCustomer(dataDir, order, idempotencyKey, async (k) => {
    const record = await readOrder(dataDir, k, { wait: true })
    return Boolean(record)
  })
  if (live !== idempotencyKey) {
    const existing = await readOrder(dataDir, live, { wait: true })
    const result = await resultFor(live, existing)
    if (result) return result
  }
  const record = {
    orderId: randomUUID(), provider, status: 'pending', createdAt: new Date().toISOString(),
    clicks: 1, fingerprint, order, source: sanitizeSource(source),
  }
  try {
    await writeExclusive(orderPath(dataDir, idempotencyKey), JSON.stringify(record))
    return { orderId: record.orderId, duplicate: false, order: record.order }
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    const existing = await readOrder(dataDir, idempotencyKey, { wait: true })
    return resultFor(idempotencyKey, existing)
  }
}

// ── Administration ──
const channelOf = (record) => (CHANNELS.includes(record.source?.channel) ? record.source.channel : 'direct')

export async function listOrders(dataDir) {
  let names = []
  try {
    names = (await readdir(join(dataDir, ORDERS_DIR))).filter((n) => /^[0-9a-f-]{36}\.json$/.test(n))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const records = await Promise.all(names.map((n) => readJsonFile(join(dataDir, ORDERS_DIR, n))))
  const orders = records.filter((r) => r?.order?.customer).map((r) => ({
    orderId: r.orderId,
    provider: r.provider || 'everflow',
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt || null,
    closedAt: r.closedAt || null,
    clicks: r.clicks || 1,
    offerId: r.order.offerId,
    packs: r.order.packs,
    total: r.order.total,
    customer: r.order.customer,
    channel: channelOf(r),
    source: r.source || null,
  })).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const byChannel = Object.fromEntries(CHANNELS.map((c) => [c, orders.filter((o) => o.channel === c).length]))
  return { total: orders.length, byChannel, orders }
}

export async function closeExternalOrder(dataDir, orderId, status) {
  if (!isOrderKey(orderId) || !['confirmed', 'cancelled'].includes(status)) return false
  let names
  try {
    names = (await readdir(join(dataDir, ORDERS_DIR))).filter((name) => /^[0-9a-f-]{36}\.json$/.test(name))
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
  for (const name of names) {
    const path = join(dataDir, ORDERS_DIR, name)
    const record = await readJsonFile(path)
    if (record?.orderId?.toLowerCase() !== orderId.toLowerCase()) continue
    if (record.provider !== 'external' || record.status !== 'pending') return false
    await writeAtomic(path, JSON.stringify({ ...record, status, closedAt: new Date().toISOString(), closedBy: 'admin' }))
    return true
  }
  return false
}

// Limited public lookup by the random customer-facing order ID. Never expose the
// stored contact details, attribution, or provider URL through this endpoint.
export async function publicOrderStatus(dataDir, orderId) {
  if (!isOrderKey(orderId)) return null
  let names
  try {
    names = (await readdir(join(dataDir, ORDERS_DIR))).filter((name) => /^[0-9a-f-]{36}\.json$/.test(name))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
  for (const name of names) {
    const record = await readJsonFile(join(dataDir, ORDERS_DIR, name))
    if (record?.orderId?.toLowerCase() !== orderId.toLowerCase()) continue
    return {
      orderId: record.orderId,
      status: record.status === 'confirmed' ? 'confirmed' : record.status === 'cancelled' ? 'cancelled' : 'processing',
      offerId: record.order.offerId,
      packs: record.order.packs,
      total: record.order.total,
      createdAt: record.createdAt,
    }
  }
  return null
}
