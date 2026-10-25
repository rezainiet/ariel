// ─────────────────────────────────────────────────────────────
// Pays, langue et devise du visiteur — déterminés CÔTÉ SERVEUR.
//  · Pays : base GeoIP2 lue par ce serveur à partir de l'adresse écrite par notre Nginx (server/geoip.mjs).
//    Ou, si GEO_COUNTRY_HEADER est défini, l'en-tête pays écrit par notre propre proxy ou CDN
//    (ex. « x-geo-country », « cf-ipcountry ») ; aucun autre en-tête client n'est jamais lu.
//  · Langue initiale : choix enregistré (cookie « lang »), sinon pays, sinon Accept-Language, sinon français.
//    Le navigateur applique ensuite le choix enregistré dans localStorage, toujours prioritaire.
//  · Devise : selon le pays, seulement si elle est configurée de bout en bout (prix + liens de paiement) ;
//    sinon CHF. Recalculée à chaque commande : le montant encaissé est celui affiché.
// Rien n'est conservé : ni l'adresse IP ni le pays.
// ─────────────────────────────────────────────────────────────
import { BASE_CURRENCY, currencyForCountry, formatMoney, OFFERS, pricedOffer } from '../src/config/offers.js'
import { detectLang, isLang, normalizeCountry, parseAcceptLanguage, LANG_COOKIE } from '../src/i18n/detect.js'
import { META } from '../src/i18n/meta.js'
import { currencyReady } from './everflow.mjs'

const DEV_COOKIE = 'dev_geo'

function cookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) {
      try { return decodeURIComponent(v.join('=')) } catch { return '' }
    }
  }
  return ''
}

// Test local uniquement (NODE_ENV=development, requête locale, GEO_DEV_OVERRIDE=true) :
// « ?geo=DE » simule un pays et reste mémorisé dans un cookie pour les appels d'API suivants.
export function devCountry(req, env = process.env, local = false) {
  if (env.NODE_ENV !== 'development' || env.GEO_DEV_OVERRIDE !== 'true' || !local) return null
  const fromQuery = new URL(req.url, 'http://x').searchParams.get('geo')
  if (fromQuery !== null) return { country: normalizeCountry(fromQuery), set: true }
  return { country: normalizeCountry(cookie(req, DEV_COOKIE)), set: false }
}

// lookup(req) : pays issu de la base GeoIP2 (server/geoip.mjs), utilisé sans en-tête configuré.
export function countryOf(req, env = process.env, local = false, lookup = null) {
  const dev = devCountry(req, env, local)
  if (dev) return dev.country
  const header = String(env.GEO_COUNTRY_HEADER || '').trim().toLowerCase()
  if (!header) return normalizeCountry(lookup ? lookup(req) : '')
  const value = req.headers[header]
  return normalizeCountry(Array.isArray(value) ? value[0] : value)
}

// canCharge(currency) : prix et liens approuvés existent ET le paiement actif peut encaisser cette devise.
export function localeOf(req, { env = process.env, local = false, canCharge = currencyReady, lookup = null } = {}) {
  const country = countryOf(req, env, local, lookup)
  const wanted = currencyForCountry(country)
  const currency = wanted !== BASE_CURRENCY && canCharge(wanted) ? wanted : BASE_CURRENCY
  const stored = cookie(req, LANG_COOKIE)
  const lang = detectLang({ stored: isLang(stored) ? stored : null, country, languages: parseAcceptLanguage(req.headers['accept-language']) })
  return { country, currency, lang }
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function entryPrice(currency, lang) {
  const min = Math.min(...OFFERS.map((o) => pricedOffer(o, currency)?.price ?? Infinity))
  return formatMoney(min, currency, lang)
}

// Écrit la langue, les métadonnées et le pays/la devise dans index.html avant l'envoi :
// la première image est déjà dans la bonne langue, sans requête supplémentaire ni changement visible.
export function injectLocale(html, { country, currency, lang }, origin = '') {
  const meta = META[lang] || META.fr
  const from = entryPrice(currency, lang)
  const geo = JSON.stringify({ country, currency, lang }).replace(/</g, '\\u003c')
  const alternates = origin
    ? ['fr', 'de'].map((l) => `<link rel="alternate" hreflang="${l}" href="${escapeHtml(`${origin}/?lang=${l}`)}" />`).join('\n    ') +
      `\n    <link rel="alternate" hreflang="x-default" href="${escapeHtml(`${origin}/`)}" />`
    : ''
  return html
    .replace(/<html lang="[^"]*"/, `<html lang="${meta.htmlLang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.description(from))}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${meta.ogLocale}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(meta.title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${escapeHtml(meta.ogDescription(from))}$2`)
    .replace('</head>', `  ${alternates}\n    <script>window.__GEO__=${geo}</script>\n  </head>`)
}

// Cookie du test local (« ?geo= ») : jamais en production.
export function devCookieHeader(req, env = process.env, local = false) {
  const dev = devCountry(req, env, local)
  if (!dev?.set) return null
  return `${DEV_COOKIE}=${encodeURIComponent(dev.country)}; Path=/; SameSite=Lax; Max-Age=${dev.country ? 86400 : 0}`
}
