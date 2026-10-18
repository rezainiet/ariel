import { Star } from 'lucide-react'

// Étoiles avec remplissage partiel (ex. moyenne 4.4).
export default function Stars({ value = 0, size = 16, className = '', color = 'text-amber-500', label }) {
  return (
    <span
      className={`relative inline-flex ${className}`}
      role="img"
      aria-label={label || `${value} sur 5`}
    >
      <span className="flex text-current opacity-25">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="fill-current" strokeWidth={0} />
        ))}
      </span>
      <span
        className={`absolute inset-0 flex overflow-hidden ${color}`}
        style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}
        aria-hidden="true"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={size} className="flex-none fill-current" strokeWidth={0} />
        ))}
      </span>
    </span>
  )
}
