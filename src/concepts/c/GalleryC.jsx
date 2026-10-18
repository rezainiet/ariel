import { useState } from 'react'
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react'
import Lightbox from '../shared/Lightbox.jsx'
import { useSwipe } from '../shared/hooks.js'
import { C_GALLERY } from './media.js'

function StageImage({ item, eager }) {
  if (item.picture) {
    return (
      <picture>
        <source type="image/avif" srcSet={item.picture.avif} sizes="(min-width:1024px) 58vw, 100vw" />
        <source type="image/webp" srcSet={item.picture.webp} sizes="(min-width:1024px) 58vw, 100vw" />
        <img
          src={item.picture.src}
          alt={item.alt}
          width={item.picture.width}
          height={item.picture.height}
          fetchpriority={eager ? 'high' : undefined}
          loading={eager ? 'eager' : 'lazy'}
          className="h-full w-full animate-fade-in object-cover"
        />
      </picture>
    )
  }
  if (item.lowRes) {
    // Visuel basse résolution : présenté à taille raisonnable, en tirage encadré.
    return (
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        className="max-h-[78%] max-w-[70%] animate-fade-in rounded-xl object-contain shadow-[0_20px_40px_rgba(23,42,32,0.18)]"
      />
    )
  }
  return <img src={item.src} alt={item.alt} loading="lazy" className="h-full w-full animate-fade-in object-contain p-8" />
}

// Galerie produit : image dominante, vignettes, compteur, balayage, zoom.
export default function GalleryC({ images = C_GALLERY, eager = false, className = '' }) {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(null)
  const n = images.length
  const prev = () => setI((v) => (v - 1 + n) % n)
  const next = () => setI((v) => (v + 1) % n)
  const swipe = useSwipe(prev, next)
  const item = images[i]

  return (
    <div className={className}>
      <div
        {...swipe}
        className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.25rem] bg-sand"
      >
        <StageImage key={item.src} item={item} eager={eager && i === 0} />

        <button
          onClick={() => setZoom(i)}
          aria-label="Agrandir l’image"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm backdrop-blur transition-transform hover:scale-105"
        >
          <Expand size={16} />
        </button>
        <button
          onClick={prev}
          aria-label="Image précédente"
          className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          aria-label="Image suivante"
          className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-forest shadow-sm opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
        >
          <ChevronRight size={18} />
        </button>

        <p className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur">
          <span className="tabular-nums" aria-live="polite">
            {i + 1} / {n}
          </span>
          <span className="h-3 w-px bg-ink/20" />
          <span className="font-medium text-muted">{item.caption}</span>
        </p>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar" role="group" aria-label="Choisir une photo">
        {images.map((g, k) => (
          <button
            key={g.src}
            onClick={() => setI(k)}
            aria-label={g.alt}
            aria-pressed={k === i}
            className={`h-16 w-16 flex-none overflow-hidden rounded-xl border-2 bg-sand transition-all lg:h-[4.5rem] lg:w-[4.5rem] ${
              k === i ? 'border-forest' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={g.thumb || g.src}
              alt=""
              loading="lazy"
              className={`h-full w-full ${g.fit === 'contain' ? 'object-contain p-1' : 'object-cover'}`}
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={images.map((g) => ({ src: g.src, alt: g.alt }))}
        index={zoom}
        onClose={() => setZoom(null)}
        onIndex={setZoom}
      />
    </div>
  )
}
