// ─────────────────────────────────────────────────────────────
// Contenu de la boutique (Concept C). Sources : SWISS-MARKET-RESEARCH.md
//  - ariel.de « Ariel All-in-1 PODS Universalwaschmittel » (allégations, usage, dangers, stockage)
//  - ariel.co.uk « How to use Ariel All-in-1 PODS » (dosage selon charge, saleté, dureté de l'eau)
//  - emballage fourni (« 60 PODS », fermeture sécurité enfants, 4 étapes)
//  - OFSP « Lessive liquide en capsules » (stockage ≥ 160 cm, Tox Info Suisse 145)
// Les allégations de performance sont attribuées au fabricant, jamais reprises comme nôtres.
// ─────────────────────────────────────────────────────────────
import { DELIVERY, MERCHANT, STORE } from '../../config/store.js'

// A — « Le sachet, traduit » : ce qu'indique la face avant (imprimée en allemand), repère par repère.
// x / y = position du repère en % de public/images/packshot-cutout.webp (placé à côté du texte, jamais dessus).
export const LABEL_NOTES = [
  {
    x: 9.5,
    y: 24.5,
    de: '60 PODS',
    fr: '60 capsules',
    body: 'Soit 60 lavages au dosage standard d’une capsule par machine.',
  },
  {
    x: 48.5,
    y: 37.5,
    de: 'Schnell auflösend',
    fr: 'Dissolution rapide',
    body: 'Selon Ariel, la capsule se dissout rapidement dans l’eau de lavage.',
  },
  {
    x: 50,
    y: 57,
    de: 'Fleck-weg-Power beim 1. Waschen · Selbst in kaltem Wasser',
    fr: 'Détachage dès le premier lavage, même à l’eau froide',
    body: 'Allégation du fabricant, telle qu’imprimée sur l’emballage.',
  },
  {
    x: 51,
    y: 44,
    de: 'Wasche kälter und spare damit Energie & CO₂',
    fr: 'Lavez plus froid : moins d’énergie, moins de CO₂',
    body: 'Message de l’initiative #WirDrehenRunter d’Ariel avec le WWF, présent sur le sachet.',
  },
  {
    x: 31,
    y: 5,
    de: 'Kindersicherer Verschluss',
    fr: 'Fermeture sécurité enfants',
    body: 'Ouverture en 4 gestes : déchirer, trouver la languette, ouvrir, presser pour refermer.',
  },
  {
    x: 40.5,
    y: 89.5,
    de: 'Universal+',
    fr: 'Lessive universelle',
    body: 'Pour le linge blanc et clair. Pas pour la laine, le délicat, le lavage à la main.',
  },
]

export const SUITABILITY = {
  for: 'Linge blanc et clair (variante Universal).',
  notFor: 'Lavage à la main, prélavage, laine et linge délicat.',
}

// D — Mode d'emploi (d'après le fabricant)
export const STEPS = [
  { key: 'drum', title: 'Capsule au fond du tambour', body: 'Tambour vide, capsule à l’arrière. Jamais dans le bac à produits.' },
  { key: 'laundry', title: 'Ajoutez le linge', body: 'Répartissez le linge par-dessus, puis lancez votre programme.' },
  { key: 'dry', title: 'Mains sèches, sans percer', body: 'Manipulez la capsule avec des mains sèches. Ne pas la percer ni la couper.' },
  { key: 'store', title: 'Refermez et rangez en hauteur', body: 'Sachet bien fermé, dans une armoire fermée, hors de portée des enfants.' },
]

export const DOSAGE_NOTE =
  'Dosage standard : 1 capsule par lavage. Selon Ariel, le nombre de capsules dépend de la taille de la charge, du degré de salissure et de la dureté de l’eau — pour un tambour de plus de 6 kg, 2 capsules sont recommandées. Référez-vous toujours à l’emballage.'

export const OPENING_STEPS = ['Déchirer la bande', 'Trouver la languette', 'Tenir la languette et ouvrir', 'Appuyer pour refermer']

// Sécurité — formulations OFSP / fabricant
export const SAFETY = [
  'Provoque des lésions oculaires graves et une irritation cutanée (mentions de danger du fabricant).',
  'Conserver hors de portée des enfants, dans une armoire fermée, idéalement à au moins 160 cm de hauteur (OFSP).',
  'Refermer le sachet immédiatement après usage ; garder les capsules dans leur emballage d’origine.',
  'Contact avec les yeux ou la peau : rincer immédiatement et abondamment à l’eau.',
  'Stocker au frais et au sec (0–30 °C), à l’abri du soleil direct.',
]
export const EMERGENCY = { label: 'Tox Info Suisse', number: '145', note: 'En cas d’ingestion, appelez immédiatement le 145 (24 h/24) ou un médecin.' }

// Livraison & retours — uniquement à partir de la configuration
export function deliveryFacts() {
  const from = MERCHANT.dispatchCity
    ? `${MERCHANT.dispatchCity} (Suisse)`
    : DELIVERY.dispatchLocation === 'Suisse'
      ? 'la Suisse'
      : DELIVERY.dispatchLocation
  return {
    from,
    days: DELIVERY.estimateDays,
    carrier: MERCHANT.carrier,
    returnDays: DELIVERY.returnWindowDays,
  }
}

export const ORDER_STEPS = [
  { title: 'Confirmation de commande', body: 'Un e-mail récapitulatif vous est envoyé dès la validation.' },
  { title: 'Préparation & expédition', body: 'Un second e-mail confirme l’envoi de votre colis.' },
  { title: 'Suivi', body: 'Un lien de suivi vous est transmis lorsqu’il est disponible.' },
]

// La question du prix n'apparaît que si le marchand a fourni la raison réelle (jamais inventée).
export const FAQ_C = [
  ...(MERCHANT.clearanceReason ? [{ q: 'Pourquoi ce prix si bas ?', a: MERCHANT.clearanceReason }] : []),
  {
    q: 'Qu’est-ce que j’achète exactement ?',
    a: 'Des sachets Ariel All-in-1 PODS (variante Universal+) de 60 capsules de lessive. Vous choisissez 1, 2 ou 3 sachets.',
  },
  {
    q: 'Une capsule correspond-elle toujours à un lavage ?',
    a: 'Au dosage standard, oui : 60 capsules = 60 lavages. Pour une grande charge (tambour de plus de 6 kg), du linge très sale ou une eau dure, Ariel recommande parfois 2 capsules.',
  },
  {
    q: 'Pourquoi l’emballage est-il en allemand ?',
    a: 'La face avant de ce sachet est imprimée en allemand. Chaque mention est traduite plus haut (« Le sachet, traduit »), et le mode d’emploi et les consignes de sécurité essentielles sont repris en français sur cette page. Référez-vous aussi aux pictogrammes de l’emballage.',
  },
  {
    q: 'La livraison est-elle payante ?',
    a: 'Non. La livraison est offerte en Suisse sur les trois offres. Le prix affiché est le montant total à payer.',
  },
  {
    q: 'Quand vais-je recevoir ma commande ?',
    a: `La livraison est estimée à environ ${DELIVERY.estimateDays} jours ouvrables. Vous recevez une confirmation d’expédition par e-mail.`,
  },
  {
    q: 'Puis-je retourner ma commande ?',
    a: `Oui, une demande de retour est possible sous ${DELIVERY.returnWindowDays} jours après réception. Il s’agit d’un engagement de notre boutique (la loi suisse ne prévoit pas de droit de rétractation pour les achats en ligne). Les conditions détaillées figurent sur la page Retours & remboursements.`,
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Les moyens de paiement disponibles sont affichés à l’étape de paiement. Le paiement est traité par un prestataire spécialisé : aucune donnée de carte ne transite par notre boutique.',
  },
  {
    q: 'Est-ce le site officiel d’Ariel ?',
    a: `Non. ${STORE.name} n’est pas le site officiel de la marque : nous revendons des produits Ariel. Ariel est une marque de The Procter & Gamble Company.`,
  },
]
