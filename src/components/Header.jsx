import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { STORE } from '../config/store.js'

export default function Header() {
  const { packs, openDrawer, hasItems } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll doux vers les offres (ou navigue vers l'accueil puis scrolle).
  const goToOffers = (e) => {
    e.preventDefault()
    if (pathname !== '/') {
      navigate('/#offres')
      return
    }
    document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-canvas/85 backdrop-blur-md border-b border-line' : 'bg-canvas border-b border-transparent'
      }`}
    >
      <div className="container-edge flex h-14 items-center justify-between sm:h-16">
        {/* Logo / nom de la boutique */}
        <Link to="/" className="flex items-center gap-2" aria-label={`${STORE.name} — accueil`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-white">
            <svg viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true">
              <path d="M16 6c4.4 3.6 7 7.2 7 10.8A7 7 0 0 1 9 16.8C9 13.2 11.6 9.6 16 6Z" fill="#DDE8D8" />
            </svg>
          </span>
          <span className="text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-forest">
            {STORE.name}
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={goToOffers}
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink/80 transition-colors hover:text-forest sm:block"
          >
            Les offres
          </button>

          <button
            onClick={openDrawer}
            aria-label="Ouvrir le panier"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-sage/50"
          >
            <ShoppingBag size={20} strokeWidth={1.9} />
            {hasItems && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-forest px-1 text-[0.7rem] font-bold text-white">
                {packs}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
