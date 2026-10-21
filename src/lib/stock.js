// ─────────────────────────────────────────────────────────────
// Disponibilité des offres — lue sur le serveur (GET /api/stock), seule source de vérité.
// Aucune quantité n'est exposée au public : seulement « disponible / épuisé » par offre.
// Si le serveur ne répond pas, rien n'est marqué épuisé ici : le serveur refuse de toute façon
// une commande sans stock au moment du paiement.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'

const UNKNOWN = { ready: false, tracked: false, offers: {} }
let cache = null
let inflight = null
const listeners = new Set()

export function refreshStock() {
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const res = await fetch('/api/stock', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      cache = { ready: true, tracked: data?.tracked === true, offers: data?.offers && typeof data.offers === 'object' ? data.offers : {} }
    } catch {
      cache = { ...UNKNOWN, ready: true }
    } finally {
      inflight = null
    }
    listeners.forEach((fn) => fn(cache))
    return cache
  })()
  return inflight
}

export const isSoldOut = (stock, offerId) => stock.tracked && stock.offers[offerId]?.available === false

export function useStock() {
  const [stock, setStock] = useState(cache || UNKNOWN)
  useEffect(() => {
    listeners.add(setStock)
    if (!cache) refreshStock()
    const onVisible = () => document.visibilityState === 'visible' && refreshStock()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      listeners.delete(setStock)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return stock
}
