// ─────────────────────────────────────────────────────────────
// Produit et offres — module SANS dépendance au navigateur ni à Vite :
// importé par l'interface ET par le serveur de commande (server/validate-order.mjs),
// qui recalcule toujours le prix à partir de l'identifiant d'offre.
// Les prix des bundles ne sont PAS un prix unitaire multiplié.
// compareAt : prix barré affiché sur les cartes d'offre (choix du marchand, à justifier :
// PBV art. 16 — prix pratiqué auparavant ou par la concurrence). Retirer la clé = plus de prix barré.
// ─────────────────────────────────────────────────────────────

import { currencyDigits } from './currencies.js'

export const PRODUCT = {
  id: 'ariel-all-in-1-pods',
  name: 'Ariel All-in-1 PODS',
  washesPerPack: 60,
  shortDesc: 'Capsules de lessive tout-en-un',
}

export const OFFERS = [
  {
    id: 'pack-1',
    packs: 1,
    washes: 60,
    price: 4,
    compareAt: 24.95,
    label: '1 SACHET',
    badge: null,
    featured: false,
    image: '/images/everflow/pack-1.webp',
  },
  {
    id: 'pack-2',
    packs: 2,
    washes: 120,
    price: 7,
    compareAt: 49.9,
    label: '2 SACHETS',
    badge: 'LE PLUS POPULAIRE',
    featured: true,
    image: '/images/everflow/pack-2.png',
  },
  {
    id: 'pack-3',
    packs: 3,
    washes: 180,
    price: 10,
    compareAt: 74.85,
    label: '3 SACHETS',
    badge: 'MEILLEURE OFFRE',
    featured: false,
    image: '/images/everflow/pack-3.png',
  },
]

export const DEFAULT_OFFER_ID = 'pack-2'

export function getOffer(id) {
  return OFFERS.find((o) => o.id === id) || null
}

// ── Prix par devise ──
// Uniquement des prix APPROUVÉS par le marchand : aucune conversion, aucun prix déduit d'un autre.
// Une devise n'est proposée que si CHAQUE offre y a un prix ; le serveur exige en plus un lien de
// paiement par offre dans cette devise (server/everflow.mjs) avant de l'afficher ou de l'encaisser.
// EUR : prix à fournir. Format attendu : { 'pack-1': { price, compareAt }, 'pack-2': …, 'pack-3': … }.
export const BASE_CURRENCY = 'CHF'
export const PRICES = {
  CHF: Object.fromEntries(OFFERS.map((o) => [o.id, { price: o.price, compareAt: o.compareAt }])),
  EUR: null,
}

// Devise souhaitée selon le pays du visiteur (jamais selon la langue choisie).
const COUNTRY_CURRENCY = { CH: 'CHF', DE: 'EUR', AT: 'EUR', FR: 'EUR' }
export const currencyForCountry = (country) => COUNTRY_CURRENCY[country] || BASE_CURRENCY

export const hasPrices = (currency) =>
  OFFERS.every((o) => Number(PRICES[currency]?.[o.id]?.price) > 0)

// Offre avec le prix (et le prix barré) de la devise demandée ; null si la devise n'est pas configurée.
export function pricedOffer(offer, currency = BASE_CURRENCY) {
  const p = offer && hasPrices(currency) ? PRICES[currency][offer.id] : null
  if (!p) return null
  const out = { ...offer, price: p.price, currency }
  if (p.compareAt) out.compareAt = p.compareAt
  else delete out.compareAt
  return out
}

// Formatage monétaire suisse : « CHF 4.– », « CHF 3.50 ».
export function formatCHF(amount) {
  const whole = Number.isInteger(amount)
  const value = whole ? `${amount}.–` : amount.toFixed(2)
  return `CHF ${value}`
}

// CHF garde la convention suisse dans les deux langues ; les autres devises suivent l'usage de la langue
// affichée (« 4,00 € », « 3,77 £GB », « 4,52 $ », « 745 ¥ »), avec les décimales usuelles de la devise.
const LOCALES = { fr: 'fr-FR', de: 'de-DE' }
export function formatMoney(amount, currency = BASE_CURRENCY, lang = 'fr') {
  if (currency === 'CHF') return formatCHF(amount)
  return new Intl.NumberFormat(LOCALES[lang] || 'fr-FR', moneyOptions(currency)).format(amount)
}

const moneyOptions = (currency) => {
  const digits = currencyDigits(currency)
  return { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }
}

// Montant découpé pour l'affiche des offres : chiffres et symbole séparés (« 4,24 » + « € »).
export function moneyParts(amount, currency = BASE_CURRENCY, lang = 'fr') {
  if (currency === 'CHF') return { number: Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace('.', ','), unit: 'CHF' }
  const parts = new Intl.NumberFormat(LOCALES[lang] || 'fr-FR', moneyOptions(currency)).formatToParts(amount)
  return {
    number: parts.filter((p) => p.type !== 'currency' && p.type !== 'literal').map((p) => p.value).join(''),
    unit: parts.find((p) => p.type === 'currency')?.value || currency,
  }
}

// ── Comparaisons de prix (calculées, jamais de prix de référence inventé) ──
// Référence = achat de sachets séparés au prix de l'offre 1 sachet.
export const SINGLE_PACK_PRICE = OFFERS[0].price

// Économie réelle vs. N sachets achetés séparément : 2 sachets -> 1, 3 sachets -> 3.
// Calculée dans la devise de l'offre (offre issue de pricedOffer), jamais en mélangeant deux devises.
export function savingsFor(offer) {
  const single = offer.currency ? PRICES[offer.currency][OFFERS[0].id].price : SINGLE_PACK_PRICE
  return Math.round((offer.packs * single - offer.price) * 100) / 100
}

export function pricePerPack(offer) {
  return offer.price / offer.packs
}

// Prix unitaire par capsule (convention suisse « 0.86/pièce »), arrondi au centime.
export function pricePerCapsule(offer) {
  return Math.round((offer.price / (offer.packs * PRODUCT.washesPerPack)) * 100) / 100
}

// Prix par lavage en centimes, arrondi à 0.1 ct (ex. 6.7 ct).
export function centsPerWash(offer) {
  return Math.round((offer.price / offer.washes) * 1000) / 10
}
