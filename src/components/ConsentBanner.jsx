import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { initPixel, isPixelEnabled, trackPageView } from '../lib/pixel.js'

// Consentement avant tout pixel publicitaire (nLPD) — deux choix de même poids.
// N'apparaît que si un pixel est réellement configuré (VITE_SNAP_PIXEL_ID).
const KEY = 'consent.marketing.v1'

function readChoice() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export default function ConsentBanner() {
  const [choice, setChoice] = useState(() => readChoice())

  useEffect(() => {
    if (choice === 'granted') {
      initPixel()
      trackPageView()
    }
  }, [choice])

  if (!isPixelEnabled() || choice) return null

  const decide = (value) => {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* stockage indisponible : le choix vaut pour la session */
    }
    setChoice(value)
  }

  return (
    <div role="dialog" aria-label="Cookies et mesure d’audience" className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-xl rounded-2xl border border-hair bg-white p-4 shadow-2xl sm:p-5">
      <p className="text-sm leading-relaxed text-ink/80">
        Nous aimerions mesurer l’efficacité de nos publicités (Snapchat). Ces cookies sont facultatifs.{' '}
        <Link to="/politique-de-confidentialite" className="font-semibold text-forest underline">
          En savoir plus
        </Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => decide('denied')} className="h-11 rounded-xl border-2 border-forest text-sm font-bold text-forest">
          Uniquement nécessaires
        </button>
        <button onClick={() => decide('granted')} className="h-11 rounded-xl border-2 border-forest bg-forest text-sm font-bold text-white">
          Tout accepter
        </button>
      </div>
    </div>
  )
}
