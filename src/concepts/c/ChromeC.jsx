import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { STORE, MERCHANT, DELIVERY } from '../../config/store.js'
import { Fact } from './Pending.jsx'

const NAV = [
  ['Offres', 'offres'],
  ['Le produit', 'produit'],
  ['Utilisation', 'utilisation'],
  ['Livraison & retours', 'livraison'],
  ['FAQ', 'faq'],
]

// Marque du détaillant (aucune croix suisse : usage réservé aux entreprises qui remplissent les critères Swissness).
export function Wordmark({ light = false, compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-[0.6rem] ${light ? 'bg-white/10' : 'bg-forest'}`}>
        <svg viewBox="0 0 32 32" className="h-[1.1rem] w-[1.1rem]" aria-hidden="true">
          <path d="M16 5c5 4.2 8 8.4 8 12.6A8 8 0 0 1 8 17.6C8 13.4 11 9.2 16 5Z" fill="#DDE8D8" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-[0.98rem] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>{STORE.name}</span>
        <span
          className={`mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${light ? 'text-white/60' : 'text-muted'} ${
            compact ? 'hidden sm:block' : 'max-[389px]:hidden'
          }`}
        >
          Déstockage · livraison en Suisse
        </span>
      </span>
    </span>
  )
}

export function HeaderC() {
  const { packs, hasItems, openDrawer } = useCart()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const go = (id) => {
    if (pathname !== '/' && pathname !== '/concept-c') return navigate(`/#${id}`)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-4 px-4 lg:h-[4.25rem] lg:px-8">
        <Link to="/" aria-label={`${STORE.name} — accueil`}>
          <Wordmark />
        </Link>
        <nav aria-label="Sections de la page" className="hidden items-center gap-1 lg:flex">
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
          aria-label={hasItems ? `Panier : ${packs} pack(s)` : 'Panier vide'}
          className="relative flex h-11 items-center gap-2 rounded-full border border-hair bg-white px-4 text-sm font-bold text-forest transition-colors hover:border-forest/40"
        >
          <ShoppingBag size={18} />
          <span className="hidden sm:inline">Panier</span>
          {hasItems && (
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-forest px-1 text-[0.68rem] font-bold text-white">
              {packs}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

export function FooterC({ withStickyPadding = false }) {
  const address = [MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const cols = [
    [
      'La boutique',
      [
        ['Les offres', '/#offres'],
        ['Le produit', '/#produit'],
        ['Mode d’emploi', '/#utilisation'],
        ['Questions fréquentes', '/#faq'],
      ],
    ],
    [
      'Service',
      [
        ['Contact & suivi de commande', '/contact'],
        ['Livraison', '/#livraison'],
        ['Retours & remboursements', '/retours-remboursements'],
      ],
    ],
    [
      'Informations légales',
      [
        ['Conditions générales de vente', '/conditions-generales-de-vente'],
        ['Politique de confidentialité', '/politique-de-confidentialite'],
        ['Mentions légales', '/mentions-legales'],
      ],
    ],
  ]
  return (
    <footer className={`bg-ink text-white ${withStickyPadding ? 'pb-24 lg:pb-0' : ''}`}>
      <div className="mx-auto max-w-[1320px] px-4 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="col-span-2 lg:col-span-1">
            <Wordmark light />
            <address className="mt-5 space-y-1 text-sm not-italic text-white/70">
              <p><Fact value={MERCHANT.legalName} missing="raison sociale" /></p>
              <p><Fact value={address} missing="adresse postale" /></p>
              <p><Fact value={MERCHANT.uid && `IDE ${MERCHANT.uid}`} missing="numéro IDE" /></p>
              <p>
                {STORE.supportEmail ? (
                  <a href={`mailto:${STORE.supportEmail}`} className="font-semibold text-white hover:underline">{STORE.supportEmail}</a>
                ) : (
                  <Fact value="" missing="e-mail" />
                )}
              </p>
            </address>
          </div>
          {cols.map(([title, links]) => (
            <nav key={title} aria-label={title}>
              <p className="text-[0.66rem] font-bold uppercase tracking-[0.2em] text-white/45">{title}</p>
              <ul className="mt-4 space-y-2.5">
                {links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-white/80 transition-colors hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/50 lg:flex-row lg:justify-between">
          <p>© {new Date().getFullYear()} {STORE.name} · Prix en CHF · Livraison offerte en Suisse · Retour sous {DELIVERY.returnWindowDays} jours</p>
          <p>Ariel est une marque de The Procter &amp; Gamble Company. Cette boutique n’est pas le site officiel de la marque.</p>
        </div>
      </div>
    </footer>
  )
}
