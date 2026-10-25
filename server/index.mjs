// ─────────────────────────────────────────────────────────────
// Serveur de la boutique (Node ≥ 18, sans dépendance).
//  · API d'administration du paiement par redirection externe (protégée par mot de passe)
//  · Validation des commandes + construction de l'URL de paiement (jamais côté navigateur)
//  · En production : sert aussi le site compilé (dist/) avec repli SPA.
//
// Démarrage :  ADMIN_PASSWORD="…au moins 12 caractères…" node server/index.mjs
// Variables :  HOST (127.0.0.1 en production), PORT (8787), ADMIN_PASSWORD, DATA_DIR (server/data),
//              PUBLIC_ORIGIN (ex. https://boutique.ch — pour l'URL absolue de la photo produit)
//              GEO_COUNTRY_HEADER (en-tête pays écrit par notre proxy/CDN, ex. x-geo-country — voir server/geo.mjs)
// ─────────────────────────────────────────────────────────────
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateOrder } from '../src/lib/orderValidation.js'
import { getOffer, BASE_CURRENCY } from '../src/config/offers.js'
import { defaultConfig, validateConfig, buildRedirectUrl } from '../src/lib/redirectPayment.js'
import { settings as everflowSettings, createPendingOrder, readPendingOrder, closePendingOrder, buildEverflowUrl, usesApprovedEverflowLinks, currencyReady } from './everflow.mjs'
import { localeOf, injectLocale, devCookieHeader } from './geo.mjs'
import { createGeoip, geoipPath } from './geoip.mjs'
import { getFeaturedOffer } from './featured-offer.mjs'
import { recordOrder, listOrders, publicOrderStatus, closeExternalOrder, isOrderKey } from './orders.mjs'
import { saveAnalytics, analyticsReport, pruneAnalytics } from './analytics.mjs'
import { listReviews, addReview, deleteReview, saveReviewImage, reviewImageFile } from './reviews.mjs'
import { loadStock, publicStock, stockSummary, checkAvailable, setStock, adjustStock, commitReservation, cancelReservation } from './stock.mjs'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0')
const DATA_DIR = resolve(process.env.DATA_DIR || join(ROOT, 'server', 'data'))
const CONFIG_FILE = join(DATA_DIR, 'payment-config.json')
const DIST = join(ROOT, 'dist')
const PASSWORD = process.env.ADMIN_PASSWORD || ''
const SESSION_MS = 8 * 60 * 60 * 1000
const IS_PROD = process.env.NODE_ENV === 'production'

if (PASSWORD && PASSWORD.length < 12) {
  console.error('ADMIN_PASSWORD doit contenir au moins 12 caractères.')
  process.exit(1)
}

// ── Stockage de la configuration (fichier JSON, écriture atomique) ──
let config = null
async function loadConfig() {
  try {
    const saved = JSON.parse(await readFile(CONFIG_FILE, 'utf8'))
    const base = defaultConfig()
    config = {
      ...base,
      ...saved,
      externalRedirect: { ...base.externalRedirect, ...saved.externalRedirect, packages: { ...base.externalRedirect.packages, ...saved.externalRedirect?.packages } },
    }
  } catch {
    config = defaultConfig()
  }
  return config
}
async function saveConfig(next) {
  await mkdir(DATA_DIR, { recursive: true })
  const tmp = `${CONFIG_FILE}.tmp`
  await writeFile(tmp, JSON.stringify(next, null, 2), 'utf8')
  await rename(tmp, CONFIG_FILE)
  config = next
}

// ── Sessions administrateur (en mémoire, cookie httpOnly) ──
const sessions = new Map() // token → expiration
const attempts = new Map() // ip → { n, until }
const sha = (s) => createHash('sha256').update(String(s)).digest()
const passwordOk = (p) => Boolean(PASSWORD) && timingSafeEqual(sha(p), sha(PASSWORD))

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split('=').map(decodeURIComponent)).filter(([k]) => k))
}
function isAdmin(req) {
  const t = cookies(req).admin_session
  const exp = t && sessions.get(t)
  if (!exp) return false
  if (exp < Date.now()) {
    sessions.delete(t)
    return false
  }
  return true
}
const ip = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '?'

// ── Utilitaires HTTP ──
function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  res.end(JSON.stringify(body))
}
async function readJson(req, maxBytes = 20_000) {
  if (!(req.headers['content-type'] || '').includes('application/json')) throw new Error('type')
  let raw = ''
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBytes) throw new Error('size')
    raw += chunk
  }
  return JSON.parse(raw || '{}')
}
const originOf = (req) => process.env.PUBLIC_ORIGIN || (req.headers.origin && /^https?:\/\//.test(req.headers.origin) ? req.headers.origin : '')
const localCheckoutRequest = (req) => /^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(req.headers.host || '') &&
  /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(req.socket.remoteAddress || '')

// Base pays GeoIP2 (DATA_DIR/geoip/country.mmdb) : rechargée quand server/update-geoip.mjs la remplace.
const geoip = createGeoip(geoipPath(DATA_DIR))

// Pays, langue et devise du visiteur (server/geo.mjs). Une devise autre que CHF n'est attribuée que si
// le paiement actif peut l'encaisser avec les liens approuvés.
function visitorLocale(req) {
  const local = localCheckoutRequest(req)
  const canCharge = (currency) => currencyReady(currency) &&
    (everflowSettings(process.env, local).enabled || usesApprovedEverflowLinks(config.externalRedirect))
  return localeOf(req, { local, canCharge, lookup: geoip.lookup })
}

// Vue stock de l'administration : réservations complétées par le nom du client (fiche commande).
async function adminStock() {
  const summary = stockSummary(await loadStock(DATA_DIR))
  const reservations = await Promise.all(summary.reservations.map(async (r) => {
    const order = await readPendingOrder(DATA_DIR, r.key)
    const c = order?.order?.customer
    return { ...r, orderId: r.orderId || order?.orderId || null, customer: c ? { name: `${c.prenom} ${c.nom}`.trim(), city: `${c.npa} ${c.ville}`.trim(), email: c.email } : null }
  }))
  return { ...summary, reservations }
}
const STOCK_ERRORS = { not_found: 404, already_closed: 409, insufficient_stock: 409, conflict: 409, untracked: 409, invalid: 422 }

// ── Routes API ──
async function api(req, res, path) {
  const method = req.method

  // Public : pays, devise et langue proposée (repli si la page n'a pas été servie par ce serveur).
  if (path === '/api/locale' && method === 'GET') return send(res, 200, visitorLocale(req))

  if (path === '/api/reviews' && method === 'GET') return send(res, 200, await listReviews(DATA_DIR))

  // Public : disponibilité par offre, sans quantité.
  if (path === '/api/stock' && method === 'GET') return send(res, 200, publicStock(await loadStock(DATA_DIR)))

  if (path === '/api/featured-offer' && method === 'GET') {
    const featured = await getFeaturedOffer(DATA_DIR)
    return send(res, 200, { ...featured, serverTime: new Date().toISOString() })
  }

  // First-party, consented visit snapshots. Only bounded aggregate fields are accepted.
  if (path === '/api/analytics' && method === 'POST') {
    if (req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(req.headers['sec-fetch-site'])) return send(res, 403, { error: 'forbidden' })
    let body
    try { body = await readJson(req, 6_000) } catch { return send(res, 400, { error: 'bad_request' }) }
    return await saveAnalytics(DATA_DIR, body)
      ? send(res, 200, { ok: true })
      : send(res, 422, { error: 'invalid' })
  }

  // Public : état du paiement par redirection (le domaine sert à informer le client avant la redirection).
  if (path === '/api/payment/config' && method === 'GET') {
    const r = config.externalRedirect
    const everflow = everflowSettings(process.env, localCheckoutRequest(req))
    return send(res, 200, { everflow: { enabled: everflow.enabled, preview: everflow.preview, domain: everflow.enabled ? 'www.molipy8trk.com' : '', attributionAvailable: Boolean(everflow.enabled && (everflow.metaPixel || everflow.snapPixel)) }, externalRedirect: { enabled: r.enabled, domain: r.enabled ? r.domain : '' } })
  }

  const publicOrderMatch = /^\/api\/orders\/([0-9a-f-]{36})\/status$/i.exec(path)
  if (publicOrderMatch && method === 'GET') {
    const order = await publicOrderStatus(DATA_DIR, publicOrderMatch[1])
    return order ? send(res, 200, order) : send(res, 404, { error: 'not_found' })
  }

  if (path === '/api/checkout/everflow' && method === 'POST') {
    let body
    try { body = await readJson(req) } catch { return send(res, 400, { error: 'bad_request' }) }
    const result = await createPendingOrder(body, everflowSettings(process.env, localCheckoutRequest(req)), DATA_DIR, { currency: visitorLocale(req).currency })
    if (result.status !== 200) {
      if (result.error === 'out_of_stock') console.info('[commande] refusée — stock insuffisant pour', body?.offerId)
      return send(res, result.status, { error: result.error, ...(result.errors ? { errors: result.errors } : {}), ...(result.orderId ? { orderId: result.orderId } : {}), ...(result.currency ? { currency: result.currency } : {}) })
    }
    console.info(`[commande] Everflow en attente — identifiant ${result.orderId}${result.duplicate ? ' (doublon fusionné)' : ''}`)
    return send(res, 200, { orderId: result.orderId, status: 'pending', redirectUrl: result.redirectUrl, duplicate: Boolean(result.duplicate) })
  }

  // Public : commande → validation serveur → URL de paiement externe.
  if (path === '/api/checkout/redirect' && method === 'POST') {
    const r = config.externalRedirect
    if (!r.enabled || !r.domain) return send(res, 409, { error: 'payment_unavailable' })
    let body
    try {
      body = await readJson(req)
    } catch {
      return send(res, 400, { error: 'bad_request' })
    }
    if (!isOrderKey(body.idempotencyKey)) return send(res, 400, { error: 'invalid_idempotency_key' })
    // Montant encaissé = montant affiché : la devise est celle que le serveur attribue à ce visiteur.
    const { currency } = visitorLocale(req)
    if (body.currency !== undefined && body.currency !== currency) return send(res, 409, { error: 'currency_mismatch', currency })
    if (currency !== BASE_CURRENCY && !usesApprovedEverflowLinks(r)) return send(res, 409, { error: 'payment_unavailable' })
    const result = validateOrder(body, { currency })
    if (!result.ok) {
      console.warn('[commande] refusée — champs :', Object.keys(result.errors).join(', ')) // jamais les valeurs
      return send(res, 422, { error: 'invalid', errors: result.errors })
    }
    const offer = getOffer(result.order.offerId)
    // Sans fiche commande, ce chemin ne peut pas réserver : il refuse seulement une offre épuisée.
    if (!(await checkAvailable(DATA_DIR, offer.id))) return send(res, 409, { error: 'out_of_stock' })
    const pkg = r.packages[offer.id]
    if (r.pathTemplate.includes('{code}') && !pkg?.code) return send(res, 409, { error: 'payment_unavailable' })
    // Le clic « Acheter » devient une commande (coordonnées + provenance), dédupliquée.
    const recorded = await recordOrder(DATA_DIR, { key: body.idempotencyKey, provider: 'external', order: result.order, source: body.source })
    if (recorded.error) return send(res, 409, { error: recorded.error, orderId: recorded.orderId || null })
    const actualOffer = getOffer(recorded.order.offerId)
    const redirectUrl = usesApprovedEverflowLinks(r)
      ? buildEverflowUrl(actualOffer.id, recorded.order.customer, everflowSettings(process.env).images[actualOffer.id] || r.packages[actualOffer.id]?.photoUrl || '',
        body.marketingConsent === true ? body.fbclid : '', body.marketingConsent === true ? body.sccid : '',
        { currency: recorded.order.currency || BASE_CURRENCY, lang: recorded.order.lang || 'fr' })
      : buildRedirectUrl(config, actualOffer, recorded.order.customer, { origin: originOf(req),
          fbclid: body.marketingConsent === true ? body.fbclid : '', sccid: body.marketingConsent === true ? body.sccid : '' })
    console.info(`[commande] redirection paiement — offre ${offer.id}, identifiant ${recorded.orderId}${recorded.duplicate ? ' (doublon fusionné)' : ''}`)
    return send(res, 200, { redirectUrl, orderId: recorded.orderId, duplicate: Boolean(recorded.duplicate) })
  }

  // ── Administration ──
  if (path === '/api/admin/session' && method === 'GET') return send(res, 200, { authenticated: isAdmin(req), configured: Boolean(PASSWORD) })

  if (path === '/api/admin/login' && method === 'POST') {
    if (!PASSWORD) return send(res, 503, { error: 'admin_disabled' })
    const key = ip(req)
    const a = attempts.get(key)
    if (a && a.until > Date.now() && a.n >= 5) return send(res, 429, { error: 'too_many_attempts' })
    let body
    try {
      body = await readJson(req)
    } catch {
      return send(res, 400, { error: 'bad_request' })
    }
    if (!passwordOk(body.password || '')) {
      const n = a && a.until > Date.now() ? a.n + 1 : 1
      attempts.set(key, { n, until: Date.now() + 10 * 60 * 1000 })
      return send(res, 401, { error: 'invalid_password' })
    }
    attempts.delete(key)
    const token = randomBytes(32).toString('hex')
    sessions.set(token, Date.now() + SESSION_MS)
    const secure = IS_PROD ? '; Secure' : ''
    return send(res, 200, { ok: true }, { 'Set-Cookie': `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${SESSION_MS / 1000}${secure}` })
  }

  if (path === '/api/admin/logout' && method === 'POST') {
    sessions.delete(cookies(req).admin_session)
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'admin_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0' })
  }

  if (path.startsWith('/api/admin/')) {
    if (!isAdmin(req)) return send(res, 401, { error: 'unauthorized' })
    if (path === '/api/admin/reviews' && method === 'GET') return send(res, 200, await listReviews(DATA_DIR))
    if (path === '/api/admin/reviews' && method === 'POST') {
      let body
      try { body = await readJson(req) } catch { return send(res, 400, { error: 'bad_request' }) }
      const result = await addReview(DATA_DIR, body)
      return result.ok ? send(res, 201, result.review) : send(res, 422, { error: 'invalid', errors: result.errors })
    }
    if (path === '/api/admin/review-images' && method === 'POST') {
      let body
      try { body = await readJson(req, 3_000_000) } catch { return send(res, 400, { error: 'bad_request' }) }
      const result = await saveReviewImage(DATA_DIR, body.dataUrl)
      return result.ok ? send(res, 201, { url: result.url }) : send(res, 422, { error: result.error })
    }
    if (path.startsWith('/api/admin/reviews/') && method === 'DELETE') {
      const removed = await deleteReview(DATA_DIR, path.slice('/api/admin/reviews/'.length))
      return send(res, removed ? 200 : 404, { removed })
    }
    if (path === '/api/admin/stock' && method === 'GET') return send(res, 200, await adminStock())
    if (path === '/api/admin/orders' && method === 'GET') return send(res, 200, await listOrders(DATA_DIR))
    const externalAction = /^\/api\/admin\/orders\/([0-9a-f-]{36})\/(confirm|cancel)$/i.exec(path)
    if (externalAction && method === 'POST') {
      try { await readJson(req) } catch { return send(res, 400, { error: 'bad_request' }) }
      const [, orderId, verb] = externalAction
      const closed = await closeExternalOrder(DATA_DIR, orderId, verb === 'confirm' ? 'confirmed' : 'cancelled')
      return closed ? send(res, 200, { ok: true }) : send(res, 409, { error: 'order_not_pending' })
    }
    if (path === '/api/admin/analytics' && method === 'GET') {
      const hours = Number(new URL(req.url, 'http://x').searchParams.get('hours'))
      return send(res, 200, await analyticsReport(DATA_DIR, hours))
    }
    if ((path === '/api/admin/stock' && method === 'PUT') || (path === '/api/admin/stock/adjust' && method === 'POST')) {
      let body
      try { body = await readJson(req) } catch { return send(res, 400, { error: 'bad_request' }) }
      const result = method === 'PUT' ? await setStock(DATA_DIR, body) : await adjustStock(DATA_DIR, body)
      if (!result.ok) return send(res, STOCK_ERRORS[result.error] || 422, { error: result.error, errors: result.errors, stock: result.error === 'conflict' ? await adminStock() : undefined })
      console.info(`[admin] stock ${method === 'PUT' ? 'défini' : 'ajusté'} — ${result.stock.onHand ?? 'non suivi'}`)
      return send(res, 200, await adminStock())
    }
    const action = /^\/api\/admin\/stock\/reservations\/([0-9a-f-]{36})\/(confirm|cancel)$/.exec(path)
    if (action && method === 'POST') {
      try { await readJson(req) } catch { return send(res, 400, { error: 'bad_request' }) }
      const [, key, verb] = action
      const result = verb === 'confirm' ? await commitReservation(DATA_DIR, key) : await cancelReservation(DATA_DIR, key)
      if (!result.ok) return send(res, STOCK_ERRORS[result.error] || 422, { error: result.error })
      await closePendingOrder(DATA_DIR, key, verb === 'confirm' ? 'confirmed' : 'cancelled')
      console.info(`[admin] réservation ${verb === 'confirm' ? 'confirmée (paiement constaté)' : 'annulée'} — ${result.reservation.sachets} sachet(s)`)
      return send(res, 200, await adminStock())
    }
    if (path === '/api/admin/config' && method === 'GET') return send(res, 200, config)
    if (path === '/api/admin/config' && method === 'PUT') {
      let body
      try {
        body = await readJson(req)
      } catch {
        return send(res, 400, { error: 'bad_request' })
      }
      const v = validateConfig(body)
      if (!v.ok) return send(res, 422, { error: 'invalid', errors: v.errors })
      const next = { ...v.config, updatedAt: new Date().toISOString() }
      await saveConfig(next)
      console.info(`[admin] configuration du paiement enregistrée — redirection ${next.externalRedirect.enabled ? 'activée' : 'désactivée'}`)
      return send(res, 200, next)
    }
  }
  return send(res, 404, { error: 'not_found' })
}

// ── Fichiers statiques (production) ──
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain' }
async function serveStatic(req, res, path) {
  let file = resolve(join(DIST, decodeURIComponent(path)))
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'forbidden' })
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
  } catch {
    file = join(DIST, 'index.html') // repli SPA
  }
  try {
    if (extname(file) === '.mp4') {
      const { size } = await stat(file)
      const range = req.headers.range
      const match = range && /^bytes=(\d*)-(\d*)$/.exec(range)
      if (range && (!match || (!match[1] && !match[2]))) {
        res.writeHead(416, { 'Content-Range': `bytes */${size}` })
        return res.end()
      }
      let start = 0
      let end = size - 1
      if (match) {
        if (!match[1]) {
          const suffix = Number(match[2])
          start = Math.max(0, size - suffix)
        } else {
          start = Number(match[1])
          if (match[2]) end = Math.min(end, Number(match[2]))
        }
        if (start > end || start >= size) {
          res.writeHead(416, { 'Content-Range': `bytes */${size}` })
          return res.end()
        }
      }
      res.writeHead(match ? 206 : 200, {
        'Content-Type': 'video/mp4',
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
        ...(match ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
        'Cache-Control': 'public, max-age=86400',
        'X-Content-Type-Options': 'nosniff',
      })
      if (req.method === 'HEAD') return res.end()
      createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res)
      return
    }
    let data = await readFile(file)
    const ext = extname(file)
    // Page de l'application : langue, métadonnées et devise du visiteur écrites avant l'envoi.
    const page = file === join(DIST, 'index.html')
    const devCookie = page ? devCookieHeader(req, process.env, localCheckoutRequest(req)) : null
    if (page) data = injectLocale(data.toString('utf8'), visitorLocale(req), process.env.PUBLIC_ORIGIN || '')
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': file.includes(`${join('dist', 'assets')}`) ? 'public, max-age=31536000, immutable' : page ? 'private, no-cache' : 'no-cache',
      ...(page ? { Vary: 'Accept-Language, Cookie' } : {}),
      ...(devCookie ? { 'Set-Cookie': devCookie } : {}),
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    res.end(data)
  } catch {
    send(res, 404, { error: 'not_found' })
  }
}

await loadConfig()
await pruneAnalytics(DATA_DIR).catch((error) => console.error('[analytics] nettoyage initial', error?.message))
setInterval(() => pruneAnalytics(DATA_DIR).catch((error) => console.error('[analytics] nettoyage', error?.message)), 24 * 60 * 60 * 1000).unref()
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  try {
    if (path.startsWith('/api/')) return await api(req, res, path)
    if (path.startsWith('/review-images/')) {
      const image = reviewImageFile(DATA_DIR, path)
      if (!image) return send(res, 404, { error: 'not_found' })
      try {
        const data = await readFile(image.file)
        res.writeHead(200, { 'Content-Type': image.type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' })
        return res.end(data)
      } catch { return send(res, 404, { error: 'not_found' }) }
    }
    return await serveStatic(req, res, path)
  } catch (e) {
    console.error('[serveur] erreur', e?.message)
    send(res, 500, { error: 'server_error' })
  }
}).listen(PORT, HOST, () => {
  console.log(`Serveur boutique : http://${HOST}:${PORT}  ·  administration ${PASSWORD ? 'activée' : 'désactivée (ADMIN_PASSWORD manquant)'}`)
})
