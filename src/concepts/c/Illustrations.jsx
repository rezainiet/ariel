// Illustrations au trait pour le mode d'emploi — dessinées pour la boutique, sans logo ni étiquette.
const base = {
  viewBox: '0 0 120 120',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

// Capsule stylisée (forme générique, pas de reproduction de la marque)
function Pod({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-11" y="-9" width="22" height="18" rx="7" fill="#DDE8D8" stroke="currentColor" />
      <path d="M-5 -1c2-4 8-4 9 0" />
      <circle cx="-2" cy="2" r="2.2" fill="currentColor" stroke="none" />
    </g>
  )
}

function Machine({ children }) {
  return (
    <>
      <rect x="22" y="14" width="76" height="92" rx="10" />
      <path d="M22 32h76" />
      <circle cx="36" cy="23" r="3" />
      <path d="M48 23h22" />
      <circle cx="60" cy="68" r="27" />
      <circle cx="60" cy="68" r="19" strokeDasharray="3 4" opacity=".55" />
      {children}
    </>
  )
}

export function IllustrationDrum(props) {
  return (
    <svg {...base} {...props}>
      <Machine>
        <Pod x={60} y={78} s={0.9} />
        <path d="M60 36v14m-5-5 5 5 5-5" />
      </Machine>
    </svg>
  )
}

export function IllustrationLaundry(props) {
  return (
    <svg {...base} {...props}>
      <Machine>
        <path d="M44 72c6-6 12-6 16-2s10 4 16-2" />
        <path d="M46 80c5-3 10-3 14 0s9 3 14 0" />
        <Pod x={60} y={88} s={0.6} />
      </Machine>
    </svg>
  )
}

export function IllustrationDryHands(props) {
  return (
    <svg {...base} {...props}>
      {/* main ouverte tenant une capsule */}
      <path d="M30 86c0-14 6-22 14-26l18-9c4-2 8 1 6 5l-6 9 18-4c4-1 6 4 2 6l-14 7 16-2c4 0 5 5 1 6l-16 4 12 1c4 0 4 5 0 6l-26 3c-10 1-25-1-25-10z" />
      <Pod x={66} y={40} s={1} />
      {/* goutte barrée : mains sèches */}
      <path d="M96 22c5 7 7 11 7 14a7 7 0 0 1-14 0c0-3 2-7 7-14z" />
      <path d="M86 46 106 20" />
    </svg>
  )
}

export function IllustrationStore(props) {
  return (
    <svg {...base} {...props}>
      {/* armoire murale fermée */}
      <rect x="48" y="12" width="52" height="40" rx="5" />
      <path d="M74 12v40" />
      <circle cx="70" cy="34" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="78" cy="34" r="1.6" fill="currentColor" stroke="none" />
      <rect x="82" y="26" width="10" height="8" rx="2" />
      <path d="M84 26v-3a3 3 0 0 1 6 0v3" />
      {/* cote de hauteur */}
      <path d="M26 52v54M22 52h8M22 106h8" />
      <path d="M26 52l-3 5m3-5 3 5M26 106l-3-5m3 5 3-5" />
      <path d="M18 108h86" opacity=".5" />
    </svg>
  )
}

export const ILLUSTRATIONS = {
  drum: IllustrationDrum,
  laundry: IllustrationLaundry,
  dry: IllustrationDryHands,
  store: IllustrationStore,
}
