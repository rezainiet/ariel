// ─────────────────────────────────────────────────────────────
// Produit et offres — module SANS dépendance au navigateur ni à Vite :
// importé par l'interface ET par le serveur de commande (server/validate-order.mjs),
// qui recalcule toujours le prix à partir de l'identifiant d'offre.
// Les prix des bundles ne sont PAS un prix unitaire multiplié.
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
    price: 4,
    label: '1 SACHET',
    badge: null,
    featured: false,
    image: '/images/packshot.webp',
  },
  {
    id: 'pack-2',
    packs: 2,
    washes: 120,
    price: 7,
    label: '2 SACHETS',
    badge: 'LE PLUS POPULAIRE',
    featured: true,
    image: '/images/stacked.webp',
  },
  {
    id: 'pack-3',
    packs: 3,
    washes: 180,
    price: 10,
    label: '3 SACHETS',
    badge: 'MEILLEURE OFFRE',
    featured: false,
    image: '/images/stacked.webp',
  },
]

export const DEFAULT_OFFER_ID = 'pack-2'

export function getOffer(id) {
  return OFFERS.find((o) => o.id === id) || null
}

// Formatage monétaire suisse : « CHF 4.– », « CHF 3.50 ».
export function formatCHF(amount) {
  const whole = Number.isInteger(amount)
  const value = whole ? `${amount}.–` : amount.toFixed(2)
  return `CHF ${value}`
}

// ── Comparaisons de prix (calculées, jamais de prix de référence inventé) ──
// Référence = achat de sachets séparés au prix de l'offre 1 sachet.
export const SINGLE_PACK_PRICE = OFFERS[0].price

// Économie réelle vs. N sachets achetés séparément : 2 sachets -> 1, 3 sachets -> 2.
export function savingsFor(offer) {
  return offer.packs * SINGLE_PACK_PRICE - offer.price
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
