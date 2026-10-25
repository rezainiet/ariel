import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'
import { useConsentBannerOpen } from '../../components/ConsentBanner.jsx'
import { useI18n } from '../../i18n/index.jsx'
import { Packs } from './HeroF.jsx'
import { Chf } from './Icons.jsx'
import { Swap } from '../../lib/motion.js'

// Barre d'achat mobile : visible seulement une fois le bouton principal dépassé (au-dessus de l'écran),
// jamais pendant le panier ouvert ni pendant le choix des cookies. Respecte les zones sûres (encoche, barre d'accueil).
export default function StickyBuyF({ ctaRef, sel, disabled }) {
  const { selectOffer, drawerOpen } = useCart()
  const navigate = useNavigate()
  // Achat direct : l'offre choisie est placée au panier (sans doublon) puis la commande s'ouvre.
  const buyNow = () => {
    selectOffer(sel, { openDrawer: false, feedback: false })
    navigate('/checkout')
  }
  const [past, setPast] = useState(false)
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setPast(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [ctaRef])
  const { t, money, offer: getOffer } = useI18n()
  const offer = getOffer(sel)
  const consentOpen = useConsentBannerOpen()
  const shown = past && !drawerOpen && !disabled && !consentOpen

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 font-jakarta transition-[transform,opacity] duration-slow ease-out-soft lg:hidden ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
    >
      <div className="border-t border-fr-line bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(11,61,42,0.10)]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <a href="#offres" tabIndex={shown ? 0 : -1} className="flex min-w-0 flex-1 items-center gap-2.5" aria-label={t.sticky.change}>
            <span className="flex h-10 w-11 flex-none items-end justify-center rounded-xl bg-fr-mint pb-1 max-[359px]:hidden">
              <Swap value={offer.id} anim="animate-fade-in" className="flex">
                <Packs n={offer.packs} size="sm" />
              </Swap>
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[0.82rem] font-bold text-fr-ink">
                {t.common.sachets(offer.packs)}
              </span>
              <Swap value={offer.id} className="block text-[1.05rem] font-extrabold tracking-[-0.02em] text-fr-green"><Chf v={offer.price} format={money} /></Swap>
            </span>
          </a>
          <button
            onClick={buyNow}
            tabIndex={shown ? 0 : -1}
            className="flex h-12 flex-none items-center gap-2 rounded-full bg-fr-green px-5 text-[0.92rem] font-extrabold text-white shadow-[0_10px_22px_rgba(14,122,71,0.3)] transition-[transform,background-color] duration-base ease-out-soft hover:bg-[#0C6B3E] motion-safe:active:scale-[0.98]"
          >
            {t.sticky.buyNow} <ArrowRight size={17} strokeWidth={2.2} />

          </button>
        </div>
      </div>
    </div>
  )
}
