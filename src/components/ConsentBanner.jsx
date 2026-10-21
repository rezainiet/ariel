import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { initPixel, isPixelEnabled, trackPageView } from '../lib/pixel.js'

// Consentement avant tout pixel publicitaire (nLPD) — deux choix de même poids.
// N'apparaît que si un pixel Meta/Snap ou une attribution Everflow est configuré.
const KEY = 'consent.marketing.v1'

// Bandeau affiché ou non : la barre d'achat mobile s'efface tant qu'un choix est attendu (pas deux éléments fixés en bas).
let bannerOpen = false
const bannerListeners = new Set()
const setBannerOpen = (v) => {
  if (bannerOpen === v) return
  bannerOpen = v
  bannerListeners.forEach((fn) => fn())
}
export const useConsentBannerOpen = () =>
  useSyncExternalStore(
    (fn) => (bannerListeners.add(fn), () => bannerListeners.delete(fn)),
    () => bannerOpen,
    () => false
  )

function readChoice() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export default function ConsentBanner() {
  const [choice, setChoice] = useState(() => readChoice())
  const [everflowAttribution, setEverflowAttribution] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/payment/config').then((r) => r.ok ? r.json() : null).then((data) => {
      if (alive) setEverflowAttribution(data?.everflow?.attributionAvailable === true)
    }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (choice === 'granted') {
      initPixel()
      trackPageView()
    }
  }, [choice])

  const visible = (isPixelEnabled() || everflowAttribution) && !choice
  useEffect(() => {
    setBannerOpen(visible)
    return () => setBannerOpen(false)
  }, [visible])

  if (!visible) return null

  const decide = (value) => {
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* stockage indisponible : le choix vaut pour cette page */
    }
    setChoice(value)
  }

  return (
    <div role="dialog" aria-label="Cookies et mesure d’audience" className="fixed inset-x-3 bottom-3 z-[65] mx-auto max-w-xl animate-fade-up rounded-2xl border border-fr-line bg-white p-4 font-jakarta shadow-2xl sm:p-5">
      <p className="text-sm leading-relaxed text-fr-ink/80">
        Nous aimerions mesurer l’efficacité de nos publicités. Ce suivi est facultatif.{' '}
        <Link to="/politique-de-confidentialite" className="font-semibold text-fr-green underline">
          En savoir plus
        </Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => decide('denied')} className="h-11 rounded-full border-2 border-fr-green text-sm font-bold text-fr-green transition-[background-color,transform] duration-base ease-out-soft hover:bg-fr-mint motion-safe:active:scale-[0.98]">
          Uniquement nécessaires
        </button>
        <button onClick={() => decide('granted')} className="h-11 rounded-full border-2 border-fr-green bg-fr-green text-sm font-bold text-white transition-[background-color,transform] duration-base ease-out-soft hover:bg-[#0C6B3E] motion-safe:active:scale-[0.98]">
          Tout accepter
        </button>
      </div>
    </div>
  )
}
