import { createElement, useEffect, useRef, useState, useSyncExternalStore } from 'react'

// ─────────────────────────────────────────────────────────────
// Système de mouvement — logique partagée.
// Durées et courbes : variables CSS de src/index.css (classes Tailwind duration-base, ease-out-soft, animate-*).
// Mouvement réduit : les états changent immédiatement, sans déplacement ni attente de sortie.
// ─────────────────────────────────────────────────────────────

const REDUCED = '(prefers-reduced-motion: reduce)'
const DUR_EXIT = 200 // = --dur-exit

const hasWindow = typeof window !== 'undefined' && typeof window.matchMedia === 'function'

export const prefersReducedMotion = () => hasWindow && window.matchMedia(REDUCED).matches

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      if (!hasWindow) return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => hasWindow && window.matchMedia(query).matches,
    () => false
  )
}

export const useReducedMotion = () => useMediaQuery(REDUCED)

// Garde un élément monté le temps de son animation de sortie (panier, confirmation).
// `leaving` : appliquer la classe de sortie et rendre l'élément inerte.
export function usePresence(open, exitMs = DUR_EXIT) {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) return setMounted(true)
    const t = setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : exitMs)
    return () => clearTimeout(t)
  }, [open, exitMs])
  return { mounted: open || mounted, leaving: !open && mounted }
}

// Valeur qui change (prix, quantité) : rejoue une animation discrète à chaque changement,
// jamais au premier affichage. Le contenu reste lisible pendant toute la transition.
export function Swap({ value, as = 'span', anim = 'animate-swap-in', className = '', children, ...rest }) {
  const seen = useRef({ value, changed: false })
  if (seen.current.value !== value) seen.current = { value, changed: true }
  return createElement(as, { key: String(value), className: `${seen.current.changed ? anim : ''} ${className}`, ...rest }, children)
}

// Vrai une fois l'élément entré dans l'écran (une seule fois). Immédiat si mouvement réduit.
export function useRevealed({ rootMargin = '0px 0px -8% 0px', threshold = 0.12 } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return setShown(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])
  return [ref, shown]
}
