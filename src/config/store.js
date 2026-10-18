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

// ─────────────────────────────────────────────────────────────
// Identité du marchand (LCD art. 3 al. 1 let. s : raison sociale,
// adresse postale ET e-mail obligatoires). Aucune valeur n'est inventée :
// tant qu'un champ est vide, l'interface affiche « à fournir » en
// développement et l'omet en production (voir LAUNCH-CHECKLIST.md).
// ─────────────────────────────────────────────────────────────
export const MERCHANT = {
  legalName: env.VITE_MERCHANT_LEGAL_NAME || '', // raison sociale (registre du commerce)
  street: env.VITE_MERCHANT_STREET || '',
  zip: env.VITE_MERCHANT_ZIP || '',
  city: env.VITE_MERCHANT_CITY || '',
  uid: env.VITE_MERCHANT_UID || '', // numéro IDE, ex. CHE-123.456.789
  vatNote: env.VITE_MERCHANT_VAT_NOTE || '', // ex. « TVA incluse » si assujetti
  dispatchCity: env.VITE_DISPATCH_CITY || '', // ville réelle de l'entrepôt
  carrier: env.VITE_CARRIER || '', // ex. « La Poste (PostPac Economy) »
  clearanceReason: env.VITE_CLEARANCE_REASON || '', // raison RÉELLE du déstockage
}

// Moyens de paiement réellement activés chez le prestataire (liste séparée par des virgules).
// Valeurs reconnues : twint, visa, mastercard, amex, apple_pay, google_pay, postfinance, invoice.
// Vide = aucun moyen affiché comme actif.
export const PAYMENT_METHODS = (env.VITE_PAYMENT_METHODS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const PAYMENT_LABELS = {
  twint: 'TWINT',
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  postfinance: 'PostFinance',
  invoice: 'Facture',
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

// Formatage monétaire suisse : « CHF 4.– », « CHF 3.50 ».
export function formatCHF(amount) {
  const whole = Number.isInteger(amount)
  const value = whole ? `${amount}.–` : amount.toFixed(2)
  return `CHF ${value}`
}

// ── Comparaisons de prix (calculées, jamais de prix de référence inventé) ──
// Référence = achat de packs séparés au prix de l'offre 1 pack.
export const SINGLE_PACK_PRICE = OFFERS[0].price

// Économie réelle vs. N packs achetés séparément : 2 packs -> 1, 3 packs -> 2.
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
