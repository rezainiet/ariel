import { IMAGES } from '../../config/assets.js'

// Visuels héros : vraie photo de buanderie (Unsplash License, voir public/images/stock/CREDITS.md)
// dans laquelle le packshot réel est posé — étiquetage intact, seul l'étalonnage lumière est ajusté.
const set = (name, widths, fmt, dir = 'hero') =>
  widths.map((w) => `/images/${dir}/${name}-${w}.${fmt} ${w}w`).join(', ')

export const HERO = {
  desktop: {
    avif: set('hero-desktop', [800, 1200, 1300], 'avif'),
    webp: set('hero-desktop', [800, 1200, 1300], 'webp'),
    src: '/images/hero/hero-desktop-1200.webp',
    width: 1300,
    height: 975,
  },
  mobile: {
    avif: set('hero-mobile', [780, 1040], 'avif'),
    webp: set('hero-mobile', [780, 1040], 'webp'),
    src: '/images/hero/hero-mobile-780.webp',
    width: 1040,
    height: 1300,
  },
}

// Offre 3 sachets : trois sachets identiques sur la même tablette (même photo, même méthode).
export const TRIO = {
  wide: {
    avif: set('trio-wide', [800, 1300], 'avif', 'scene'),
    webp: set('trio-wide', [800, 1300], 'webp', 'scene'),
    src: '/images/scene/trio-wide-1300.webp',
    width: 1300,
    height: 960,
  },
  tall: {
    avif: set('trio-tall', [640, 930], 'avif', 'scene'),
    webp: set('trio-tall', [640, 930], 'webp', 'scene'),
    src: '/images/scene/trio-tall-640.webp',
    width: 930,
    height: 1162,
  },
}
export const TRIO_ALT = 'Trois sachets Ariel All-in-1 PODS de 60 capsules sur une tablette en bois, devant des serviettes blanches'

export const HERO_ALT = 'Sachet Ariel All-in-1 PODS de 60 capsules posé sur une tablette en bois, devant des serviettes blanches, dans une buanderie'

// Galerie : une image dominante à la fois. `lowRes` = recadrage du collage fourni (≈ 220–420 px).
export const C_GALLERY = [
  {
    src: '/images/hero/hero-desktop-1300.webp',
    picture: HERO.desktop,
    thumb: '/images/hero/hero-desktop-800.webp',
    alt: HERO_ALT,
    caption: 'En situation, dans une buanderie',
    fit: 'cover',
  },
  { src: TRIO.wide.src, picture: TRIO.wide, thumb: '/images/scene/trio-wide-800.webp', alt: TRIO_ALT, caption: 'L’offre 3 sachets — 180 lavages', fit: 'cover' },
  { src: IMAGES.packshot, alt: 'Face avant du sachet « 60 PODS » Ariel All-in-1 PODS Universal+', caption: 'Face avant du sachet', fit: 'contain' },
  { src: IMAGES.podWater, alt: 'Capsule Ariel en gros plan', caption: 'La capsule', lowRes: true },
  { src: IMAGES.handpod, alt: 'Une capsule déposée dans le tambour du lave-linge', caption: 'Directement dans le tambour', lowRes: true },
  { src: IMAGES.basket, alt: 'Sachet de 60 lavages dans une buanderie', caption: 'Au quotidien', lowRes: true },
]
