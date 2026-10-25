// ─────────────────────────────────────────────────────────────
// Validation de commande — PARTAGÉE entre le navigateur et le serveur.
// Module pur (aucune dépendance au navigateur ni à Vite) : le serveur de commande
// l'importe tel quel (voir server/validate-order.mjs) et refait TOUTES les vérifications.
// Le montant n'est jamais lu depuis le client : il est recalculé à partir de l'offre.
// Les messages ne contiennent jamais la valeur saisie (aucune donnée personnelle).
// ─────────────────────────────────────────────────────────────
import { getOffer, pricedOffer, BASE_CURRENCY } from '../config/offers.js'
import { isLang, DEFAULT_LANG } from '../i18n/detect.js'

// Messages en français (serveur et langue par défaut) ; le navigateur passe ceux de la langue affichée.
export const DEFAULT_MESSAGES = {
  prenom: 'Veuillez indiquer votre prénom.',
  nom: 'Veuillez indiquer votre nom.',
  email: 'Veuillez indiquer votre adresse e-mail.',
  emailInvalid: 'Adresse e-mail invalide (ex. nom@exemple.ch).',
  tel: 'Veuillez indiquer votre numéro de téléphone.',
  telInvalid: 'Numéro suisse invalide (ex. 079 123 45 67).',
  adresse: 'Veuillez indiquer la rue et le numéro.',
  npa: 'Veuillez indiquer le code postal.',
  npaInvalid: 'Le code postal suisse comporte 4 chiffres (ex. 1003).',
  ville: 'Veuillez indiquer la ville.',
  terms: 'Veuillez accepter les conditions générales de vente.',
  invalid: 'Veuillez vérifier ce champ.',
}

export const FIELDS = ['prenom', 'nom', 'email', 'tel', 'adresse', 'complement', 'npa', 'ville']
const MAX = { prenom: 60, nom: 60, email: 120, tel: 20, adresse: 120, complement: 120, npa: 4, ville: 60 }

export const NPA_RE = /^[1-9]\d{3}$/ // code postal suisse : 4 chiffres, 1000–9999
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Normalise un numéro : espaces, points, tirets et parenthèses retirés.
export const normalizePhone = (t) => (t || '').replace(/[\s.\-()/]/g, '')
// Numéro suisse uniquement : +41 / 0041 / 0 suivi de 9 chiffres (indicatif 2x–9x, ex. 079, 021, 044).
const PHONE_RE = /^(?:\+41|0041|0)[2-9]\d{8}$/

// Saisie du téléphone avec indicatif fixe +41 : garde les 9 chiffres nationaux, quel que soit
// ce qui est tapé ou collé (« 079… », « +41 79… », « 0041 79… », autoremplissage du navigateur),
// et les regroupe à la suisse : « 79 123 45 67 ».
export function swissNational(input) {
  const s = String(input || '').trim()
  let d = s.replace(/\D/g, '')
  if (s.startsWith('+')) d = d.startsWith('41') ? d.slice(2) : d
  else if (d.startsWith('0041')) d = d.slice(4)
  else if (d.startsWith('41') && d.length > 9) d = d.slice(2)
  if (d.startsWith('0')) d = d.slice(1)
  d = d.slice(0, 9)
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ')
}

export function clean(values = {}) {
  const out = {}
  for (const f of FIELDS) out[f] = String(values[f] ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX[f])
  out.email = out.email.toLowerCase()
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
  else if (!PHONE_RE.test(normalizePhone(v.tel))) e.tel = m.telInvalid
  if (!v.adresse) e.adresse = m.adresse
  if (!v.npa) e.npa = m.npa
  else if (!NPA_RE.test(v.npa)) e.npa = m.npaInvalid
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
  return {
    ok: true,
    order: {
      offerId: offer.id,
      packs: offer.packs,
      capsules: offer.washes,
      total: offer.price, // recalculé dans la devise du visiteur : jamais le montant envoyé par le navigateur
      currency,
      country: 'CH',
      lang: isLang(payload.lang) ? payload.lang : DEFAULT_LANG,
      method: payload.method || null,
      customer: clean(payload.customer),
    },
  }
}
