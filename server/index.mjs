// ─────────────────────────────────────────────────────────────
// Serveur de la boutique (Node ≥ 18, sans dépendance).
//  · API d'administration du paiement par redirection externe (protégée par mot de passe)
//  · Validation des commandes + construction de l'URL de paiement (jamais côté navigateur)
//  · En production : sert aussi le site compilé (dist/) avec repli SPA.
//
// Démarrage :  ADMIN_PASSWORD="…au moins 12 caractères…" node server/index.mjs
// Variables :  PORT (8787), ADMIN_PASSWORD (obligatoire pour /admin), DATA_DIR (server/data),
//              PUBLIC_ORIGIN (ex. https://boutique.ch — pour l'URL absolue de la photo produit)
// ─────────────────────────────────────────────────────────────
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateOrder } from '../src/lib/orderValidation.js'
import { getOffer } from '../src/config/offers.js'
import { defaultConfig, validateConfig, buildRedirectUrl } from '../src/lib/redirectPayment.js'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const PORT = Number(process.env.PORT || 8787)
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
async function readJson(req) {
  if (!(req.headers['content-type'] || '').includes('application/json')) throw new Error('type')
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 20_000) throw new Error('size')
  }
  return JSON.parse(raw || '{}')
}
const originOf = (req) => process.env.PUBLIC_ORIGIN || (req.headers.origin && /^https?:\/\//.test(req.headers.origin) ? req.headers.origin : '')

// ── Routes API ──
async function api(req, res, path) {
  const method = req.method

  // Public : état du paiement par redirection (le domaine sert à informer le client avant la redirection).
  if (path === '/api/payment/config' && method === 'GET') {
    const r = config.externalRedirect
    return send(res, 200, { externalRedirect: { enabled: r.enabled, domain: r.enabled ? r.domain : '' } })
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
    const result = validateOrder(body)
    if (!result.ok) {
      console.warn('[commande] refusée — champs :', Object.keys(result.errors).join(', ')) // jamais les valeurs
      return send(res, 422, { error: 'invalid', errors: result.errors })
    }
    const offer = getOffer(result.order.offerId)
    const pkg = r.packages[offer.id]
    if (r.pathTemplate.includes('{code}') && !pkg?.code) return send(res, 409, { error: 'payment_unavailable' })
    const redirectUrl = buildRedirectUrl(config, offer, result.order.customer, { origin: originOf(req) })
    console.info(`[commande] redirection paiement — offre ${offer.id}`)
    return send(res, 200, { redirectUrl })
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
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain' }
async function serveStatic(req, res, path) {
  let file = resolve(join(DIST, decodeURIComponent(path)))
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'forbidden' })
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
  } catch {
    file = join(DIST, 'index.html') // repli SPA
  }
  try {
    const data = await readFile(file)
    const ext = extname(file)
    res.writeHead(200, {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': file.includes(`${join('dist', 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    })
    res.end(data)
  } catch {
    send(res, 404, { error: 'not_found' })
  }
}

await loadConfig()
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  try {
    if (path.startsWith('/api/')) return await api(req, res, path)
    return await serveStatic(req, res, path)
  } catch (e) {
    console.error('[serveur] erreur', e?.message)
    send(res, 500, { error: 'server_error' })
  }
}).listen(PORT, () => {
  console.log(`Serveur boutique : http://localhost:${PORT}  ·  administration ${PASSWORD ? 'activée' : 'désactivée (ADMIN_PASSWORD manquant)'}`)
})
