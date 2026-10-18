import { Link } from 'react-router-dom'
import { ShoppingBag, Truck, RotateCcw } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { STORE, DELIVERY } from '../../config/store.js'

export function HeaderC() {
  const { packs, hasItems, openDrawer } = useCart()
  return (
    <>
      <div className="bg-forest text-white">
        <p className="mx-auto flex h-8 max-w-[1280px] items-center justify-center gap-4 px-4 text-[0.72rem] font-semibold">
          <span className="flex items-center gap-1.5">
            <Truck size={13} /> Livraison offerte en Suisse
          </span>
          <span className="h-3 w-px bg-white/30" />
          <span className="flex items-center gap-1.5">
            <RotateCcw size={13} /> Retour sous {DELIVERY.returnWindowDays} jours
          </span>
        </p>
      </div>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 lg:px-8">
          <Link to="/concept-c" className="text-[1.02rem] font-extrabold tracking-tight text-forest">
            {STORE.name}
          </Link>
          <button
            onClick={openDrawer}
            aria-label={hasItems ? `Panier, ${packs} pack(s)` : 'Panier vide'}
            className="relative flex h-11 items-center gap-2 rounded-full bg-cloud px-4 text-sm font-bold text-forest transition-colors hover:bg-mint"
          >
            <ShoppingBag size={18} />
            <span className="tabular-nums">{hasItems ? `${packs} pack${packs > 1 ? 's' : ''}` : 'Panier'}</span>
          </button>
        </div>
      </header>
    </>
  )
}

export function FooterC() {
  const links = [
    ['Contact & suivi', '/contact'],
    ['Retours & remboursements', '/retours-remboursements'],
    ['CGV', '/conditions-generales-de-vente'],
    ['Confidentialité', '/politique-de-confidentialite'],
    ['Mentions légales', '/mentions-legales'],
  ]
  return (
    <footer className="border-t border-line bg-white pb-28 lg:pb-0">
      <div className="mx-auto max-w-[1280px] px-4 py-10 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-forest">{STORE.name}</p>
            <p className="mt-1 text-sm text-muted">
              Expédition depuis {DELIVERY.dispatchLocation} · Livraison offerte · Retour sous {DELIVERY.returnWindowDays} jours
            </p>
          </div>
          <nav aria-label="Liens utiles" className="flex flex-wrap gap-x-5 gap-y-2">
            {links.map(([l, to]) => (
              <Link key={l} to={to} className="text-sm font-medium text-ink/75 hover:text-forest">
                {l}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-line pt-5 text-xs text-muted">
          © {new Date().getFullYear()} {STORE.name} · Ariel est une marque de son titulaire, citée pour identifier le produit vendu.
        </p>
      </div>
    </footer>
  )
}
