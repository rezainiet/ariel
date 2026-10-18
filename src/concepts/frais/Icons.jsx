// Système d'icônes de la boutique : Lucide (trait 1.75, grille 24) + glyphes maison dessinés
// sur la même grille et le même trait. Toujours posés dans une tuile arrondie cohérente.

const STROKE = 1.75

// Capsule vue de dessus : coussin arrondi + tourbillon à trois compartiments.
export function PodIcon({ size = 24, strokeWidth = STROKE, className = '', ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5.5" />
      <path d="M12 7.5a4.5 4.5 0 0 1 4.5 4.5" />
      <path d="M16.5 12a4.5 4.5 0 0 1-4.5 4.5" />
      <path d="M12 16.5A4.5 4.5 0 0 1 7.5 12 4.5 4.5 0 0 1 12 7.5" />
      <path d="M12 7.5c-.8 1.6-.8 3 0 4.5s.8 2.9 0 4.5" />
    </svg>
  )
}

// Sachet refermable (silhouette du doypack avec zip).
export function PouchIcon({ size = 24, strokeWidth = STROKE, className = '', ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d="M5 4.5h14l-.6 12.6a3 3 0 0 1-3 2.9H8.6a3 3 0 0 1-3-2.9z" />
      <path d="M5.2 8h13.6" />
      <circle cx="12" cy="13.6" r="2.4" />
    </svg>
  )
}

const TONES = {
  mint: 'bg-fr-mint text-fr-green ring-1 ring-fr-green/10',
  white: 'bg-white text-fr-green ring-1 ring-fr-line shadow-[0_6px_16px_rgba(11,61,42,0.06)]',
  deep: 'bg-fr-deep text-fr-mint',
  glass: 'bg-white/80 text-fr-green ring-1 ring-white/60 backdrop-blur',
}
const SIZES = {
  sm: ['h-8 w-8 rounded-[10px]', 16],
  md: ['h-11 w-11 rounded-[14px]', 20],
  lg: ['h-14 w-14 rounded-[18px]', 24],
}

export function IconTile({ icon: Icon, tone = 'mint', size = 'md', round = false, className = '' }) {
  const [box, px] = SIZES[size]
  return (
    <span
      className={`inline-flex flex-none items-center justify-center transition-colors duration-200 ${box} ${
        round ? '!rounded-full' : ''
      } ${TONES[tone]} ${className}`}
      aria-hidden="true"
    >
      <Icon size={px} strokeWidth={STROKE} />
    </span>
  )
}

// Prix suisse « CHF 7.– » : le tiret est rapproché du point (approche de la police).
export function Chf({ v, format }) {
  const s = format(v)
  if (!s.endsWith('.–')) return s
  return (
    <span className="whitespace-nowrap">
      {s.slice(0, -1)}
      <span className="-ml-[0.12em]">–</span>
    </span>
  )
}
