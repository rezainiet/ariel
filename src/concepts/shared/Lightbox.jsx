import { useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

// Visionneuse plein écran accessible : Échap, flèches, clic hors image.
export default function Lightbox({ images, index, onClose, onIndex }) {
  const closeRef = useRef(null)
  const open = index !== null && index !== undefined

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % images.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + images.length) % images.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, index, images.length, onClose, onIndex])

  if (!open) return null
  const img = images[index]

  return (
    <div
      className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-[#0b120e]/[0.92] p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie produit"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Fermer la galerie"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={22} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onIndex((index - 1 + images.length) % images.length)
            }}
            aria-label="Image précédente"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onIndex((index + 1) % images.length)
            }}
            aria-label="Image suivante"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <figure className="flex max-h-full max-w-4xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          className="max-h-[78vh] w-auto animate-swap-in rounded-xl bg-white object-contain"
        />
        <figcaption className="mt-4 text-center text-sm text-white/75">
          {img.alt} <span className="text-white/40">· {index + 1}/{images.length}</span>
        </figcaption>
      </figure>
    </div>
  )
}
