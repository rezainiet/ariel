import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Truck, RotateCcw, Tag } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { MERCHANT, STORE } from '../../config/store.js'
import MissingInfo from '../../components/ui/MissingInfo.jsx'
import LanguageSwitcher from '../../components/LanguageSwitcher.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { Swap } from '../../lib/motion.js'

const ICONS = [Tag, Truck, RotateCcw]

// Prix d'entrée (offre la moins chère) dans la devise du visiteur.
const entryPrice = (offers, money) => money(Math.min(...offers.map((o) => o.price)))

// Bandeau d'annonce : desktop = les trois messages côte à côte ; mobile = fondu enchaîné lent
// (pas de défilement), en pause au survol/focus et figé si l'utilisateur réduit les animations.
export function Announcement() {
  const { t, offers, money } = useI18n()
  const from = entryPrice(offers, money)
  const ANNOUNCEMENTS = [t.announce.clearance(from), t.announce.freeDelivery, t.announce.returns]
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setI((n) => (n + 1) % ANNOUNCEMENTS.length), 4500)
    return () => clearInterval(id)
  }, [paused])
  return (
    <div
      className="relative bg-fr-deep text-[0.75rem] font-semibold text-fr-mint"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex h-9 max-w-[1320px] items-center justify-center px-4">
        <ul className="hidden items-center gap-8 md:flex">
          {ANNOUNCEMENTS.map((m, k) => {
            const Icon = ICONS[k]
            return (
              <li key={m} className={`flex items-center gap-2 ${k === 0 ? 'text-white' : ''}`}>
                <Icon size={14} strokeWidth={1.9} className="text-fr-leaf" aria-hidden="true" />
                <span className={k === 0 ? 'uppercase tracking-[0.12em]' : ''}>{m}</span>
              </li>
            )
          })}
        </ul>
        <p className="flex items-center gap-2 md:hidden" aria-live="off">
          {(() => {
            const Icon = ICONS[i]
            return (
              <span key={i} className="flex animate-msg-in items-center gap-2">
                <Icon size={13} strokeWidth={1.9} className="text-fr-leaf" aria-hidden="true" />
                <span className={`whitespace-nowrap ${i === 0 ? 'uppercase tracking-[0.1em] text-white max-[379px]:tracking-[0.05em]' : ''}`}>
                  {i === 0 ? (
                    <>
                      <span className="max-[379px]:hidden">{ANNOUNCEMENTS[0]}</span>
                      <span className="min-[380px]:hidden">{t.announce.clearanceShort(from)}</span>
                    </>
                  ) : (
                    ANNOUNCEMENTS[i]
                  )}
                </span>
              </span>
            )
          })()}
        </p>
      </div>
    </div>
  )
}

export function Logo({ light = false }) {
  const { t } = useI18n()
  return (
    <Link to="/" className="flex items-center gap-2.5 font-jakarta text-[1.02rem] font-extrabold tracking-[-0.02em] text-fr-ink">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-fr-leaf to-fr-green text-white shadow-[0_4px_10px_rgba(14,122,71,0.3)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.5 21.5 12 12 21.5 2.5 12z" />
        </svg>
      </span>
      {/* Nom commercial réel s'il est configuré ; sinon libellé descriptif neutre (aucun nom inventé). */}
      {STORE.name ? (
        <span className="max-[359px]:text-[0.9rem]">{STORE.name}</span>
      ) : (
        <span className="leading-none">
          {t.logo.top}
          <span className={`block text-[0.62rem] font-bold uppercase tracking-[0.18em] ${light ? 'text-fr-leaf' : 'text-fr-green'}`}>{t.logo.bottom}</span>
        </span>
      )}
    </Link>
  )
}

export function HeaderF() {
  const { packs, openDrawer, addedAt } = useCart()
  const { t } = useI18n()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header
      className={`sticky top-0 z-40 border-b bg-white/[0.97] transition-shadow duration-300 lg:bg-white/90 lg:backdrop-blur-md ${
        scrolled ? 'border-fr-line shadow-[0_6px_24px_rgba(11,61,42,0.06)]' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-10 px-4 lg:h-[4.5rem] lg:px-8">
        <Logo />
        <nav aria-label={t.nav.label} className="hidden gap-8 font-jakarta text-[0.9rem] font-semibold text-fr-ink/80 lg:flex">
          {t.nav.items.map(([label, href]) => (
            <a key={href} href={href} className="relative py-2 transition-colors hover:text-fr-green after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-fr-green after:transition-transform after:duration-base after:ease-out-soft hover:after:scale-x-100">
              {label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:gap-2.5">
          <LanguageSwitcher />
          <button
            onClick={openDrawer}
            aria-label={packs ? t.nav.cartCount(packs) : t.nav.cartEmpty}
            className="relative flex h-11 items-center gap-2 rounded-full bg-fr-mint px-3.5 font-jakarta text-sm font-bold text-fr-deep transition-[background-color,transform] duration-base ease-out-soft hover:bg-fr-mint2 motion-safe:active:scale-[0.97] lg:px-4"
          >
            {/* Ajout au panier : un seul anneau qui s'efface (jamais une confirmation de commande) */}
            <Swap value={addedAt} anim="glow-once" className="pointer-events-none absolute inset-0 rounded-full" aria-hidden="true" />
            <ShoppingBag size={19} strokeWidth={1.9} />
            <span className="hidden lg:inline">{t.nav.cart}</span>
            {/* La pastille se pose en douceur quand le contenu du panier change */}
            <Swap
              value={packs}
              anim="animate-pop"
              className={`flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.68rem] font-extrabold ${
                packs ? 'bg-fr-green text-white' : 'bg-white text-fr-muted'
              }`}
            >
              {packs}
            </Swap>
          </button>
        </div>
      </div>
    </header>
  )
}

export function FooterF({ stickyPad = false }) {
  const { t, currency } = useI18n()
  const f = t.footer
  const address = [MERCHANT.street, MERCHANT.zip, MERCHANT.city].every(Boolean)
    ? `${MERCHANT.street}, ${MERCHANT.zip} ${MERCHANT.city}, ${t.common.country}` : null
  const merchantLines = [
    ['legal', MERCHANT.legalName || <MissingInfo>{f.missingLegal}</MissingInfo>],
    ['address', address || <MissingInfo>{f.missingAddress}</MissingInfo>],
    ['uid', MERCHANT.uid ? f.uid(MERCHANT.uid) : <MissingInfo>{f.missingUid}</MissingInfo>],
    ['email', STORE.supportEmail || <MissingInfo>{f.missingEmail}</MissingInfo>],
  ]
  return (
    <footer className={`bg-fr-deep font-jakarta text-fr-mint/80 ${stickyPad ? 'pb-28 lg:pb-0' : ''}`}>
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="[&_a]:text-white [&_a>span:last-child]:text-white">
            <Logo light />
          </div>
          <address className="mt-5 space-y-1 text-sm not-italic leading-relaxed">
            {merchantLines.map(([key, value]) => (
              <span key={key} className="block">{value}</span>
            ))}
          </address>
        </div>
        {f.columns.map(([title, links]) => (
          <div key={title}>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-fr-mint/50">{title}</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {links.map(([label, to]) => (
                <li key={label}>
                  {to.startsWith('/#') ? (
                    <a href={to} className="transition-colors hover:text-white">{label}</a>
                  ) : (
                    <Link to={to} className="transition-colors hover:text-white">{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-2 px-4 py-6 text-xs text-fr-mint/55 lg:flex-row lg:justify-between lg:px-8">
          <p>{f.bottom(currency)}</p>
          <p>
            {f.brand}{' '}
            {/* Mention exigée par la licence CC BY 4.0 de la base pays (server/update-geoip.mjs). */}
            <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-white hover:underline">{f.geoCredit}</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
