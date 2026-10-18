// ─────────────────────────────────────────────────────────────
// Source unique de vérité : offres, prix, livraison, boutique.
// Toute la logique de quantité / prix passe par ce fichier.
// Les prix des bundles ne sont PAS un prix unitaire multiplié.
// ─────────────────────────────────────────────────────────────

const env = import.meta.env

export const STORE = {
  // Nom provisoire tant que l'identité légale n'est pas confirmée.
  name: env.VITE_STORE_NAME || 'NOM DE LA BOUTIQUE',
  supportEmail: env.VITE_SUPPORT_EMAIL || '',
  supportPhone: env.VITE_SUPPORT_PHONE || '',
  currency: 'CHF',
  locale: 'fr-CH',
}

// Informations logistiques — configurables, à confirmer avant mise en ligne.
export const DELIVERY = {
  dispatchLocation: env.VITE_DISPATCH_LOCATION || 'Suisse',
  estimateDays: Number(env.VITE_DELIVERY_ESTIMATE_DAYS || 3),
  free: true,
  returnWindowDays: 15,
}

// Produit (d'après le packaging fourni — à vérifier sur l'emballage réel).
export const PRODUCT = {
  id: 'ariel-all-in-1-pods',
  name: 'Ariel All-in-1 PODS',
  washesPerPack: 60,
  shortDesc: 'Capsules de lessive tout-en-un',
}

// Les trois offres. Prix de bundle fixes (déstockage), pas un multiple.
// `image` : visuel réel associé (1 pack = packshot, multi = packs empilés).
export const OFFERS = [
  {
    id: 'pack-1',
    packs: 1,
    washes: 60,
    price: 4,
    label: '1 PACK',
    badge: null,
    featured: false,
    image: '/images/packshot.webp',
  },
  {
    id: 'pack-2',
    packs: 2,
    washes: 120,
    price: 7,
    label: '2 PACKS',
    badge: 'LE PLUS POPULAIRE',
    featured: true,
    image: '/images/stacked.webp',
  },
  {
    id: 'pack-3',
    packs: 3,
    washes: 180,
    price: 10,
    label: '3 PACKS',
    badge: 'MEILLEUR RAPPORT QUALITÉ-PRIX',
    featured: false,
    image: '/images/stacked.webp',
  },
]

export const DEFAULT_OFFER_ID = 'pack-2'

export function getOffer(id) {
  return OFFERS.find((o) => o.id === id) || null
}

// Formatage monétaire suisse : « CHF 4.– », « CHF 7.– ».
export function formatCHF(amount) {
  const whole = Number.isInteger(amount)
  const value = whole ? `${amount}.–` : amount.toFixed(2).replace('.', ',')
  return `CHF ${value}`
}
