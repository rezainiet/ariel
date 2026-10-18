import { DELIVERY, PRODUCT, STORE } from '../../config/store.js'

// ─────────────────────────────────────────────────────────────
// Contenu partagé par les trois concepts. Seule la PRÉSENTATION diffère.
// Source des informations produit : emballage fourni (version germanophone
// « 60 PODS · Allin1 PODS · Universal+ ») et visuels de campagne fournis.
// Aucune performance, composition ou certification n'est inventée.
// ─────────────────────────────────────────────────────────────

// Mentions lisibles sur l'emballage, traduites et attribuées.
export const PACK_FACTS = [
  {
    id: 'count',
    title: '60 capsules par pack',
    body: 'Le sachet indique « 60 PODS » : une capsule correspond à un lavage, soit 60 lavages par pack.',
    source: '« 60 PODS »',
  },
  {
    id: 'format',
    title: 'Pré-dosé, tout-en-un',
    body: 'Chaque capsule contient la dose de lessive. Pas de bouchon doseur, pas de poudre à mesurer.',
    source: '« Allin1 PODS »',
  },
  {
    id: 'dissolve',
    title: 'Se dissout rapidement',
    body: 'L’emballage mentionne une dissolution rapide de la capsule dans le tambour.',
    source: '« Schnell auflösend »',
  },
  {
    id: 'cold',
    title: 'Pensé pour laver à froid',
    body: 'L’emballage annonce une action contre les taches dès le premier lavage, même à l’eau froide, et encourage à laver à plus basse température.',
    source: '« Selbst in kaltem Wasser »',
  },
  {
    id: 'closure',
    title: 'Fermeture sécurité enfants',
    body: 'Le sachet est doté d’une fermeture refermable sécurisée, avec un mode d’ouverture en quatre étapes.',
    source: '« Kindersicherer Verschluss »',
  },
]

// Ouverture du sachet — d'après les pictogrammes de l'emballage.
export const OPENING_STEPS = [
  'Déchirer la bande',
  'Trouver la languette',
  'Tenir la languette et ouvrir',
  'Appuyer pour refermer',
]

// Utilisation — consignes générales, toujours vérifier l'emballage.
export const HOW_TO = [
  {
    title: 'Une capsule au fond du tambour',
    body: 'Placez la capsule directement dans le tambour vide, avant le linge — pas dans le bac à produits.',
  },
  {
    title: 'Ajoutez le linge',
    body: 'Chargez le linge par-dessus, puis lancez votre programme habituel.',
  },
  {
    title: 'Refermez le sachet',
    body: 'Mains sèches, sachet bien refermé et rangé hors de portée des enfants.',
  },
]

export const SAFETY = [
  'Tenir hors de portée des enfants.',
  'Ne pas avaler, ne pas percer ni ouvrir la capsule.',
  'Manipuler avec des mains sèches et refermer le sachet après usage.',
  'En cas de contact avec les yeux, rincer abondamment à l’eau.',
  'Se référer aux consignes complètes figurant sur l’emballage.',
]

// Faits de service — issus de la configuration boutique (à confirmer).
export const SERVICE = {
  dispatch: DELIVERY.dispatchLocation,
  days: DELIVERY.estimateDays,
  returnDays: DELIVERY.returnWindowDays,
  store: STORE.name,
  email: STORE.supportEmail,
  phone: STORE.supportPhone,
}

export const FAQ = [
  {
    q: 'Qu’est-ce que j’achète exactement ?',
    a: `Des packs ${PRODUCT.name} de ${PRODUCT.washesPerPack} capsules (60 lavages par pack). Vous choisissez 1, 2 ou 3 packs selon l’offre.`,
  },
  {
    q: 'Combien de lavages contient une offre ?',
    a: '1 pack = 60 lavages, 2 packs = 120 lavages, 3 packs = 180 lavages. Une capsule correspond à un lavage.',
  },
  {
    q: 'La livraison est-elle payante ?',
    a: 'Non, la livraison est offerte en Suisse sur toutes les offres. Le prix affiché est le prix final.',
  },
  {
    q: 'D’où est expédiée ma commande et en combien de temps ?',
    a: `Les commandes sont préparées depuis notre stock en ${DELIVERY.dispatchLocation}. La livraison est estimée à environ ${DELIVERY.estimateDays} jours ouvrables.`,
  },
  {
    q: 'Puis-je retourner ma commande ?',
    a: `Oui, une demande de retour est possible sous ${DELIVERY.returnWindowDays} jours après réception. Contactez le service client avec votre numéro de commande pour recevoir les instructions.`,
  },
  {
    q: 'Comment suivre ma commande ?',
    a: 'Vous recevez une confirmation de commande, puis une confirmation d’expédition par e-mail, avec un lien de suivi lorsqu’il est disponible.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Les moyens de paiement seront affichés dès que le prestataire de paiement sécurisé sera connecté. Aucune donnée de carte n’est traitée par la boutique elle-même.',
  },
  {
    q: 'Qui exploite la boutique ?',
    a: `La boutique est exploitée par ${STORE.name}. La raison sociale, l’adresse et le numéro IDE de l’exploitant figurent dans les mentions légales.`,
  },
]
