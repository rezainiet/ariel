import { useState } from 'react'
import { Images } from 'lucide-react'
import Lightbox from '../shared/Lightbox.jsx'
import GalleryC from './GalleryC.jsx'
import BuyBoxC, { TitleBlock } from './BuyBoxC.jsx'
import { HERO, HERO_ALT, C_GALLERY } from './media.js'

// Héros mobile : photo art-dirigée 4:5, texte posé sur la zone de mur dégagée.
function HeroMobile() {
  const [zoom, setZoom] = useState(null)
  return (
    // Composition 4:5 conservée telle quelle (jamais recadrée) : sur un écran court, l'image
    // rétrécit et se centre plutôt que de faire chevaucher le titre et le produit.
    <div
      className="relative mx-auto aspect-[4/5] w-full overflow-hidden bg-sand"
      style={{ maxWidth: 'min(100%, 520px, calc(62svh * 0.8))' }}
    >
      <picture>
        <source type="image/avif" srcSet={HERO.mobile.avif} sizes="100vw" />
        <source type="image/webp" srcSet={HERO.mobile.webp} sizes="100vw" />
        <img
          src={HERO.mobile.src}
          alt={HERO_ALT}
          width={HERO.mobile.width}
          height={HERO.mobile.height}
          fetchpriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      {/* voile très léger pour garantir le contraste du texte */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-ivory/75 via-ivory/30 to-transparent" />

      <div className="absolute inset-x-0 top-0 px-4 pt-5">
        <TitleBlock onPhoto />
      </div>

      {/* Puce photos posée sur la zone des serviettes : ne masque jamais le produit */}
      <button
        onClick={() => setZoom(0)}
        className="absolute bottom-3 left-3 flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-3.5 text-xs font-bold text-ink shadow-md backdrop-blur"
      >
        <Images size={15} /> {C_GALLERY.length} photos
      </button>
      <Lightbox
        images={C_GALLERY.map((g) => ({ src: g.src, alt: g.alt }))}
        index={zoom}
        onClose={() => setZoom(null)}
        onIndex={setZoom}
      />
    </div>
  )
}

// Un seul configurateur : mobile = photo puis configurateur ; desktop = galerie | titre + configurateur.
export default function HeroC({ sel, setSel, ctaRef }) {
  return (
    <section
      aria-label="Produit et offres"
      className="mx-auto max-w-[1320px] bg-sand/40 md:grid md:grid-cols-[0.85fr_1fr] md:gap-6 md:bg-transparent md:px-6 md:pb-6 md:pt-6 lg:grid-cols-[1.18fr_1fr] lg:gap-14 lg:px-8 lg:pt-8 xl:gap-20"
    >
      <div className="md:hidden">
        <HeroMobile />
      </div>
      <div className="hidden min-w-0 md:block">
        <GalleryC eager />
      </div>
      <div className="min-w-0 bg-ivory px-4 pb-2 pt-4 md:bg-transparent md:px-0 md:pt-1">
        <div className="hidden md:block">
          <TitleBlock />
        </div>
        <BuyBoxC ref={ctaRef} sel={sel} setSel={setSel} />
      </div>
    </section>
  )
}
