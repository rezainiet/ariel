// ─────────────────────────────────────────────────────────────
// Validation de commande — PARTAGÉE entre le navigateur et le serveur.
// Module pur (aucune dépendance au navigateur ni à Vite) : le serveur de commande
// l'importe tel quel (voir server/validate-order.mjs) et refait TOUTES les vérifications.
// Le montant n'est jamais lu depuis le client : il est recalculé à partir de l'offre.
// Les messages ne contiennent jamais la valeur saisie (aucune donnée personnelle).
// ─────────────────────────────────────────────────────────────
import { getOffer, pricedOffer, BASE_CURRENCY } from '../config/offers.js'
import { isDeliveryCountry, validPostalCode } from '../config/deliveryCountries.js'
import { isLang, DEFAULT_LANG } from '../i18n/detect.js'
import { isSupportedCountry, parsePhoneNumberFromString } from 'libphonenumber-js/min'

// Messages en français (serveur et langue par défaut) ; le navigateur passe ceux de la langue affichée.
export const DEFAULT_MESSAGES = {
  prenom: 'Veuillez indiquer votre prénom.',
  nom: 'Veuillez indiquer votre nom.',
  email: 'Veuillez indiquer votre adresse e-mail.',
  emailInvalid: 'Adresse e-mail invalide (ex. nom@exemple.ch).',
  tel: 'Veuillez indiquer votre numéro de téléphone.',
  telInvalid: 'Numéro de téléphone invalide. Vérifiez l’indicatif et le numéro.',
  country: 'Veuillez choisir un pays de livraison disponible.',
  adresse: 'Veuillez indiquer la rue et le numéro.',
  npa: 'Veuillez indiquer le code postal.',
  npaInvalid: 'Code postal invalide pour le pays choisi.',
  ville: 'Veuillez indiquer la ville.',
  terms: 'Veuillez accepter les conditions générales de vente.',
  invalid: 'Veuillez vérifier ce champ.',
}

export const FIELDS = ['prenom', 'nom', 'email', 'tel', 'country', 'adresse', 'complement', 'npa', 'ville']
const MAX = { prenom: 60, nom: 60, email: 120, tel: 40, country: 2, adresse: 120, complement: 120, npa: 12, ville: 60 }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Normalise un numéro : espaces, points, tirets et parenthèses retirés.
export const normalizePhone = (t) => (t || '').replace(/[\s.\-()/]/g, '')
// Le pays du téléphone est choisi dans le formulaire (prérempli par GeoIP). Le serveur reçoit
// ensuite un numéro international ; les anciennes commandes avec un numéro suisse local restent valides.
export function parsePhone(input, country = 'CH') {
  const defaultCountry = isSupportedCountry(country) ? country : 'CH'
  try {
    return parsePhoneNumberFromString(String(input || ''), { defaultCountry, extract: false })
  } catch {
    return undefined
  }
}

export function clean(values = {}) {
  const out = {}
  for (const f of FIELDS) out[f] = String(values[f] ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX[f])
  out.email = out.email.toLowerCase()
  out.country = out.country ? out.country.toUpperCase() : 'CH' // anciennes commandes sans pays
  const phone = parsePhone(out.tel, values.phoneCountry)
  if (phone?.isValid()) out.tel = phone.number // E.164 pour les commandes et le prestataire
  return out
}

// Retourne { champ: message } — vide si tout est valide.
export function validateCustomer(values = {}, { terms, messages = DEFAULT_MESSAGES } = {}) {
  const m = messages
  const v = clean(values)
  const e = {}
  if (!v.prenom) e.prenom = m.prenom
  if (!v.nom) e.nom = m.nom
  if (!v.email) e.email = m.email
  else if (!EMAIL_RE.test(v.email)) e.email = m.emailInvalid
  if (!v.tel) e.tel = m.tel
  else if (!parsePhone(v.tel, values.phoneCountry)?.isValid()) e.tel = m.telInvalid
  if (!isDeliveryCountry(v.country)) e.country = m.country
  if (!v.adresse) e.adresse = m.adresse
  if (!v.npa) e.npa = m.npa
  else if (!validPostalCode(v.country, v.npa)) e.npa = m.npaInvalid
  if (!v.ville) e.ville = m.ville
  if (terms !== undefined && !terms) e.terms = m.terms
  return e
}

// Validation complète d'une commande reçue par le serveur.
// payload = { offerId, customer, termsAccepted, method, lang }
// currency = devise déterminée par le SERVEUR pour ce visiteur (jamais lue depuis le navigateur).
export function validateOrder(payload = {}, { enabledMethods = [], currency = BASE_CURRENCY } = {}) {
  const errors = {}
  const offer = pricedOffer(getOffer(payload.offerId), currency)
  if (!getOffer(payload.offerId)) errors.offerId = 'Offre inconnue.'
  else if (!offer) errors.currency = 'Devise non disponible.'
  Object.assign(errors, validateCustomer(payload.customer, { terms: payload.termsAccepted === true }))
  if (enabledMethods.length && !enabledMethods.includes(payload.method)) errors.method = 'Moyen de paiement non disponible.'
  if (Object.keys(errors).length) return { ok: false, errors }
  const customer = clean(payload.customer)
  return {
    ok: true,
    order: {
      offerId: offer.id,
      packs: offer.packs,
      capsules: offer.washes,
      total: offer.price, // recalculé dans la devise du visiteur : jamais le montant envoyé par le navigateur
      currency,
      country: customer.country,
      lang: isLang(payload.lang) ? payload.lang : DEFAULT_LANG,
      method: payload.method || null,
      customer,
    },
  }
}
