// ─────────────────────────────────────────────────────────────
// Langue et devise de la boutique.
//  · Langue : choix manuel (localStorage + cookie, toujours prioritaire) › pays › navigateur › français.
//    Changer de langue est instantané (aucun rechargement) et ne touche jamais à la devise.
//  · Pays et devise : fournis par NOTRE serveur dans la page (window.__GEO__, server/geo.mjs).
//    Le navigateur ne choisit pas de devise : il n'affiche que celle que le serveur encaissera.
// ─────────────────────────────────────────────────────────────
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import fr from './fr.js'
import de from './de.js'
import { META } from './meta.js'
import { detectLang, isLang, normalizeCountry, LANG_STORAGE_KEY, LANG_COOKIE, DEFAULT_LANG } from './detect.js'
import { OFFERS, BASE_CURRENCY, getOffer, hasPrices, pricedOffer, formatMoney, savingsFor } from '../config/offers.js'

export const MESSAGES = { fr, de }

function readGeo() {
  const g = typeof window !== 'undefined' ? window.__GEO__ : null
  return {
    known: Boolean(g),
    country: normalizeCountry(g?.country),
    currency: hasPrices(g?.currency) ? g.currency : BASE_CURRENCY,
  }
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
    if (geo) setState((s) => ({ ...s, country: geo.country, currency: geo.currency }))
    return geo
  }, [])

  const value = useMemo(() => {
    const { lang, currency, country } = state
    const money = (amount) => formatMoney(amount, currency, lang)
    const offers = OFFERS.map((o) => pricedOffer(o, currency))
    return {
      lang,
      t: MESSAGES[lang],
      country,
      currency,
      setLang,
      syncCurrency,
      money,
      offers,
      // Offre avec les prix de la devise du visiteur (prix barré inclus).
      offer: (id) => pricedOffer(getOffer(id), currency),
      savings: (o) => savingsFor(o),
    }
  }, [state, setLang, syncCurrency])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

async function refreshLocale() {
  try {
    const res = await fetch('/api/locale', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return {
      known: true,
      country: normalizeCountry(data?.country),
      currency: hasPrices(data?.currency) ? data.currency : BASE_CURRENCY,
    }
  } catch {
    return null
  }
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>')
  return ctx
}
