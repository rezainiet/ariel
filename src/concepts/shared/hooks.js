import { useEffect, useRef, useState } from 'react'

// Balayage horizontal tactile léger (galeries mobiles).
export function useSwipe(onPrev, onNext, threshold = 40) {
  const start = useRef(null)
  return {
    onTouchStart: (e) => {
      start.current = e.touches[0].clientX
    },
    onTouchEnd: (e) => {
      if (start.current == null) return
      const dx = e.changedTouches[0].clientX - start.current
      if (Math.abs(dx) > threshold) (dx < 0 ? onNext : onPrev)()
      start.current = null
    },
  }
}

// Vrai tant que l'élément observé est visible (ex. barre d'achat sticky).
export function useInView(options = { threshold: 0 }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), options)
    io.observe(el)
    return () => io.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return [ref, inView]
}

// Navigation clavier d'un groupe radio (flèches) avec focus itinérant.
export function radioKeyHandler(index, count, select, refs) {
  return (e) => {
    let j = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (index + 1) % count
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (index - 1 + count) % count
    if (j === null) return
    e.preventDefault()
    select(j)
    refs.current[j]?.focus()
  }
}

// Retour visuel temporaire « Ajouté » sur un bouton.
export function useFlash(ms = 1600) {
  const [on, setOn] = useState(false)
  const t = useRef()
  useEffect(() => () => clearTimeout(t.current), [])
  return [
    on,
    () => {
      setOn(true)
      clearTimeout(t.current)
      t.current = setTimeout(() => setOn(false), ms)
    },
  ]
}
