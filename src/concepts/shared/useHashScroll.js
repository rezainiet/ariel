import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Fait défiler jusqu'à l'ancre (#offres, #faq…) à l'arrivée ou au changement de hash.
export function useHashScroll() {
  const { hash } = useLocation()
  useEffect(() => {
    if (!hash) return
    const id = decodeURIComponent(hash.slice(1))
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60)
    return () => clearTimeout(t)
  }, [hash])
}
