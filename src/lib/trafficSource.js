// ─────────────────────────────────────────────────────────────
// Provenance des visiteurs (Meta, Snapchat, Google…) — module PARTAGÉ navigateur / serveur.
// Le navigateur classe l'arrivée (paramètres d'URL + site référent) et garde la dernière
// provenance publicitaire 30 jours (stockage local, première partie).
// Le serveur ne fait confiance à rien : il re-nettoie la provenance reçue avec la commande.
// Les identifiants de clic Meta et Snapchat sont conservés après consentement
// pour les remettre à Everflow au paiement. Les autres ne sont pas conservés.
// Avant la réponse au bandeau, l'identifiant attend dans l'onglet (sessionStorage) : il survit
// aux changements de page et aux rechargements, n'est transmis à personne, et disparaît au refus.
// ─────────────────────────────────────────────────────────────

export const CHANNELS = ['meta', 'snapchat', 'google', 'other', 'direct']
export const CHANNEL_LABELS = { meta: 'Meta', snapchat: 'Snapchat', google: 'Google', other: 'Autre', direct: 'Direct' }

const KEY = 'traffic-source.v1'
const PENDING_KEY = 'ad-click.pending.v1'
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const FBCLID_RE = /^[A-Za-z0-9._-]{1,500}$/
const SCCID_RE = /^[A-Za-z0-9_-]{1,500}$/
const consentChoice = () => {
  try { return localStorage.getItem('consent.marketing.v1') } catch { return null }
}
const marketingAllowed = () => consentChoice() === 'granted'

// Identifiant du dernier clic publicitaire en attente de consentement : { fbclid } ou { sccid }.
let pending = null
const readPending = () => {
  if (pending) return pending
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null') || {} } catch { return {} }
}
const writePending = (value) => {
  pending = value
  try { value ? sessionStorage.setItem(PENDING_KEY, JSON.stringify(value)) : sessionStorage.removeItem(PENDING_KEY) } catch { /* mémoire de la page seulement */ }
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

// Rechargement ou retour arrière/avant : le navigateur répète le site référent d'origine.
const revisit = () => {
  try { return ['reload', 'back_forward'].includes(performance.getEntriesByType('navigation')[0]?.type) } catch { return false }
}

// À l'arrivée sur le site : une provenance publicitaire remplace la précédente (dernier clic) ;
// une visite directe ou interne ne l'efface pas, ni la même visite qui continue : rechargement,
// retour arrière, ou même site référent sans nouvel identifiant de clic ni campagne.
export function captureTrafficSource() {
  if (typeof window === 'undefined') return
  const touch = {
    ...classify(new URLSearchParams(window.location.search), document.referrer, window.location.hostname),
    landingPath: text(window.location.pathname, 120),
    at: new Date().toISOString(),
  }
  const saved = read()
  const referrerOnly = !touch.clickIdType && !touch.utmSource
  const sameVisit = touch.channel === 'direct' ||
    (referrerOnly && (revisit() || (saved?.last?.channel === touch.channel && saved.last.referrerHost === touch.referrerHost)))
  if (!saved || !sameVisit) {
    const params = new URLSearchParams(window.location.search)
    const fbclid = params.get('fbclid') || ''
    const sccid = params.get('ScCid') || params.get('sccid') || ''
    const click = touch.clickIdType === 'fbclid' && FBCLID_RE.test(fbclid) ? { fbclid }
      : ['ScCid', 'sccid'].includes(touch.clickIdType) && SCCID_RE.test(sccid) ? { sccid } : null
    if (click) {
      const choice = consentChoice()
      if (choice === 'granted') Object.assign(touch, click)
      else if (!choice) writePending({ ...click, at: touch.at }) // pas encore de réponse au bandeau
    }
    try {
      localStorage.setItem(KEY, JSON.stringify({ first: saved?.first || touch, last: touch }))
    } catch { /* stockage indisponible : la commande sera classée « direct » */ }
  }
  // Réponse donnée entre-temps (autre onglet, page précédente) : l'identifiant en attente est rangé ou effacé.
  const choice = consentChoice()
  if (choice === 'granted') {
    commitMetaClickId()
    commitSnapClickId()
  } else if (choice === 'denied') discardPendingClickIds()
}

export function getTrafficSource() {
  const saved = read()
  return saved ? { first: saved.first, last: saved.last } : { first: null, last: null }
}

export function getMetaClickId() {
  const last = read()?.last
  return marketingAllowed() && last?.channel === 'meta' && last.clickIdType === 'fbclid' && FBCLID_RE.test(last.fbclid || '') ? last.fbclid : ''
}

export function getSnapClickId() {
  const last = read()?.last
  return marketingAllowed() && last?.channel === 'snapchat' && ['ScCid', 'sccid'].includes(last.clickIdType) && SCCID_RE.test(last.sccid || '') ? last.sccid : ''
}

// Consentement donné (sur n'importe quelle page) : l'identifiant en attente rejoint la provenance
// s'il appartient toujours au dernier clic publicitaire (même arrivée, même horodatage).
function commit(field, channel, types) {
  const waiting = readPending()
  const id = waiting[field]
  if (!marketingAllowed() || !id) return
  const saved = read()
  if (saved?.last?.channel === channel && types.includes(saved.last.clickIdType) && (!waiting.at || waiting.at === saved.last.at)) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...saved, last: { ...saved.last, [field]: id } })) } catch { /* storage unavailable */ }
  }
  writePending(null)
}

export const commitMetaClickId = () => commit('fbclid', 'meta', ['fbclid'])
export const commitSnapClickId = () => commit('sccid', 'snapchat', ['ScCid', 'sccid'])

// Refus : l'identifiant en attente est effacé.
export const discardPendingClickIds = () => writePending(null)
