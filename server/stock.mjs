import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { OFFERS, PRODUCT, getOffer } from '../src/config/offers.js'

// ─────────────────────────────────────────────────────────────
// Stock — source unique, côté serveur (DATA_DIR/stock.json).
// Unité : le sachet du produit unique (PRODUCT.id). Chaque offre consomme offer.packs sachets.
// onHand = null : quantité non renseignée par le marchand → aucune limite appliquée, rien d'« épuisé ».
//
// Cycle d'une commande Everflow :
//  1. création de la commande en attente → réservation (« held ») pendant holdMinutes ;
//  2. la redirection vers la page hébergée N'EST PAS une preuve de paiement : sans action,
//     la réservation expire et les sachets redeviennent disponibles ;
//  3. l'administrateur constate le paiement chez le prestataire → « committed » : déduction définitive ;
//     ou l'annule → « cancelled » : libération.
// Toutes les écritures passent par une file unique (un seul processus serveur) et un fichier
// réécrit atomiquement : deux commandes simultanées ne peuvent pas réserver le même sachet.
// ─────────────────────────────────────────────────────────────

export const MAX_QUANTITY = 1_000_000
export const HOLD_MINUTES = { min: 5, max: 1440, default: 30 }
const KEEP_CLOSED_MS = 30 * 24 * 60 * 60 * 1000
const MAX_MOVEMENTS = 60
const KEY_RE = /^[0-9a-f-]{36}$/

let queue = Promise.resolve()
function withLock(action) {
  const next = queue.then(action)
  queue = next.catch(() => {})
  return next
}

const fresh = () => ({ version: 0, sku: PRODUCT.id, onHand: null, holdMinutes: HOLD_MINUTES.default, updatedAt: null, reservations: [], movements: [] })

export async function loadStock(dataDir) {
  try {
    const saved = JSON.parse(await readFile(join(dataDir, 'stock.json'), 'utf8'))
    return { ...fresh(), ...saved, reservations: Array.isArray(saved.reservations) ? saved.reservations : [], movements: Array.isArray(saved.movements) ? saved.movements : [] }
  } catch { return fresh() }
}

async function saveStock(dataDir, state, now) {
  await mkdir(dataDir, { recursive: true })
  const file = join(dataDir, 'stock.json')
  const temp = `${file}.tmp`
  const cutoff = now - KEEP_CLOSED_MS
  const next = {
    ...state,
    version: state.version + 1,
    updatedAt: new Date(now).toISOString(),
    reservations: state.reservations.filter((r) => Date.parse(r.closedAt || r.expiresAt) > cutoff),
    movements: state.movements.slice(0, MAX_MOVEMENTS),
  }
  await writeFile(temp, JSON.stringify(next, null, 2), 'utf8')
  await rename(temp, file)
  return next
}

const isActive = (r, now) => r.state === 'held' && Date.parse(r.expiresAt) > now
const heldUnits = (state, now, exceptKey) =>
  state.reservations.reduce((sum, r) => (r.key !== exceptKey && isActive(r, now) ? sum + r.sachets : sum), 0)
const freeUnits = (state, now, exceptKey) => (state.onHand === null ? Infinity : Math.max(0, state.onHand - heldUnits(state, now, exceptKey)))
const log = (state, now, entry) => state.movements.unshift({ at: new Date(now).toISOString(), onHand: state.onHand, ...entry })

export const isQuantity = (v) => Number.isInteger(v) && v >= 0 && v <= MAX_QUANTITY

// Disponibilité par offre (aucune quantité exposée au public).
export function offerAvailability(state, now = Date.now()) {
  const free = freeUnits(state, now)
  return Object.fromEntries(OFFERS.map((o) => [o.id, { available: free >= o.packs }]))
}

export function publicStock(state, now = Date.now()) {
  return { tracked: state.onHand !== null, offers: offerAvailability(state, now) }
}

// Vue administrateur.
export function stockSummary(state, now = Date.now()) {
  const held = heldUnits(state, now)
  const tracked = state.onHand !== null
  const free = tracked ? Math.max(0, state.onHand - held) : null
  return {
    sku: state.sku,
    productName: PRODUCT.name,
    unit: 'sachet',
    tracked,
    onHand: state.onHand,
    held,
    available: free,
    holdMinutes: state.holdMinutes,
    version: state.version,
    updatedAt: state.updatedAt,
    offers: OFFERS.map((o) => ({ id: o.id, packs: o.packs, price: o.price, available: !tracked || free >= o.packs, maxOrders: tracked ? Math.floor(free / o.packs) : null })),
    reservations: state.reservations
      .filter((r) => r.state === 'held')
      .map((r) => ({ ...r, active: isActive(r, now) }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    movements: state.movements,
  }
}

// Vérification sans réservation (redirection externe générique, sans fiche commande).
export async function checkAvailable(dataDir, offerId, now = Date.now()) {
  const offer = getOffer(offerId)
  if (!offer) return false
  return freeUnits(await loadStock(dataDir), now) >= offer.packs
}

// Réserve les sachets d'une commande en attente. Idempotent par clé (clé d'idempotence de la commande).
export function reserve(dataDir, { key, offerId, now = Date.now() }) {
  const offer = getOffer(offerId)
  if (!offer || !KEY_RE.test(key || '')) return Promise.resolve({ ok: false, error: 'invalid' })
  return withLock(async () => {
    const state = await loadStock(dataDir)
    const existing = state.reservations.find((r) => r.key === key)
    if (existing && existing.state !== 'held') return { ok: false, error: 'order_closed' }
    if (existing && isActive(existing, now)) return { ok: true, reservation: existing }
    if (freeUnits(state, now, key) < offer.packs) return { ok: false, error: 'out_of_stock' }
    const expiresAt = new Date(now + state.holdMinutes * 60_000).toISOString()
    const reservation = existing
      ? Object.assign(existing, { offerId: offer.id, sachets: offer.packs, expiresAt, renewedAt: new Date(now).toISOString() })
      : { key, orderId: null, offerId: offer.id, sachets: offer.packs, state: 'held', createdAt: new Date(now).toISOString(), expiresAt }
    if (!existing) state.reservations.push(reservation)
    log(state, now, { type: 'hold', delta: -offer.packs, ref: key, offerId: offer.id })
    await saveStock(dataDir, state, now)
    return { ok: true, reservation }
  })
}

export function attachOrder(dataDir, key, orderId) {
  return withLock(async () => {
    const state = await loadStock(dataDir)
    const r = state.reservations.find((item) => item.key === key)
    if (!r || r.orderId === orderId) return
    r.orderId = orderId
    await saveStock(dataDir, state, Date.now())
  })
}

// Paiement constaté par l'administrateur chez le prestataire → déduction définitive.
// Accepté aussi pour une réservation expirée (paiement tardif), si le stock physique le permet.
export function commitReservation(dataDir, key, now = Date.now()) {
  return withLock(async () => {
    const state = await loadStock(dataDir)
    const r = state.reservations.find((item) => item.key === key)
    if (!r) return { ok: false, error: 'not_found' }
    if (r.state !== 'held') return { ok: false, error: 'already_closed' }
    if (state.onHand !== null) {
      // Les autres réservations actives restent protégées ; une réservation expirée doit retrouver des sachets libres.
      if (freeUnits(state, now, key) < r.sachets) return { ok: false, error: 'insufficient_stock' }
      state.onHand -= r.sachets
    }
    Object.assign(r, { state: 'committed', closedAt: new Date(now).toISOString() })
    log(state, now, { type: 'commit', delta: state.onHand === null ? 0 : -r.sachets, ref: key, offerId: r.offerId })
    return { ok: true, reservation: r, stock: await saveStock(dataDir, state, now) }
  })
}

export function cancelReservation(dataDir, key, now = Date.now()) {
  return withLock(async () => {
    const state = await loadStock(dataDir)
    const r = state.reservations.find((item) => item.key === key)
    if (!r) return { ok: false, error: 'not_found' }
    if (r.state !== 'held') return { ok: false, error: 'already_closed' }
    Object.assign(r, { state: 'cancelled', closedAt: new Date(now).toISOString() })
    log(state, now, { type: 'release', delta: r.sachets, ref: key, offerId: r.offerId })
    return { ok: true, reservation: r, stock: await saveStock(dataDir, state, now) }
  })
}

// Saisie absolue : refusée si le stock a changé depuis la lecture (version), pour ne pas écraser
// une commande intervenue entre-temps. onHand = null → stock non suivi.
export function setStock(dataDir, input, now = Date.now()) {
  const errors = {}
  // Nombres JSON uniquement : « » ou true ne deviennent jamais 0 ou 1.
  const onHand = input?.onHand === null ? null : typeof input?.onHand === 'number' ? input.onHand : NaN
  const holdMinutes = input?.holdMinutes === undefined ? undefined : typeof input.holdMinutes === 'number' ? input.holdMinutes : NaN
  if (onHand !== null && !isQuantity(onHand)) errors.onHand = `Indiquez un nombre entier de sachets, de 0 à ${MAX_QUANTITY.toLocaleString('fr-CH')}.`
  if (holdMinutes !== undefined && !(Number.isInteger(holdMinutes) && holdMinutes >= HOLD_MINUTES.min && holdMinutes <= HOLD_MINUTES.max)) {
    errors.holdMinutes = `Durée en minutes entières, de ${HOLD_MINUTES.min} à ${HOLD_MINUTES.max}.`
  }
  if (!Number.isInteger(input?.version)) errors.version = 'Version manquante : rechargez la page.'
  if (Object.keys(errors).length) return Promise.resolve({ ok: false, error: 'invalid', errors })
  return withLock(async () => {
    const state = await loadStock(dataDir)
    if (state.version !== input.version) return { ok: false, error: 'conflict', stock: state }
    const before = state.onHand
    state.onHand = onHand
    if (holdMinutes !== undefined) state.holdMinutes = holdMinutes
    if (before !== onHand) log(state, now, { type: onHand === null ? 'untrack' : 'set', delta: before === null || onHand === null ? null : onHand - before })
    return { ok: true, stock: await saveStock(dataDir, state, now) }
  })
}

// Entrée (réception) ou sortie (casse, inventaire) relative : sûre face aux commandes simultanées.
export function adjustStock(dataDir, input, now = Date.now()) {
  const delta = typeof input?.delta === 'number' ? input.delta : NaN
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > MAX_QUANTITY) {
    return Promise.resolve({ ok: false, error: 'invalid', errors: { delta: 'Indiquez un nombre entier de sachets, différent de 0.' } })
  }
  return withLock(async () => {
    const state = await loadStock(dataDir)
    if (state.onHand === null) return { ok: false, error: 'untracked', errors: { delta: 'Renseignez d’abord la quantité en stock.' } }
    const next = state.onHand + delta
    if (next < 0 || next > MAX_QUANTITY) return { ok: false, error: 'invalid', errors: { delta: `Le stock ne peut pas passer sous 0 (actuellement ${state.onHand}).` } }
    state.onHand = next
    log(state, now, { type: delta > 0 ? 'receive' : 'remove', delta })
    return { ok: true, stock: await saveStock(dataDir, state, now) }
  })
}
