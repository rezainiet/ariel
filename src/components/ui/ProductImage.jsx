import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Image produit tolérante aux assets manquants.
// Tant que les vraies photos Ariel ne sont pas fournies, affiche
// un emplacement élégant (pas de pixelisation, pas de faux visuel).
// Déposer les fichiers dans /public/images/ puis renseigner `src`.
// ─────────────────────────────────────────────────────────────
export default function ProductImage({
  src,
  alt = '',
  label,
  ratio = '1 / 1',
  rounded = 'rounded-xl2',
  className = '',
  imgClassName = '',
  fit = 'cover',
  compact = false,
  loading = 'lazy',
  sizes,
}) {
  const [failed, setFailed] = useState(false)
  const showPlaceholder = !src || failed

  return (
    <div
      className={`relative overflow-hidden ${rounded} bg-gradient-to-br from-sage/60 via-canvas to-white ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {showPlaceholder ? (
        compact ? (
          // Vignette compacte : icône seule, pas de texte (évite le débordement)
          <div className="absolute inset-0 flex items-center justify-center text-forest/70">
            <ImageIcon size={18} strokeWidth={1.6} />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-forest">
              <ImageIcon size={20} strokeWidth={1.75} />
            </div>
            <p className="text-xs font-medium leading-snug text-muted">
              {label || 'Photographie produit'}
              <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.14em] text-muted/70">
                Asset à fournir
              </span>
            </p>
            {/* Filet décoratif discret pour garder une composition soignée */}
            <div className="pointer-events-none absolute inset-3 rounded-[inherit] border border-dashed border-forest/15" />
          </div>
        )
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          sizes={sizes}
          onError={() => setFailed(true)}
          className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${imgClassName}`}
        />
      )}
    </div>
  )
}
