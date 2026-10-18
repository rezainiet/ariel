// Visuels de la boutique Frais. Packshot réel non retouché ; scènes = vraie photo de buanderie
// (Unsplash License, assets-src/stock/CREDITS.md) + packshot réel ; capsules = photos fournies.
import { IMAGES } from '../../config/assets.js'
import { HERO } from '../c/media.js'

const set = (dir, name, widths, fmt) => widths.map((w) => `/images/${dir}/${name}-${w}.${fmt} ${w}w`).join(', ')
const pic = (name, widths, w, h, dir = 'frais', fmts = ['avif', 'webp']) => ({
  ...Object.fromEntries(fmts.map((f) => [f, set(dir, name, widths, f)])),
  src: `/images/${dir}/${name}-${widths[0]}.webp`,
  width: w,
  height: h,
})

export const STORY = {
  cold: pic('story-cold', [700, 1300], 1300, 1625),
  routineWide: pic('story-routine-wide', [800, 1400], 1400, 1050),
  routineTall: pic('story-routine-tall', [700, 1200], 1200, 1500),
  podHand: pic('pod-hand', [560, 900], 900, 1269, 'frais', ['webp']),
  podWater: pic('pod-water', [560, 900], 900, 1044, 'frais', ['webp']),
}

// Galerie du héros : packshot d'abord (le produit exact), puis situations réelles.
export const GALLERY_F = [
  { kind: 'cutout', src: IMAGES.packshotCutout, alt: 'Sachet Ariel All-in-1 PODS Universal+, 60 capsules', caption: 'Le sachet de 60 capsules' },
  { kind: 'photo', src: '/images/hero/hero-desktop-1300.webp', picture: HERO.desktop, alt: 'Le sachet posé dans une buanderie, devant des serviettes blanches', caption: 'En situation' },
  { kind: 'photo', src: STORY.podHand.src, picture: STORY.podHand, alt: 'Une capsule Ariel tenue au-dessus du tambour', caption: 'La capsule, prête à l’emploi' },
  { kind: 'photo', src: STORY.podWater.src, picture: STORY.podWater, alt: 'Capsule Ariel en gros plan dans l’eau', caption: 'La capsule en gros plan' },
  { kind: 'photo', src: '/images/scene/trio-wide-1300.webp', alt: 'Trois sachets Ariel sur une tablette en bois', caption: 'L’offre 3 sachets' },
]
