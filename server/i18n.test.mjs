import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { detectLang, parseAcceptLanguage, normalizeCountry } from '../src/i18n/detect.js'
import { PRICES, OFFERS, pricedOffer, formatMoney, currencyForCountry, savingsFor } from '../src/config/offers.js'
import { validateOrder } from '../src/lib/orderValidation.js'
import { countryOf, localeOf, injectLocale } from './geo.mjs'
import { prepareCheckout, currencyReady, buildEverflowUrl, productLabel } from './everflow.mjs'

const req = (headers = {}, url = '/') => ({ headers, url })
const GEO = { GEO_COUNTRY_HEADER: 'x-geo-country' }
// Prix fictifs réservés aux tests : ils ne sont jamais écrits dans la configuration.
const TEST_EUR = { 'pack-1': { price: 4.5, compareAt: 25.9 }, 'pack-2': { price: 7.9 }, 'pack-3': { price: 11.5 } }
async function withTestEur(fn) {
  PRICES.EUR = TEST_EUR
  try { return await fn() } finally { PRICES.EUR = null }
}

test('language follows manual choice, then country, then browser, then French', () => {
  assert.equal(detectLang({ country: 'DE', languages: ['fr-FR'] }), 'de')
  assert.equal(detectLang({ country: 'AT', languages: [] }), 'de')
  assert.equal(detectLang({ country: 'FR', languages: ['de-DE'] }), 'fr')
  assert.equal(detectLang({ country: 'CH', languages: ['de-CH', 'fr'] }), 'de')
  assert.equal(detectLang({ country: 'CH', languages: ['fr-CH'] }), 'fr')
  assert.equal(detectLang({ country: 'CH', languages: ['it-CH', 'en'] }), 'fr')
  assert.equal(detectLang({ country: 'CH', languages: ['en-GB', 'de'] }), 'de')
  assert.equal(detectLang({ country: 'US', languages: ['en-US', 'de'] }), 'de')
  assert.equal(detectLang({ country: '', languages: [] }), 'fr')
  assert.equal(detectLang({ stored: 'fr', country: 'DE', languages: ['de'] }), 'fr')
  assert.equal(detectLang({ stored: 'de', country: 'FR' }), 'de')
  assert.equal(detectLang({ stored: 'it', country: 'FR' }), 'fr')
})

test('Accept-Language is ordered by quality and unknown countries are ignored', () => {
  assert.deepEqual(parseAcceptLanguage('fr;q=0.4, de-CH, en;q=0.8, *;q=0.1'), ['de-CH', 'en', 'fr'])
  assert.deepEqual(parseAcceptLanguage(''), [])
  assert.equal(normalizeCountry(' de '), 'DE')
  assert.equal(normalizeCountry('XX'), '')
  assert.equal(normalizeCountry('<script>'), '')
})

test('country comes only from the configured proxy header, never from arbitrary client headers', () => {
  const spoof = { 'cf-ipcountry': 'DE', 'x-country': 'DE', 'x-geo-country': 'DE' }
  assert.equal(countryOf(req(spoof), {}), '')
  assert.equal(countryOf(req(spoof), GEO), 'DE')
  assert.equal(countryOf(req({ 'cf-ipcountry': 'FR' }), { GEO_COUNTRY_HEADER: 'CF-IPCountry' }), 'FR')
  // Test override: development + local request + explicit flag only.
  const dev = { ...GEO, NODE_ENV: 'development', GEO_DEV_OVERRIDE: 'true' }
  assert.equal(countryOf(req({}, '/?geo=at'), dev, true), 'AT')
  assert.equal(countryOf(req({ cookie: 'dev_geo=FR' }), dev, true), 'FR')
  assert.equal(countryOf(req({ 'x-geo-country': 'CH' }, '/?geo=DE'), { ...dev, NODE_ENV: 'production' }, true), 'CH')
  assert.equal(countryOf(req({ 'x-geo-country': 'CH' }, '/?geo=DE'), dev, false), 'CH')
})

test('currency depends on country only and falls back to CHF until EUR is fully configured', async () => {
  const locale = (country, extra = {}, canCharge) => localeOf(req({ 'x-geo-country': country, ...extra }), { env: GEO, ...(canCharge ? { canCharge } : {}) })
  // EUR prices and payment links are not configured: everyone pays (and sees) CHF.
  assert.equal(currencyReady('EUR'), false)
  for (const country of ['DE', 'AT', 'FR', 'CH', 'US', '']) assert.equal(locale(country).currency, 'CHF')
  assert.deepEqual(locale('DE'), { country: 'DE', currency: 'CHF', lang: 'de' })
  assert.deepEqual(locale('FR'), { country: 'FR', currency: 'CHF', lang: 'fr' })
  // Once EUR can be charged: DE/AT/FR get EUR, Switzerland and other countries keep CHF.
  const ready = (c) => c === 'EUR'
  assert.equal(locale('DE', {}, ready).currency, 'EUR')
  assert.equal(locale('AT', {}, ready).currency, 'EUR')
  assert.equal(locale('FR', {}, ready).currency, 'EUR')
  assert.equal(locale('CH', { 'accept-language': 'de-CH' }, ready).currency, 'CHF')
  assert.equal(locale('US', {}, ready).currency, 'CHF')
  // The saved language never changes the currency.
  assert.deepEqual(locale('DE', { cookie: 'lang=fr' }, ready), { country: 'DE', currency: 'EUR', lang: 'fr' })
  assert.deepEqual(locale('CH', { 'accept-language': 'de-CH,de;q=0.9' }), { country: 'CH', currency: 'CHF', lang: 'de' })
  assert.deepEqual(locale('CH', { 'accept-language': 'it-CH' }), { country: 'CH', currency: 'CHF', lang: 'fr' })
  assert.equal(currencyForCountry('LU'), 'CHF')
})

test('every bundle has consistent prices per currency, without conversion', async () => {
  for (const o of OFFERS) assert.deepEqual(pricedOffer(o, 'CHF'), { ...o, currency: 'CHF' })
  assert.equal(pricedOffer(OFFERS[0], 'EUR'), null)
  assert.equal(formatMoney(7, 'CHF', 'de'), 'CHF 7.–')
  assert.equal(formatMoney(24.95, 'CHF', 'fr'), 'CHF 24.95')
  assert.equal(savingsFor(pricedOffer(OFFERS[2], 'CHF')), 2)
  await withTestEur(() => {
    const eur = OFFERS.map((o) => pricedOffer(o, 'EUR'))
    assert.deepEqual(eur.map((o) => [o.price, o.compareAt]), [[4.5, 25.9], [7.9, undefined], [11.5, undefined]])
    assert.equal(savingsFor(eur[1]), 1.1)
    assert.equal(formatMoney(7.9, 'EUR', 'de').replace(/\s/g, ' '), '7,90 €')
    assert.equal(formatMoney(7.9, 'EUR', 'fr').replace(/\s/g, ' '), '7,90 €')
  })
})

const customer = { prenom: 'Lena', nom: 'Muster', email: 'lena@example.ch', tel: '079 123 45 67', adresse: 'Bahnhofstrasse 1', npa: '8001', ville: 'Zürich' }
const body = (extra = {}) => ({ offerId: 'pack-2', termsAccepted: true, customer, idempotencyKey: crypto.randomUUID(), ...extra })
const cfg = { enabled: true, images: { 'pack-1': 'https://x.ch/1.webp', 'pack-2': 'https://x.ch/2.png', 'pack-3': 'https://x.ch/3.png' } }

test('the server charges the currency it displays and refuses a stale one', async () => {
  const chf = prepareCheckout(body({ currency: 'CHF', total: 7, lang: 'de' }), cfg, { currency: 'CHF' })
  assert.equal(chf.status, 200)
  assert.deepEqual([chf.order.total, chf.order.currency, chf.order.lang], [7, 'CHF', 'de'])
  assert.deepEqual(prepareCheckout(body({ currency: 'EUR' }), cfg, { currency: 'CHF' }), { status: 409, error: 'currency_mismatch', currency: 'CHF' })
  assert.equal(prepareCheckout(body({ currency: 'CHF', total: 6 }), cfg, { currency: 'CHF' }).error, 'unsupported_cart')
  // EUR without approved payment links is never charged, even with prices.
  await withTestEur(() => {
    assert.equal(prepareCheckout(body({ currency: 'EUR' }), cfg, { currency: 'EUR' }).error, 'payment_unavailable')
    const order = validateOrder(body(), { currency: 'EUR' }).order
    assert.deepEqual([order.total, order.currency], [7.9, 'EUR'])
  })
  assert.equal(validateOrder(body(), { currency: 'EUR' }).errors.currency, 'Devise non disponible.')
  const url = new URL(buildEverflowUrl('pack-2', customer, 'https://x.ch/2.png', '', '', { currency: 'CHF', lang: 'de' }))
  assert.equal(url.searchParams.get('adv1'), 'Ariel All-in-1 PODS – 2 Beutel (120 Kapseln)')
  assert.equal(productLabel(OFFERS[0]), 'Ariel All-in-1 PODS – 1 sachet (60 capsules)')
  assert.throws(() => buildEverflowUrl('pack-2', customer, '', '', '', { currency: 'EUR' }), /unsupported_offer/)
})

test('the served page carries language, localized metadata and the visitor locale', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const de = injectLocale(html, { country: 'DE', currency: 'CHF', lang: 'de' }, 'https://destockage-suisse.store')
  assert.match(de, /<html lang="de"/)
  assert.match(de, /<title>Ariel All-in-1 PODS · Lagerabverkauf in der Schweiz<\/title>/)
  assert.match(de, /Beutel mit 60 Kapseln ab CHF 4\.–/)
  assert.match(de, /og:locale" content="de_DE"/)
  assert.match(de, /hreflang="de" href="https:\/\/destockage-suisse\.store\/\?lang=de"/)
  assert.match(de, /<script>window\.__GEO__=\{"country":"DE","currency":"CHF","lang":"de"\}<\/script>/)
  const fr = injectLocale(html, { country: '', currency: 'CHF', lang: 'fr' })
  assert.match(fr, /<html lang="fr-CH"/)
  assert.match(fr, /sachets de 60 capsules dès CHF 4\.–/)
  assert.doesNotMatch(fr, /hreflang/)
})

// ── Fichiers de traduction ──
function leaves(value, path = 'root', out = []) {
  if (typeof value === 'function') {
    // Argument utilisable comme nombre, texte ou fonction de rendu (lien, gras, exposant).
    const arg = Object.assign((s) => `[${s}]`, { toString: () => '2', valueOf: () => 2 })
    const sample = value(arg, arg, arg)
    return leaves(Array.isArray(sample) ? sample.filter((x) => typeof x === 'string') : sample, `${path}()`, out)
  }
  if (Array.isArray(value)) value.forEach((v, k) => leaves(v, `${path}[${k}]`, out))
  else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => leaves(v, `${path}.${k}`, out))
  else if (typeof value === 'string') out.push([path, value])
  return out
}

function shape(value) {
  if (value === null) return 'text' // texte absent volontairement (ex. pas de citation allemande en allemand)
  if (typeof value === 'function') return 'function'
  if (Array.isArray(value)) return value.map(shape)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape(value[k])]))
  return typeof value
}

test('German and French translation files have the same keys and no French left in German', async () => {
  const vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
  try {
    const fr = (await vite.ssrLoadModule('/src/i18n/fr.js')).default
    const de = (await vite.ssrLoadModule('/src/i18n/de.js')).default
    // Le texte d'une vidéo ou d'une politique fourni par le marchand peut être vide : seule la forme compte.
    const normalize = (s) => JSON.parse(JSON.stringify(s).replace(/"(string|undefined)"/g, '"text"'))
    assert.deepEqual(normalize(shape(de)), normalize(shape(fr)))
    // Restes de français : accents et mots-outils, hors nom de la boutique et textes du marchand.
    const allowed = /^root\.(logo|pages\.policies)\./
    const french = /[éèêàâùçœ]|\b(le|la|les|une|pour|avec|vous|votre|sachets?|livraison|panier|commande)\b/i
    const technical = (path, text) => /\.id$/.test(path) || /^[/#]/.test(text) // ancres, adresses et identifiants
    const leftovers = leaves(de).filter(([path, text]) => !allowed.test(path) && !technical(path, text) && french.test(text.replace(/Tox Info Suisse|Universal\+|All-in-1|Fleck-weg-Power/g, '')))
    assert.deepEqual(leftovers, [])
    assert.ok(leaves(fr).length > 300)
  } finally {
    await vite.close()
  }
})

test('GeoIP uses the address written by the local Nginx, never one a remote client sends', async () => {
  const { clientIp, countryForIp } = await import('./geoip.mjs')
  const viaNginx = (xff) => ({ socket: { remoteAddress: '127.0.0.1' }, headers: { 'x-forwarded-for': xff } })
  assert.equal(clientIp(viaNginx('81.169.145.105')), '81.169.145.105')
  // If a proxy ever appends instead of overwriting, only its own (last) value counts.
  assert.equal(clientIp(viaNginx('5.5.5.5, 81.169.145.105')), '81.169.145.105')
  assert.equal(clientIp({ socket: { remoteAddress: '::ffff:127.0.0.1' }, headers: { 'x-forwarded-for': '2a02:2e0::1' } }), '2a02:2e0::1')
  // A direct (non-local) connection: its X-Forwarded-For is ignored.
  assert.equal(clientIp({ socket: { remoteAddress: '::ffff:203.0.113.9' }, headers: { 'x-forwarded-for': '81.169.145.105' } }), '203.0.113.9')
  assert.equal(clientIp(viaNginx('not-an-ip')), '')
  const reader = { get: (ip) => ({ '81.169.145.105': { country: { iso_code: 'DE' } }, '1.2.3.4': { registered_country: { iso_code: 'FR' } } })[ip] || null }
  assert.equal(countryForIp(reader, '81.169.145.105'), 'DE')
  assert.equal(countryForIp(reader, '1.2.3.4'), 'FR')
  assert.equal(countryForIp(reader, '9.9.9.9'), '')
  assert.equal(countryForIp(null, '81.169.145.105'), '')
  // Without a configured header the database decides; spoofed country headers are still ignored.
  const req = { socket: { remoteAddress: '127.0.0.1' }, headers: { 'x-forwarded-for': '81.169.145.105', 'cf-ipcountry': 'FR', 'x-geo-country': 'FR' }, url: '/' }
  assert.equal(countryOf(req, {}, false, (r) => countryForIp(reader, clientIp(r))), 'DE')
  assert.deepEqual(localeOf(req, { env: {}, lookup: (r) => countryForIp(reader, clientIp(r)) }), { country: 'DE', currency: 'CHF', lang: 'de' })
})
