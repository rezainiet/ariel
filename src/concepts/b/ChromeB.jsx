import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowUpRight } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { STORE, DELIVERY } from '../../config/store.js'

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export function HeaderB() {
  const { packs, hasItems, openDrawer } = useCart()
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 24)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        solid ? 'bg-night/90 shadow-[0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 lg:px-12">
        <Link to="/concept-b" className="font-grotesk text-lg font-bold tracking-tight text-white">
          {STORE.name}
          <span className="text-pollen">.</span>
        </Link>
        <nav aria-label="Sections" className="hidden items-center gap-8 text-sm font-medium text-white/70 lg:flex">
          {[
            ['Produit', 'experience'],
            ['Galerie', 'galerie'],
            ['Offres', 'offres'],
            ['Avis', 'avis'],
            ['FAQ', 'faq'],
          ].map(([l, id]) => (
            <button key={id} onClick={() => go(id)} className="transition-colors hover:text-white">
              {l}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => go('offres')}
            className="hidden h-10 rounded-full bg-white px-5 text-sm font-semibold text-night transition-colors hover:bg-pollen sm:block"
          >
            Acheter
          </button>
          <button
            onClick={openDrawer}
            aria-label={hasItems ? `Panier, ${packs} pack(s)` : 'Panier vide'}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <ShoppingBag size={18} />
            {hasItems && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pollen px-1 text-[0.68rem] font-bold text-night">
                {packs}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export function FooterB() {
  const links = [
    ['Contact & suivi', '/contact'],
    ['Retours & remboursements', '/retours-remboursements'],
    ['Conditions générales de vente', '/conditions-generales-de-vente'],
    ['Politique de confidentialité', '/politique-de-confidentialite'],
    ['Mentions légales', '/mentions-legales'],
  ]
  return (
    <footer className="overflow-hidden bg-night text-white">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-16 lg:px-12">
        <div className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="max-w-md font-grotesk text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
              Une question avant de commander&nbsp;?
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-pollen px-6 text-sm font-semibold text-night hover:bg-white"
            >
              Contacter le service client <ArrowUpRight size={16} />
            </Link>
            <p className="mt-4 text-sm text-white/55">
              Livraison offerte en Suisse · Expédition depuis {DELIVERY.dispatchLocation} · Retour sous{' '}
              {DELIVERY.returnWindowDays} jours
            </p>
          </div>
          <ul className="grid content-start gap-x-8 gap-y-1 sm:grid-cols-2">
            {links.map(([l, to]) => (
              <li key={l}>
                <Link to={to} className="flex items-center justify-between border-b border-white/10 py-3 text-sm text-white/75 hover:text-white">
                  {l} <ArrowUpRight size={14} className="text-white/30" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p
          aria-hidden="true"
          className="mt-8 select-none whitespace-nowrap font-grotesk text-[17vw] font-bold leading-[0.8] tracking-[-0.06em] text-white/[0.06] lg:text-[11rem]"
        >
          60 PODS
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {STORE.name}</p>
          <p>Ariel est une marque de son titulaire, citée pour identifier le produit vendu.</p>
        </div>
      </div>
    </footer>
  )
}
