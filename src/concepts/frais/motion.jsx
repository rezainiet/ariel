import { useRevealed } from '../../lib/motion.js'

export { useRevealed }

// Apparition douce (fondu + léger glissement), décalable pour les entrées en cascade.
// Durée, amplitude et décalage : variables CSS (.reveal, src/index.css), réduites sur mobile.
// `from` : 'up' (défaut), 'left', 'right' ou 'scale' — une direction par section.
export function Rise({ as: Tag = 'div', delay = 0, from, className = '', style, children, ...rest }) {
  const [ref, shown] = useRevealed()
  return (
    <Tag
      ref={ref}
      data-from={from && from !== 'up' ? from : undefined}
      style={{ '--reveal-delay': `${delay}ms`, ...style }}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

// Révélation d'image : le cadre s'ouvre (clip-path) et la photo se pose (léger zoom arrière) ; fondu simple sur mobile.
export function RevealFrame({ className = '', radius = '2rem', delay = 0, children }) {
  const [ref, shown] = useRevealed({ threshold: 0.08 })
  return (
    <div
      ref={ref}
      className={`reveal-frame overflow-hidden ${shown ? 'is-in' : ''} ${className}`}
      style={{ '--frame-radius': radius, '--reveal-delay': `${delay}ms`, borderRadius: radius }}
    >
      <div className="reveal-media h-full w-full">{children}</div>
    </div>
  )
}
