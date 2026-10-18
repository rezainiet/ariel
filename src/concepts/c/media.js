import { IMAGES } from '../../config/assets.js'

// Visuels héros : composition originale autour du packshot réel (étiquetage intact).
const set = (name, widths, fmt) => widths.map((w) => `/images/hero/${name}-${w}.${fmt} ${w}w`).join(', ')

export const HERO = {
  desktop: {
    avif: set('hero-desktop', [800, 1200, 1600], 'avif'),
    webp: set('hero-desktop', [800, 1200, 1600], 'webp'),
    src: '/images/hero/hero-desktop-1200.webp',
    width: 1600,
    height: 1200,
  },
  mobile: {
    avif: set('hero-mobile', [780, 1170], 'avif'),
    webp: set('hero-mobile', [780, 1170], 'webp'),
    src: '/images/hero/hero-mobile-780.webp',
    width: 1170,
    height: 1462,
  },
}

export const HERO_ALT = 'Sachet Ariel All-in-1 PODS de 60 capsules posé sur un plan de travail, dans la lumière du matin'

// Galerie : une image dominante à la fois. `lowRes` = recadrage du collage fourni (≈ 220–420 px).
export const C_GALLERY = [
  {
    src: '/images/hero/hero-desktop-1600.webp',
    picture: HERO.desktop,
    alt: HERO_ALT,
    caption: 'Mise en scène avec le produit réel',
    fit: 'cover',
  },
  { src: IMAGES.packshot, alt: 'Face avant du sachet « 60 PODS » Ariel All-in-1 PODS Universal+', caption: 'Face avant du sachet', fit: 'contain' },
  { src: IMAGES.podWater, alt: 'Capsule Ariel en gros plan', caption: 'La capsule', lowRes: true },
  { src: IMAGES.handpod, alt: 'Une capsule déposée dans le tambour du lave-linge', caption: 'Directement dans le tambour', lowRes: true },
  { src: IMAGES.stacked, alt: 'Plusieurs sachets de 60 capsules', caption: 'Offres de 2 et 3 sachets', lowRes: true },
  { src: IMAGES.basket, alt: 'Sachet de 60 lavages dans une buanderie', caption: 'Au quotidien', lowRes: true },
]
