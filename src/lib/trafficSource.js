// ─────────────────────────────────────────────────────────────
// Provenance des visiteurs (Meta, Snapchat, Google…) — module PARTAGÉ navigateur / serveur.
// Le navigateur classe l'arrivée (paramètres d'URL + site référent) et garde la dernière
// provenance publicitaire 30 jours (stockage local, première partie).
// Le serveur ne fait confiance à rien : il re-nettoie la provenance reçue avec la commande.
// Le fbclid Meta est conservé localement pour le remettre à Everflow au paiement.
// Les autres identifiants de clic ne sont pas conservés.
// ─────────────────────────────────────────────────────────────

export const CHANNELS = ['meta', 'snapchat', 'google', 'other', 'direct']
export const CHANNEL_LABELS = { meta: 'Meta', snapchat: 'Snapchat', google: 'Google', other: 'Autre', direct: 'Direct' }

const KEY = 'traffic-source.v1'
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const FBCLID_RE = /^[A-Za-z0-9_-]{1,500}$/
let pendingFbclid = ''
const marketingAllowed = () => {
  try { return localStorage.getItem('consent.marketing.v1') === 'granted' } catch { return false }
}

// Identifiant de clic publicitaire → canal.
const CLICK_IDS = [
  ['fbclid', 'meta'],
  ['ScCid', 'snapchat'],
  ['sccid', 'snapchat'],
  ['gclid', 'google'],
  ['gbraid', 'google'],
  ['wbraid', 'google'],
  ['gad_source', 'google'],
]
const SOURCE_RULES = [
  [/^(facebook|fb|meta|instagram|ig|messenger|an)$|facebook|instagram/i, 'meta'],
  [/snap/i, 'snapchat'],
  [/google|adwords|youtube/i, 'google'],
]
const REFERRER_RULES = [
  [/(^|\.)(facebook|fb|instagram|messenger)\.com$|(^|\.)fb\.me$/i, 'meta'],
  [/(^|\.)snapchat\.com$/i, 'snapchat'],
  [/(^|\.)google\.[a-z.]+$|(^|\.)youtube\.com$|(^|\.)googleadservices\.com$/i, 'google'],
]

const TEXT_RE = /[^\p{L}\p{N} ._:/+@-]/gu
const text = (v, max = 80) => String(v ?? '').replace(TEXT_RE, '').trim().slice(0, max)

// Classe une arrivée. params : URLSearchParams ; referrer : URL complète ou ''.
export function classify(params, referrer = '', ownHost = '') {
  const utm = {
    utmSource: text(params.get('utm_source')),
    utmMedium: text(params.get('utm_medium')),
    utmCampaign: text(params.get('utm_campaign'), 120),
  }
  let referrerHost = ''
  try {
    referrerHost = referrer ? new URL(referrer).hostname.toLowerCase() : ''
  } catch { /* référent illisible */ }
  if (referrerHost && ownHost && referrerHost === ownHost.toLowerCase()) referrerHost = ''

  const click = CLICK_IDS.find(([p]) => params.get(p))
  let channel = click?.[1]
  if (!channel && utm.utmSource) channel = SOURCE_RULES.find(([re]) => re.test(utm.utmSource))?.[1] || 'other'
  if (!channel && referrerHost) channel = REFERRER_RULES.find(([re]) => re.test(referrerHost))?.[1] || 'other'
  return { channel: channel || 'direct', ...utm, clickIdType: click?.[0] || '', referrerHost: text(referrerHost, 120) }
}

// Nettoyage d'une provenance reçue (serveur) : seules des valeurs connues et courtes passent.
export function sanitizeSource(input) {
  const pick = (t) => {
    if (!t || typeof t !== 'object' || !CHANNELS.includes(t.channel)) return null
    const at = Date.parse(t.at)
    return {
      channel: t.channel,
      utmSource: text(t.utmSource),
      utmMedium: text(t.utmMedium),
      utmCampaign: text(t.utmCampaign, 120),
      clickIdType: CLICK_IDS.some(([p]) => p === t.clickIdType) ? t.clickIdType : '',
      referrerHost: text(t.referrerHost, 120),
      landingPath: text(t.landingPath, 120),
      at: Number.isFinite(at) ? new Date(at).toISOString() : null,
    }
  }
  const last = pick(input?.last)
  return { channel: last?.channel || 'direct', first: pick(input?.first), last }
}

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && Date.now() - Date.parse(saved.last?.at) < WINDOW_MS) return saved
  } catch { /* stockage indisponible */ }
  return null
}

// À l'arrivée sur le site : une provenance publicitaire remplace la précédente (dernier clic) ;
// une visite directe ou interne ne l'efface pas.
export function captureTrafficSource() {
  if (typeof window === 'undefined') return
  const touch = {
    ...classify(new URLSearchParams(window.location.search), document.referrer, window.location.hostname),
    landingPath: text(window.location.pathname, 120),
    at: new Date().toISOString(),
  }
  const fbclid = new URLSearchParams(window.location.search).get('fbclid') || ''
  if (touch.clickIdType === 'fbclid' && FBCLID_RE.test(fbclid)) {
    pendingFbclid = fbclid
    if (marketingAllowed()) touch.fbclid = fbclid
  }
  const saved = read()
  if (saved && touch.channel === 'direct') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ first: saved?.first || touch, last: touch }))
  } catch { /* stockage indisponible : la commande sera classée « direct » */ }
}

export function getTrafficSource() {
  const saved = read()
  return saved ? { first: saved.first, last: saved.last } : { first: null, last: null }
}

export function getMetaClickId() {
  const last = read()?.last
  return marketingAllowed() && last?.channel === 'meta' && last.clickIdType === 'fbclid' && FBCLID_RE.test(last.fbclid || '') ? last.fbclid : ''
}

export function commitMetaClickId() {
  if (!marketingAllowed() || !pendingFbclid) return
  const saved = read()
  if (saved?.last?.channel === 'meta' && saved.last.clickIdType === 'fbclid') {
    try { localStorage.setItem(KEY, JSON.stringify({ ...saved, last: { ...saved.last, fbclid: pendingFbclid } })) } catch { /* storage unavailable */ }
  }
  pendingFbclid = ''
}
