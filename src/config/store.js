// ─────────────────────────────────────────────────────────────
// Source unique de vérité : offres, prix, livraison, boutique.
// Toute la logique de quantité / prix passe par ce fichier.
// Les prix des bundles ne sont PAS un prix unitaire multiplié.
// ─────────────────────────────────────────────────────────────


export const STORE = {
  // Nom commercial réel (obligatoire avant la mise en ligne). Vide = aucun nom inventé :
  // l'en-tête affiche alors un libellé descriptif neutre et les textes disent « notre boutique ».
  name: import.meta.env.VITE_STORE_NAME || '',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || '',
  supportPhone: import.meta.env.VITE_SUPPORT_PHONE || '',
  currency: 'CHF',
  locale: 'fr-CH',
}

// Informations logistiques — configurables, à confirmer avant mise en ligne.
// Seules la gratuité en Suisse et le délai de retour de 15 jours sont confirmés.
// Délai de livraison et lieu d'expédition : affichés UNIQUEMENT s'ils sont configurés.
export const DELIVERY = {
  dispatchLocation: import.meta.env.VITE_DISPATCH_LOCATION || '',
  estimateDays: Number(import.meta.env.VITE_DELIVERY_ESTIMATE_DAYS) > 0 ? Number(import.meta.env.VITE_DELIVERY_ESTIMATE_DAYS) : null,
  free: true,
  returnWindowDays: 15,
}

// Désignation dans les phrases quand aucun nom commercial n'est configuré.
export const storeRef = (capital = false) => STORE.name || (capital ? 'Notre boutique' : 'notre boutique')

// ─────────────────────────────────────────────────────────────
// Identité du marchand (LCD art. 3 al. 1 let. s : raison sociale,
// adresse postale ET e-mail obligatoires). Aucune valeur n'est inventée :
// tant qu'un champ est vide, l'interface affiche « à fournir » en
// développement et l'omet en production (voir LAUNCH-CHECKLIST.md).
// ─────────────────────────────────────────────────────────────
export const MERCHANT = {
  legalName: import.meta.env.VITE_MERCHANT_LEGAL_NAME || '', // raison sociale (registre du commerce)
  street: import.meta.env.VITE_MERCHANT_STREET || '',
  zip: import.meta.env.VITE_MERCHANT_ZIP || '',
  city: import.meta.env.VITE_MERCHANT_CITY || '',
  uid: import.meta.env.VITE_MERCHANT_UID || '', // numéro IDE, ex. CHE-123.456.789
  vatNote: import.meta.env.VITE_MERCHANT_VAT_NOTE || '', // ex. « TVA incluse » si assujetti
  dispatchCity: import.meta.env.VITE_DISPATCH_CITY || '', // ville réelle de l'entrepôt
  carrier: import.meta.env.VITE_CARRIER || '', // ex. « La Poste (PostPac Economy) »
  clearanceReason: import.meta.env.VITE_CLEARANCE_REASON || '', // raison RÉELLE du déstockage
}

// ─────────────────────────────────────────────────────────────
// Motivation d'achat — uniquement à partir de données réelles.
// Rien n'est affiché par défaut : ni stock, ni compte à rebours, ni « quantités limitées ».
//  - limitedConfirmed : le marchand confirme que les quantités sont réellement limitées.
//  - statusApi : point d'accès serveur renvoyant l'heure serveur, la campagne (date de fin)
//    et le stock réel (contrat dans src/lib/storeStatus.js).
// Jamais de nombre aléatoire, jamais d'activité client simulée.
// ─────────────────────────────────────────────────────────────
export const URGENCY = {
  limitedConfirmed: import.meta.env.VITE_CLEARANCE_LIMITED === 'true',
  statusApi: import.meta.env.VITE_STORE_STATUS_API || '',
}

// Détails des conditions (textes validés par le marchand). Vide = la rubrique n'est pas affichée.
export const POLICIES = {
  returnAddress: import.meta.env.VITE_RETURN_ADDRESS || '', // adresse physique de retour
  returnCosts: import.meta.env.VITE_RETURN_COSTS || '', // ex. « Les frais de retour sont à la charge du client. »
  returnCondition: import.meta.env.VITE_RETURN_CONDITION || '', // ex. sachets non ouverts uniquement
  refundTerms: import.meta.env.VITE_REFUND_TERMS || '', // délai et moyen de remboursement
  hosting: import.meta.env.VITE_HOSTING_PROVIDER || '', // hébergeur du site (nom et adresse)
  jurisdiction: import.meta.env.VITE_JURISDICTION || '', // for juridique
}

// Vidéo produit / client réelle (fichier hébergé par le marchand). Vide = section masquée.
export const VIDEO = {
  src: import.meta.env.VITE_PRODUCT_VIDEO_URL || '/video/ariel-product.mp4',
  poster: import.meta.env.VITE_PRODUCT_VIDEO_POSTER || '/video/ariel-video-poster.webp',
  caption: import.meta.env.VITE_PRODUCT_VIDEO_CAPTION || 'Vidéo d’une autre variante Ariel All-in-1 PODS. L’emballage et la formule montrés diffèrent du sachet Universal+ proposé ici.',
}

// Moyens de paiement réellement activés chez le prestataire (liste séparée par des virgules).
// Valeurs reconnues : twint, visa, mastercard, amex, apple_pay, google_pay, postfinance, invoice.
// Vide = aucun moyen affiché comme actif.
export const PAYMENT_METHODS = (import.meta.env.VITE_PAYMENT_METHODS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const PAYMENT_LABELS = {
  card: 'Carte de crédit ou de débit',
  twint: 'TWINT',
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  postfinance: 'PostFinance',
  invoice: 'Facture',
}

// Produit, offres et calculs de prix : module partagé avec le serveur de commande.
export {
  PRODUCT,
  OFFERS,
  DEFAULT_OFFER_ID,
  getOffer,
  formatCHF,
  SINGLE_PACK_PRICE,
  savingsFor,
  pricePerPack,
  pricePerCapsule,
  centsPerWash,
} from './offers.js'
