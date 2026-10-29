// ─────────────────────────────────────────────────────────────
// Produit et offres — module SANS dépendance au navigateur ni à Vite :
// importé par l'interface ET par le serveur de commande (server/validate-order.mjs),
// qui recalcule toujours le prix à partir de l'identifiant d'offre.
// Les prix des bundles ne sont PAS un prix unitaire multiplié.
// compareAt : prix barré affiché sur les cartes d'offre (choix du marchand, à justifier :
// PBV art. 16 — prix pratiqué auparavant ou par la concurrence). Retirer la clé = plus de prix barré.
// ─────────────────────────────────────────────────────────────

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
    price: 9,
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
    price: 15,
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
    price: 20,
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

// ── Prix ──
// Boutique suisse : CHF UNIQUEMENT, quels que soient le pays du visiteur et la langue choisie.
// Aucune conversion, aucune autre devise (les prix en EUR relèvent de la boutique Déstockage Europe).
export const BASE_CURRENCY = 'CHF'
export const PRICES = {
  CHF: Object.fromEntries(OFFERS.map((o) => [o.id, { price: o.price, compareAt: o.compareAt }])),
}

export const currencyForCountry = () => BASE_CURRENCY

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

// CHF garde la convention suisse dans les deux langues ; EUR suit l'usage du pays de la langue (« 4,00 € »).
const EUR_LOCALES = { fr: 'fr-FR', de: 'de-DE' }
export function formatMoney(amount, currency = BASE_CURRENCY, lang = 'fr') {
  if (currency === 'CHF') return formatCHF(amount)
  return new Intl.NumberFormat(EUR_LOCALES[lang] || 'fr-FR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
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
