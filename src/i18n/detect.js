// ─────────────────────────────────────────────────────────────
// Choix de la langue — module pur, partagé par le navigateur et le serveur (server/geo.mjs).
// Ordre : 1. choix manuel du visiteur (toujours prioritaire) · 2. pays (DE/AT → allemand, FR → français,
// GB/IE → anglais) · 3. langue préférée du navigateur (français, allemand ou anglais) · 4. français.
// La Suisse et les autres pays passent par la préférence du navigateur.
// La devise ne dépend jamais de la langue : voir currencyForCountry (src/config/offers.js).
// ─────────────────────────────────────────────────────────────

export const LANGS = ['fr', 'de', 'en']
export const DEFAULT_LANG = 'fr'
export const LANG_STORAGE_KEY = 'lang.v1'
export const LANG_COOKIE = 'lang'

const COUNTRY_LANG = { DE: 'de', AT: 'de', FR: 'fr', GB: 'en', IE: 'en' }

export const isLang = (value) => LANGS.includes(value)

// Code pays ISO 3166-1 alpha-2 ; « XX », « T1 » (Tor) et les valeurs inconnues ne comptent pas.
export const normalizeCountry = (value) => {
  const c = String(value || '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(c) && c !== 'XX' ? c : ''
}

// Première langue du navigateur que la boutique propose (« de-CH » → « de »).
export function langFromBrowser(languages = []) {
  for (const tag of languages) {
    const primary = String(tag || '').trim().toLowerCase().split(/[-_;]/)[0]
    if (isLang(primary)) return primary
  }
  return null
}

// En-tête Accept-Language → liste triée par préférence (q décroissant).
export function parseAcceptLanguage(header = '') {
  return String(header)
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      return { tag, q: q ? Number(q.slice(2)) : 1, index }
    })
    .filter((l) => l.tag && l.tag !== '*' && l.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((l) => l.tag)
}

export function detectLang({ stored, country, languages } = {}) {
  if (isLang(stored)) return stored
  const byCountry = COUNTRY_LANG[normalizeCountry(country)]
  if (byCountry) return byCountry
  return langFromBrowser(languages) || DEFAULT_LANG
}
