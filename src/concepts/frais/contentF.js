// ─────────────────────────────────────────────────────────────
// Contenu de la boutique « Frais » (Concept 2 approuvé).
// Sources : face avant du sachet fourni (version allemande), ariel.de / ariel.co.uk
// (mode d'emploi, dosage), OFSP (stockage des capsules), Tox Info Suisse.
// Aucune allégation ajoutée : chaque promesse produit est attribuée à l'emballage ou au fabricant.
// ─────────────────────────────────────────────────────────────
import { DELIVERY, storeRef } from '../../config/store.js'

// Typographie française : espace insécable avant « ? », « ! », « : », « ; » (jamais de ponctuation orpheline).
const nb = (t) => t.replace(/ ([?!:;])/g, '\u00a0$1')

export const ANNOUNCEMENTS = [
  'Déstockage en cours · offres dès CHF 4.–',
  'Livraison offerte en Suisse',
  `Retour possible sous ${DELIVERY.returnWindowDays} jours`,
]

// Repères sur la photo « lavage à froid » (en % de public/images/frais/story-cold-*.webp).
// Chaque repère est posé à côté du texte imprimé qu'il traduit.
export const COLD_HOTSPOTS = [
  { x: 38, y: 70.4, de: 'Schnell auflösend', fr: 'Dissolution rapide' },
  { x: 51.5, y: 73.2, de: 'Wasche kälter und spare damit Energie & CO₂', fr: 'Lavez plus froid : moins d’énergie et de CO₂' },
  { x: 50, y: 80.6, de: 'Fleck-weg-Power beim 1. Waschen · selbst in kaltem Wasser', fr: 'Détachage dès le 1er lavage, même à l’eau froide' },
]

export const ROUTINE = [
  { key: 'sort', title: 'Triez le linge', body: 'Blanc et clair avec Universal+. Pas de laine ni de délicat.' },
  { key: 'pod', title: 'Une capsule au fond du tambour', body: 'Tambour vide, capsule à l’arrière, mains sèches.' },
  { key: 'load', title: 'Ajoutez le linge', body: 'Par-dessus la capsule, sans surcharger.' },
  { key: 'run', title: 'Votre programme habituel', body: 'La capsule se dissout pendant le lavage.' },
]

const DETAILS_RAW = [
  {
    id: 'pour-quel-linge',
    title: 'Pour quel linge ?',
    body: [
      'Variante Universal+ : linge blanc et clair.',
      'Ne convient pas au lavage à la main, au prélavage, à la laine ni au linge délicat.',
    ],
  },
  {
    id: 'dosage',
    title: 'Combien de capsules ?',
    body: [
      'Dosage standard : 1 capsule par lavage.',
      'Selon Ariel, pour un tambour de plus de 6 kg, du linge très sale ou une eau dure, 2 capsules peuvent être nécessaires. Référez-vous à l’emballage.',
    ],
  },
  {
    id: 'securite',
    title: 'Sécurité et rangement',
    body: [
      'Provoque des lésions oculaires graves et une irritation cutanée (mentions de danger du fabricant).',
      'Gardez le sachet fermé, hors de portée des enfants, idéalement à au moins 160 cm de hauteur (OFSP).',
      'En cas d’ingestion : Tox Info Suisse, 145 (24 h/24).',
    ],
  },
  {
    id: 'ouverture',
    title: 'Ouvrir le sachet',
    body: ['Fermeture sécurité enfants en 4 gestes : déchirer la bande, trouver la languette, la tenir et ouvrir, presser pour refermer.'],
  },
]

const FAQ_RAW = [
  {
    q: 'Qu’est-ce que j’achète exactement ?',
    a: 'Des sachets Ariel All-in-1 PODS (variante Universal+) de 60 capsules de lessive. Vous choisissez 1, 2 ou 3 sachets.',
  },
  {
    q: 'Une capsule correspond-elle toujours à un lavage ?',
    a: 'Au dosage standard, oui : 60 capsules = 60 lavages. Pour un tambour de plus de 6 kg, du linge très sale ou une eau dure, Ariel recommande parfois 2 capsules.',
  },
  {
    q: 'Pourquoi l’emballage est-il en allemand ?',
    a: 'La face avant de ce sachet est imprimée en allemand. Ses mentions, le mode d’emploi et les consignes de sécurité sont repris en français sur cette page.',
  },
  {
    q: 'Le prix affiché est-il le prix final ?',
    a: 'Oui. La livraison est offerte en Suisse sur les trois offres : le montant affiché est celui que vous payez.',
  },
  {
    q: 'Quand vais-je recevoir ma commande ?',
    a: `${DELIVERY.estimateDays ? `La livraison est estimée à environ ${DELIVERY.estimateDays} jours ouvrables. ` : ''}Vous recevez une confirmation d’expédition par e-mail, avec un lien de suivi lorsqu’il est disponible.`,
  },
  {
    q: 'Puis-je retourner ma commande ?',
    a: `Oui, sous ${DELIVERY.returnWindowDays} jours après réception. C’est un engagement de notre boutique : la loi suisse ne prévoit pas de droit de rétractation pour les achats en ligne.`,
  },
  {
    q: 'Est-ce le site officiel d’Ariel ?',
    a: `Non. ${storeRef(true)} revend des produits Ariel. Ariel est une marque de The Procter & Gamble Company.`,
  },
]

export const PRODUCT_DETAILS = DETAILS_RAW.map((d) => ({ ...d, title: nb(d.title), body: d.body.map(nb) }))
export const FAQ_F = FAQ_RAW.map((f) => ({ q: nb(f.q), a: nb(f.a) }))
