import { useState } from 'react'
import { DEFAULT_OFFER_ID } from '../../config/store.js'
import { useHashScroll } from '../shared/useHashScroll.js'
import { useCartSkin } from '../shared/useCartSkin.js'
import { useInView } from '../shared/hooks.js'
import { HeaderC, FooterC } from './ChromeC.jsx'
import BuyC from './BuyC.jsx'
import { CompareC, ProductDetailsC, ReviewsC, FaqC } from './DetailsC.jsx'
import StickyBarC from './StickyBarC.jsx'

// CONCEPT C — Premium Conversion Commerce
// Fiche produit compacte, offre sélectionnable dès le premier écran, barre d'achat collante.
export default function ConceptC() {
  useHashScroll()
  useCartSkin('c')
  const [sel, setSel] = useState(DEFAULT_OFFER_ID) // sélection partagée héros / comparatif / barre
  const [ctaRef, ctaInView] = useInView({ threshold: 0 })

  return (
    <div className="min-h-screen bg-white text-ink">
      <HeaderC />
      <main>
        <BuyC sel={sel} setSel={setSel} ctaRef={ctaRef} />
        <CompareC sel={sel} setSel={setSel} />
        <ProductDetailsC />
        <ReviewsC />
        <FaqC />
      </main>
      <FooterC />
      <StickyBarC visible={!ctaInView} sel={sel} />
    </div>
  )
}
