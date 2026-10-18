import '@fontsource-variable/fraunces'
import { useState } from 'react'
import { DEFAULT_OFFER_ID } from '../../config/store.js'
import { useHashScroll } from '../shared/useHashScroll.js'
import { useCartSkin } from '../shared/useCartSkin.js'
import { useInView } from '../shared/hooks.js'
import { HeaderC, FooterC } from './ChromeC.jsx'
import HeroC from './HeroC.jsx'
import TrustC from './TrustC.jsx'
import { FormatSection, WashesSection, ClaimsSection, UsageSection } from './StoryC.jsx'
import { PhotosSection, DeliverySection, ReviewsSection, FaqSection } from './InfoC.jsx'
import StickyBarC from './StickyBarC.jsx'

// BOUTIQUE (Concept C révisé) — fondée sur SWISS-MARKET-RESEARCH.md
// 1. Héros + configurateur  2. Prix & vendeur  3–5. Le produit  6. Photos (mobile)
// 7. Mode d'emploi & sécurité  8. Avis (si source vérifiée)  9. Livraison/retours/paiement  10. FAQ
export default function ConceptC() {
  useHashScroll()
  useCartSkin('c')
  const [sel, setSel] = useState(DEFAULT_OFFER_ID) // sélection partagée configurateur / barre collante
  const [ctaRef, ctaInView] = useInView({ threshold: 0 })

  return (
    <div className="min-h-screen bg-ivory text-ink">
      <HeaderC />
      <main>
        <HeroC sel={sel} setSel={setSel} ctaRef={ctaRef} />
        <TrustC />
        <FormatSection />
        <WashesSection />
        <ClaimsSection />
        <PhotosSection />
        <UsageSection />
        <ReviewsSection />
        <DeliverySection />
        <FaqSection />
      </main>
      <FooterC withStickyPadding />
      <StickyBarC visible={!ctaInView} sel={sel} />
    </div>
  )
}
