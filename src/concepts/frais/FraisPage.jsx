import '@fontsource-variable/plus-jakarta-sans'
import { useRef, useState } from 'react'
import { DEFAULT_OFFER_ID } from '../../config/store.js'
import { useStoreStatus } from '../../lib/storeStatus.js'
import { useStock, isSoldOut } from '../../lib/stock.js'
import { useHashScroll } from '../shared/useHashScroll.js'
import { useCartSkin } from '../shared/useCartSkin.js'
import { usePublishedReviews } from '../../lib/usePublishedReviews.js'
import { Announcement, HeaderF, FooterF } from './ChromeF.jsx'
import HeroF from './HeroF.jsx'
import StoryF, { FinalCta } from './StoryF.jsx'
import { ReviewsF, VideoF, ServiceF, FaqF } from './InfoF.jsx'
import StickyBuyF from './StickyBuyF.jsx'

// BOUTIQUE — Concept 2 « Frais » (approuvé).
// Parcours : 1. annonce · 2. héros + 3 offres (la scène montre les sachets de l'offre choisie)
// 3. le geste · 4. la quantité (même sélection que le héros) · 5. ce que promet l'emballage
// 6. avis externes identifiés · 7. vidéo (fichier réel) · 8. livraison & retours
// 9. bon à savoir (produit, sécurité, questions) · 10. rappel de la sélection (desktop) · pied de page.
// Une seule action principale à chaque étape : sur mobile, la barre d'achat prend le relais après le héros.
export default function FraisPage() {
  useHashScroll()
  useCartSkin('f')
  const [sel, setSel] = useState(DEFAULT_OFFER_ID)
  const ctaRef = useRef(null)
  const status = useStoreStatus()
  const stock = useStock()
  const reviewState = usePublishedReviews()
  const soldOut = status.stock?.available === 0 || isSoldOut(stock, sel)

  return (
    <div className="min-h-screen bg-white font-jakarta text-fr-ink">
      <Announcement />
      <HeaderF />
      <main>
        <HeroF sel={sel} setSel={setSel} ctaRef={ctaRef} status={status} reviewState={reviewState} />
        <StoryF sel={sel} setSel={setSel} stock={stock} soldOut={soldOut} />
        <VideoF />
        <ReviewsF reviewState={reviewState} />
        <ServiceF />
        <FaqF />
        <FinalCta sel={sel} soldOut={soldOut} />
      </main>
      <FooterF stickyPad />
      <StickyBuyF ctaRef={ctaRef} sel={sel} disabled={soldOut} />
    </div>
  )
}
