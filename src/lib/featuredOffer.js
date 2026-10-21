import { useEffect, useState } from 'react'
import { getOffer } from '../config/offers.js'

export function useFeaturedOffer() {
  const [featured, setFeatured] = useState(null)
  useEffect(() => {
    let alive = true
    let timer
    async function refresh() {
      try {
        const res = await fetch('/api/featured-offer', { cache: 'no-store' })
        if (!res.ok) throw new Error('unavailable')
        const data = await res.json()
        const end = Date.parse(data.endsAt)
        const server = Date.parse(data.serverTime)
        if (!getOffer(data.offerId) || !Number.isFinite(end) || !Number.isFinite(server)) throw new Error('invalid')
        if (!alive) return
        const offset = server - Date.now()
        setFeatured({ offerId: data.offerId, endsAt: data.endsAt, offset })
        timer = setTimeout(refresh, Math.max(1_000, Math.min(end - server + 500, 2_147_000_000)))
      } catch {
        if (alive) setFeatured(null)
      }
    }
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer)
        refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => { alive = false; clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [])
  return featured
}
