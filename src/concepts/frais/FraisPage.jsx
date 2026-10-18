import '@fontsource-variable/plus-jakarta-sans'
import { useRef, useState } from 'react'
import { DEFAULT_OFFER_ID } from '../../config/store.js'
import { useStoreStatus } from '../../lib/storeStatus.js'
import { useHashScroll } from '../shared/useHashScroll.js'
import { useCartSkin } from '../shared/useCartSkin.js'
import { Announcement, HeaderF, FooterF } from './ChromeF.jsx'
import HeroF from './HeroF.jsx'
import StoryF from './StoryF.jsx'
import { ReviewsF, VideoF, ServiceF, FaqF } from './InfoF.jsx'
import StickyBuyF from './StickyBuyF.jsx'

// BOUTIQUE — Concept 2 « Frais » (approuvé).
// Parcours : 1. annonce · 2. héros + 3 offres · 3. ajout au panier (+ motivation d'achat vérifiée)
// 4. « Pourquoi choisir » · 5. avis (source vérifiée) · 6. vidéo (fichier réel) · 7. livraison & retours
// 8. FAQ · 9. marchand & pied de page.
export default function FraisPage() {
  useHashScroll()
  useCartSkin('f')
  const [sel, setSel] = useState(DEFAULT_OFFER_ID)
  const ctaRef = useRef(null)
  const status = useStoreStatus()

  return (
    <div className="min-h-screen bg-white font-jakarta text-fr-ink">
      <Announcement />
      <HeaderF />
      <main>
        <HeroF sel={sel} setSel={setSel} ctaRef={ctaRef} status={status} />
        <StoryF setSel={setSel} />
        <ReviewsF />
        <VideoF />
        <ServiceF />
        <FaqF />
      </main>
      <FooterF stickyPad />
      <StickyBuyF ctaRef={ctaRef} sel={sel} disabled={status.stock?.available === 0} />
    </div>
  )
}
