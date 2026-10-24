// ─────────────────────────────────────────────────────────────
// Paiement par REDIRECTION EXTERNE — module pur partagé (serveur + interface d'administration).
// L'administrateur règle : activation, domaine, chemin, un code par offre et la correspondance
// « paramètre d'URL → donnée de commande ». Le serveur construit l'URL après validation de la commande.
// ─────────────────────────────────────────────────────────────
import { OFFERS, PRODUCT } from '../config/offers.js'

// Données de commande transmissibles dans l'URL (clé interne → libellé admin).
export const FIELDS = {
  prenom: 'Prénom',
  nom: 'Nom',
  npa: 'Code postal',
  email: 'E-mail',
  ville: 'Ville',
  adresse_complete: 'Adresse + complément',
  adresse: 'Adresse (rue et numéro)',
  complement: 'Complément d’adresse',
  tel: 'Téléphone',
  produit: 'Nom du produit / de l’offre',
  photo: 'URL de la photo du produit',
  offre: 'Identifiant de l’offre',
  sachets: 'Nombre de sachets',
  prix: 'Prix (CHF)',
  pays: 'Pays (CH)',
}

export const DEFAULT_PARAMS = [
  { param: 'sub10', field: 'prenom' },
  { param: 'adv3', field: 'nom' },
  { param: 'sub3', field: 'npa' },
  { param: 'sub4', field: 'email' },
  { param: 'sub6', field: 'ville' },
  { param: 'sub7', field: 'adresse_complete' },
  { param: 'sub8', field: 'tel' },
  { param: 'adv1', field: 'produit' },
  { param: 'adv2', field: 'photo' },
]

export const defaultConfig = () => ({
  externalRedirect: {
    enabled: false,
    domain: '',
    pathTemplate: '/{code}',
    packages: Object.fromEntries(
      OFFERS.map((o) => [
        o.id,
        {
          code: '',
          productName: `${PRODUCT.name} – ${o.packs} sachet${o.packs > 1 ? 's' : ''} (${o.washes} capsules)`,
          photoUrl: '', // vide = photo du produit hébergée sur la boutique
        },
      ])
    ),
    params: DEFAULT_PARAMS,
  },
  updatedAt: null,
})

const DOMAIN_RE = /^(?=.{3,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i
const CODE_RE = /^[A-Za-z0-9._~-]{1,80}$/
const PARAM_RE = /^[A-Za-z0-9_-]{1,40}$/
const FBCLID_RE = /^[A-Za-z0-9._-]{1,500}$/
const SCCID_RE = /^[A-Za-z0-9_-]{1,500}$/
const isEverflow = (domain) => /^(www\.)?molipy8trk\.com$/i.test(domain)

// Nettoie le domaine saisi (accepte « https://pay.exemple.ch/ » → « pay.exemple.ch »).
export const normalizeDomain = (d) =>
  String(d || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()

// Valide et normalise la configuration envoyée par l'administration. → { ok, config, errors }
export function validateConfig(input) {
  const errors = {}
  const r = input?.externalRedirect || {}
  const enabled = r.enabled === true
  const domain = normalizeDomain(r.domain)
  const pathTemplate = String(r.pathTemplate ?? '/{code}').trim() || '/{code}'
  if (domain && !DOMAIN_RE.test(domain)) errors.domain = 'Domaine invalide (ex. paiement.exemple.ch).'
  if (enabled && !domain) errors.domain = 'Domaine obligatoire pour activer la redirection.'
  if (!pathTemplate.startsWith('/') || /\s|[?#]/.test(pathTemplate)) errors.pathTemplate = 'Chemin invalide : il commence par « / », sans espace ni « ? ».'

  const packages = {}
  for (const o of OFFERS) {
    const p = r.packages?.[o.id] || {}
    const code = String(p.code || '').trim()
    const productName = String(p.productName || '').trim().slice(0, 120)
    const photoUrl = String(p.photoUrl || '').trim()
    if (code && !CODE_RE.test(code)) errors[`code_${o.id}`] = 'Code invalide (lettres, chiffres, . _ ~ - uniquement).'
    if (enabled && !code && pathTemplate.includes('{code}')) errors[`code_${o.id}`] = 'Code obligatoire.'
    if (photoUrl && !/^https:\/\/[^\s]+$/i.test(photoUrl)) errors[`photo_${o.id}`] = 'URL de photo en https:// uniquement.'
    packages[o.id] = { code, productName, photoUrl }
  }

  const params = []
  const seen = new Set()
  for (const row of Array.isArray(r.params) ? r.params.slice(0, 30) : []) {
    const param = String(row?.param || '').trim()
    const field = String(row?.field || '')
    if (!param && !field) continue
    if (/^sub5$/i.test(param)) errors.params = 'Le paramètre sub5 est désactivé pour éviter un second signal Purchase.'
    else if (isEverflow(domain) && /^(sub1|fbclid|sccid)$/i.test(param)) errors.params = `Le paramètre « ${param} » est réservé aux identifiants de clic.`
    else if (!PARAM_RE.test(param)) errors.params = `Nom de paramètre invalide : « ${param || '(vide)'} ».`
    else if (!FIELDS[field]) errors.params = `Donnée inconnue pour « ${param} ».`
    else if (seen.has(param)) errors.params = `Paramètre en double : « ${param} ».`
    else {
      seen.add(param)
      params.push({ param, field })
    }
  }

  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, config: { externalRedirect: { enabled, domain, pathTemplate, packages, params } } }
}

// Valeur d'une donnée pour une commande validée.
function fieldValue(field, { offer, customer, pkg, origin }) {
  switch (field) {
    case 'adresse_complete':
      return [customer.adresse, customer.complement].filter(Boolean).join(', ')
    case 'produit':
      return pkg.productName || `${PRODUCT.name} – ${offer.packs} sachet${offer.packs > 1 ? 's' : ''}`
    case 'photo':
      return pkg.photoUrl || (origin ? `${origin}/images/packshot.webp` : '')
    case 'offre':
      return offer.id
    case 'sachets':
      return String(offer.packs)
    case 'prix':
      return offer.price.toFixed(2)
    case 'pays':
      return 'CH'
    default:
      return customer[field] ?? ''
  }
}

// Construit l'URL de redirection. `customer` doit déjà être validé et nettoyé (orderValidation.clean).
export function buildRedirectUrl(config, offer, customer, { origin = '', fbclid = '', sccid = '' } = {}) {
  const r = config.externalRedirect
  const pkg = r.packages[offer.id] || {}
  const path = r.pathTemplate.replace('{code}', encodeURIComponent(pkg.code || ''))
  const url = new URL(`https://${r.domain}${path}`)
  for (const { param, field } of r.params) {
    // Also protects active configurations saved before sub5 was retired.
    if (/^sub5$/i.test(param) || (isEverflow(r.domain) && /^(sub1|fbclid|sccid)$/i.test(param))) continue
    const v = fieldValue(field, { offer, customer, pkg, origin })
    if (v !== '') url.searchParams.set(param, v)
  }
  if (isEverflow(r.domain)) {
    if (FBCLID_RE.test(fbclid)) {
      url.searchParams.set('sub1', fbclid)
      url.searchParams.set('fbclid', fbclid)
    }
    if (SCCID_RE.test(sccid)) url.searchParams.set('ScCid', sccid)
  }
  return url.toString()
}
