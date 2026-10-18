// Chemins des visuels produit réels (servis depuis /public/images).
// Sources fournies par le client : packshot officiel + collage publicitaire
// (recadré en visuels distincts). Ne pas modifier l'étiquetage du produit.
export const IMAGES = {
  packshot: '/images/packshot.webp', // packshot officiel 60 PODS sur fond clair
  packshotCutout: '/images/packshot-cutout.webp', // même packshot, fond retiré (transparent)
  stacked: '/images/stacked.webp', // packs empilés (offres multi-packs)
  handpod: '/images/handpod.webp', // main tenant une capsule devant le lave-linge
  towels: '/images/towels.webp', // linge frais + fleurs (fraîcheur)
  podWater: '/images/pod-water.webp', // capsule en gros plan dans l'eau
  basket: '/images/basket.webp', // pack sur panier en osier (lifestyle)
}

// Galerie produit partagée. `lowRes` : visuel recadré depuis le collage
// fourni (≈ 220–420 px de large) — à remplacer par des fichiers HD.
export const GALLERY = [
  {
    src: IMAGES.packshot,
    cutout: IMAGES.packshotCutout, // version détourée pour fonds colorés
    alt: 'Pack Ariel All-in-1 PODS · 60 capsules',
    fit: 'contain',
    lowRes: false,
  },
  { src: IMAGES.stacked, alt: 'Plusieurs packs de 60 capsules', fit: 'cover', lowRes: true },
  { src: IMAGES.handpod, alt: 'Une capsule déposée dans le tambour', fit: 'cover', lowRes: true },
  { src: IMAGES.podWater, alt: 'Capsule Ariel en gros plan', fit: 'cover', lowRes: true },
  { src: IMAGES.basket, alt: 'Pack de 60 lavages dans la buanderie', fit: 'cover', lowRes: true },
  { src: IMAGES.towels, alt: 'Linge propre plié', fit: 'cover', lowRes: true },
]
