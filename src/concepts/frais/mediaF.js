// Visuels de la boutique Frais. Packshot réel non retouché ; récit (geste, capsules, emballage) = photos
// fournies ; galerie du héros = photos fournies par le marchand (public/images/gallery).
import { IMAGES } from '../../config/assets.js'

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

// Photos de la galerie fournies par le marchand (public/images/gallery, WebP 560 px + taille d'origine).
// position : point de cadrage quand le cadre (paysage sur mobile) rogne une photo portrait ou carrée.
const galleryPhoto = (name, width, height, position) => ({
  kind: 'photo',
  src: `/images/gallery/${name}-${width}.webp`,
  thumb: `/images/gallery/${name}-560.webp`,
  position,
  picture: {
    webp: `/images/gallery/${name}-560.webp 560w, /images/gallery/${name}-${width}.webp ${width}w`,
    src: `/images/gallery/${name}-${width}.webp`,
    width,
    height,
  },
})

// Galerie du héros : packshot d'abord (le produit exact, qui suit l'offre choisie), puis les photos fournies.
// Textes alternatifs et légendes traduits : t.gallery (même ordre).
export const GALLERY_F = [
  { kind: 'cutout', src: IMAGES.packshotCutout },
  galleryPhoto('pouch-open', 637, 800, '50% 42%'),
  galleryPhoto('box-trio', 800, 800, '50% 68%'),
  galleryPhoto('trio-pods', 800, 800, '50% 52%'),
  galleryPhoto('pouch-pods', 637, 800, '50% 77%'),
]
