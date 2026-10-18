import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Truck, RotateCcw, MapPin } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { STORE, DELIVERY } from '../../config/store.js'

const NAV = [
  ['Offres', 'offres'],
  ['Le produit', 'produit'],
  ['Utilisation', 'utilisation'],
  ['Avis', 'avis'],
  ['Livraison', 'livraison'],
  ['FAQ', 'faq'],
]

const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export function UtilityBarA() {
  return (
    <div className="bg-forest text-[0.72rem] font-medium tracking-wide text-white/90">
      <div className="mx-auto flex h-8 max-w-[1320px] items-center justify-center gap-6 px-5 lg:justify-between lg:px-10">
        <span className="flex items-center gap-1.5">
          <Truck size={13} /> Livraison offerte en Suisse
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <MapPin size={13} /> Expédié depuis notre stock en {DELIVERY.dispatchLocation}
        </span>
        <span className="hidden items-center gap-1.5 lg:flex">
          <RotateCcw size={13} /> Retour possible sous {DELIVERY.returnWindowDays} jours
        </span>
      </div>
    </div>
  )
}

export function HeaderA() {
  const { packs, hasItems, openDrawer } = useCart()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 40)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? 'border-hair bg-ivory shadow-[0_1px_0_rgba(23,42,32,0.04)]' : 'border-transparent bg-ivory'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-6 px-5 lg:h-[4.5rem] lg:px-10">
        <Link to="/concept-a" className="flex flex-col leading-none" aria-label={`${STORE.name} — accueil`}>
          <span className="font-serif text-[1.15rem] font-semibold tracking-tight text-forest lg:text-[1.35rem]">
            {STORE.name}
          </span>
          <span className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-muted">
            Déstockage · Suisse
          </span>
        </Link>

        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {NAV.map(([label, id]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/75 transition-colors hover:bg-sand hover:text-forest"
            >
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={openDrawer}
          aria-label={hasItems ? `Panier, ${packs} pack(s)` : 'Panier vide'}
          className="relative flex h-11 items-center gap-2 rounded-full border border-hair bg-white pl-3.5 pr-4 text-sm font-semibold text-forest transition-colors hover:border-forest/40"
        >
          <ShoppingBag size={18} strokeWidth={1.8} />
          <span className="hidden sm:inline">Panier</span>
          <span
            className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.7rem] font-bold ${
              hasItems ? 'bg-forest text-white' : 'bg-sand text-muted'
            }`}
          >
            {packs}
          </span>
        </button>
      </div>
    </header>
  )
}

const FOOT = [
  {
    title: 'La boutique',
    links: [
      ['Les offres', '/concept-a#offres'],
      ['Le produit', '/concept-a#produit'],
      ['Avis clients', '/concept-a#avis'],
      ['Questions fréquentes', '/concept-a#faq'],
    ],
  },
  {
    title: 'Service',
    links: [
      ['Contact & suivi', '/contact'],
      ['Livraison', '/concept-a#livraison'],
      ['Retours & remboursements', '/retours-remboursements'],
    ],
  },
  {
    title: 'Informations légales',
    links: [
      ['Conditions générales de vente', '/conditions-generales-de-vente'],
      ['Politique de confidentialité', '/politique-de-confidentialite'],
      ['Mentions légales', '/mentions-legales'],
    ],
  },
]

export function FooterA() {
  return (
    <footer className="bg-forest text-white">
      <div className="mx-auto max-w-[1320px] px-5 py-14 lg:px-10 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 max-w-sm lg:col-span-1">
            <p className="font-serif text-2xl font-semibold">{STORE.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Déstockage de packs Ariel All-in-1 PODS. Livraison offerte en Suisse, expédition depuis
              notre stock en {DELIVERY.dispatchLocation}.
            </p>
            <p className="mt-4 text-sm text-white/70">
              {STORE.supportEmail ? (
                <a className="font-semibold text-white underline-offset-4 hover:underline" href={`mailto:${STORE.supportEmail}`}>
                  {STORE.supportEmail}
                </a>
              ) : (
                <Link to="/contact" className="font-semibold text-white underline-offset-4 hover:underline">
                  Contacter le service client
                </Link>
              )}
            </p>
          </div>
          {FOOT.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/50">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-white/85 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {STORE.name}</p>
          <p>Ariel est une marque de son titulaire, citée pour identifier le produit vendu.</p>
        </div>
      </div>
    </footer>
  )
}
