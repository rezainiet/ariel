import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Vrai une fois l'élément entré dans l'écran (une seule fois). Immédiat si mouvement réduit.
export function useRevealed({ threshold = 0.18, rootMargin = '0px 0px -8% 0px' } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced()) return setShown(true)
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

// Apparition douce (fondu + léger glissement), décalable pour les entrées en cascade.
export function Rise({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, shown] = useRevealed()
  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
      className={`transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// Révélation d'image : le cadre s'ouvre (clip-path) et la photo se pose (léger zoom arrière).
export function RevealFrame({ className = '', radius = '2rem', delay = 0, children }) {
  const [ref, shown] = useRevealed({ threshold: 0.12 })
  return (
    <div
      ref={ref}
      className={`overflow-hidden transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      style={{
        clipPath: shown ? `inset(0 0 0 0 round ${radius})` : `inset(7% 7% 7% 7% round ${radius})`,
        transitionDelay: `${delay}ms`,
        borderRadius: radius,
      }}
    >
      <div
        className="h-full w-full transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: shown ? 'scale(1)' : 'scale(1.07)', transitionDelay: `${delay}ms` }}
      >
        {children}
      </div>
    </div>
  )
}
