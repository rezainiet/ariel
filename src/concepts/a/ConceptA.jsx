import '@fontsource-variable/fraunces'
import { useHashScroll } from '../shared/useHashScroll.js'
import { useCartSkin } from '../shared/useCartSkin.js'
import { UtilityBarA, HeaderA, FooterA } from './ChromeA.jsx'
import HeroA from './HeroA.jsx'
import { ClarityA, FactsA, RitualA, ServiceA, FaqA } from './SectionsA.jsx'
import ReviewsA from './ReviewsA.jsx'

// CONCEPT A — Swiss Luxury Commerce
// Ivoire, vert forêt, serif éditoriale ; une fiche produit premium dès l'arrivée.
export default function ConceptA() {
  useHashScroll()
  useCartSkin('a')
  return (
    <div className="min-h-screen bg-ivory text-ink">
      <UtilityBarA />
      <HeaderA />
      <main>
        <HeroA />
        <ClarityA />
        <FactsA />
        <RitualA />
        <ReviewsA />
        <ServiceA />
        <FaqA />
      </main>
      <FooterA />
    </div>
  )
}
