import { CircleDashed } from 'lucide-react'

// Donnée marchand manquante : visible en développement (à fournir), absente en production.
// Jamais de valeur inventée à la place.
export function Pending({ children, block = false }) {
  if (!import.meta.env.DEV) return null
  const Tag = block ? 'p' : 'span'
  return (
    <Tag
      className={`${block ? 'flex' : 'inline-flex'} items-center gap-1.5 rounded-md border border-dashed border-amber-500/60 bg-amber-50 px-2 py-0.5 text-[0.72rem] font-semibold text-amber-900`}
    >
      <CircleDashed size={12} className="flex-none" /> À fournir : {children}
    </Tag>
  )
}

// Affiche la valeur si elle existe, sinon le marqueur « à fournir » (dev) ou rien (prod).
export function Fact({ value, missing }) {
  return value ? <>{value}</> : <Pending>{missing}</Pending>
}
