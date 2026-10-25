// ─────────────────────────────────────────────────────────────
// Langue et devise de la boutique.
//  · Langue : choix manuel (localStorage + cookie, toujours prioritaire) › pays › navigateur › français.
//    Changer de langue est instantané (aucun rechargement) et ne touche jamais à la devise.
//  · Pays et devises : fournis par NOTRE serveur dans la page (window.__GEO__, server/geo.mjs).
//    `currency` = devise ENCAISSÉE (CHF, liens approuvés) ; `display` = monnaie du pays du visiteur, au
//    taux BCE. Quand elles diffèrent, chaque montant local est une estimation (« ≈ ») et le montant
//    débité en CHF est toujours affiché à côté. Le navigateur ne choisit aucune devise lui-même.
// ─────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import fr from './fr.js'
import de from './de.js'
import { META } from './meta.js'
import { detectLang, isLang, normalizeCountry, LANG_STORAGE_KEY, LANG_COOKIE, DEFAULT_LANG } from './detect.js'
import { OFFERS, BASE_CURRENCY, getOffer, hasPrices, pricedOffer, formatMoney, moneyParts, savingsFor } from '../config/offers.js'
import { ECB_CURRENCIES, convert } from '../config/currencies.js'

export const MESSAGES = { fr, de }

// Devise affichée envoyée par le serveur ; toute valeur inattendue retombe sur la devise encaissée.
function readDisplay(d, currency) {
  const ok = d && d.estimated === true && ECB_CURRENCIES.includes(d.currency) && d.currency !== currency &&
    Number.isFinite(d.rate) && d.rate > 0 && /^\d{4}-\d{2}-\d{2}$/.test(d.date || '')
  return ok ? { currency: d.currency, rate: d.rate, date: d.date, estimated: true } : { currency, rate: 1, date: null, estimated: false }
}

function fromServer(g) {
  const currency = hasPrices(g?.currency) ? g.currency : BASE_CURRENCY
  return { country: normalizeCountry(g?.country), currency, display: readDisplay(g?.display, currency) }
}

function readGeo() {
  const g = typeof window !== 'undefined' ? window.__GEO__ : null
  return { known: Boolean(g), ...fromServer(g) }
}

function readStoredLang() {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY)
    return isLang(v) ? v : null
  } catch {
    return null
  }
}

function storeLang(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang)
  } catch {
    /* stockage indisponible : le cookie suffit */
  }
  // Le cookie permet au serveur de servir directement la bonne langue au retour du visiteur.
  document.cookie = `${LANG_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}

// « ?lang=de » (liens de campagne, hreflang) vaut choix explicite, puis disparaît de l'adresse.
function readUrlLang() {
  try {
    const url = new URL(window.location.href)
    const lang = url.searchParams.get('lang')
    if (!isLang(lang)) return null
    url.searchParams.delete('lang')
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    return lang
  } catch {
    return null
  }
}

function initialState() {
  const geo = readGeo()
  const fromUrl = readUrlLang()
  if (fromUrl) storeLang(fromUrl)
  const stored = fromUrl || readStoredLang()
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  return { ...geo, lang: detectLang({ stored, country: geo.country, languages }), manual: Boolean(stored) }
}

function setMeta(selector, value) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute('content', value)
}

// Langue du document et métadonnées (onglet, partage, lecteurs d'écran).
function applyDocument(lang, currency) {
  const meta = META[lang] || META[DEFAULT_LANG]
  const min = Math.min(...OFFERS.map((o) => pricedOffer(o, currency).price))
  const from = formatMoney(min, currency, lang)
  document.documentElement.lang = meta.htmlLang
  document.title = meta.title
  setMeta('meta[name="description"]', meta.description(from))
  setMeta('meta[property="og:title"]', meta.title)
  setMeta('meta[property="og:description"]', meta.ogDescription(from))
  setMeta('meta[property="og:locale"]', meta.ogLocale)
}

// Appliqué AVANT le premier rendu React (src/main.jsx) : aucune image dans la mauvaise langue.
let boot = null
export function bootLocale() {
  boot = initialState()
  applyDocument(boot.lang, boot.currency)
  return boot
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [state, setState] = useState(() => boot || bootLocale())

  // Page non servie par notre serveur (développement Vite) : le pays et la devise sont demandés à l'API.
  useEffect(() => {
    if (state.known) return
    let alive = true
    refreshLocale().then((geo) => {
      if (!alive || !geo) return
      setState((s) => ({
        ...s,
        ...geo,
        lang: s.manual ? s.lang : detectLang({ country: geo.country, languages: navigator.languages || [] }),
      }))
    })
    return () => {
      alive = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyDocument(state.lang, state.currency)
  }, [state.lang, state.currency])

  const setLang = useCallback((lang) => {
    if (!isLang(lang)) return
    storeLang(lang)
    setState((s) => ({ ...s, lang, manual: true }))
  }, [])

  // Le serveur a refusé une commande dans une devise périmée : on reprend la sienne.
  const syncCurrency = useCallback(async () => {
    const geo = await refreshLocale()
    if (geo) setState((s) => ({ ...s, country: geo.country, currency: geo.currency, display: geo.display }))
    return geo
  }, [])

  const value = useMemo(() => {
    const { lang, currency, country, display } = state
    const money = (amount) => formatMoney(amount, currency, lang)
    const offers = OFFERS.map((o) => pricedOffer(o, currency))
    const estimated = display.estimated
    // Valeur locale arrondie aux décimales de la devise : base unique de tous les montants locaux affichés.
    const localValue = (amount) => (estimated ? convert(amount, display.rate, display.currency) : amount)
    const local = (amount) => (estimated ? `≈ ${formatMoney(localValue(amount), display.currency, lang)}` : money(amount))
    const single = offers[0]
    return {
      lang,
      t: MESSAGES[lang],
      country,
      // Devise encaissée (validation serveur, suivi publicitaire, total du bouton d'achat).
      currency,
      // Devise affichée ; `estimated` : montants locaux indicatifs, débit en `currency`.
      display,
      estimated,
      setLang,
      syncCurrency,
      // Montant réellement débité.
      money,
      // Montant pour le visiteur : estimation locale « ≈ 4,24 € », ou le montant débité s'il n'y a pas de conversion.
      local,
      localParts: (amount) => moneyParts(localValue(amount), display.currency, lang),
      localPlain: (amount) => formatMoney(localValue(amount), display.currency, lang),
      // Montant DÉJÀ en monnaie locale (ex. économie issue de localSavings) : mise en forme seulement.
      localAmount: (value) => (estimated ? `≈ ${formatMoney(value, display.currency, lang)}` : money(value)),
      // Mention complète (taux, date, devise débitée) à placer près des totaux estimés.
      priceNote: estimated
        ? MESSAGES[lang].price.note(display.currency, currency, `1 ${currency} = ${formatMoney(display.rate, display.currency, lang)}`,
          new Date(`${display.date}T12:00:00Z`).toLocaleDateString(lang === 'de' ? 'de-CH' : 'fr-CH', { day: 'numeric', month: 'long', year: 'numeric' }))
        : '',
      offers,
      // Offre avec les prix de la devise encaissée (prix barré inclus).
      offer: (id) => pricedOffer(getOffer(id), currency),
      savings: (o) => savingsFor(o),
      // Économie en monnaie locale, calculée sur les montants locaux arrondis : l'affichage reste exact.
      localSavings: (o) => (estimated
        ? convert(o.packs * localValue(single.price) - localValue(o.price), 1, display.currency)
        : savingsFor(o)),
    }
  }, [state, setLang, syncCurrency])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

async function refreshLocale() {
  try {
    const res = await fetch('/api/locale', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return { known: true, ...fromServer(data) }

  } catch {
    return null
  }
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>')
  return ctx
}
