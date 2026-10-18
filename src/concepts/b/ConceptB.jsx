import '@fontsource-variable/space-grotesk'
import { useHashScroll } from '../shared/useHashScroll.js'
import { useCartSkin } from '../shared/useCartSkin.js'
import { HeaderB, FooterB } from './ChromeB.jsx'
import HeroB from './HeroB.jsx'
import { ExperienceB, NumbersB, GalleryB } from './StoryB.jsx'
import OffersB from './OffersB.jsx'
import ReviewsB from './ReviewsB.jsx'
import { ServiceB, FaqB } from './ServiceB.jsx'

// CONCEPT B — Modern Product Experience
// Sections sombres immersives, grotesque XXL, narration produit interactive.
export default function ConceptB() {
  useHashScroll()
  useCartSkin('b')
  return (
    <div className="min-h-screen bg-white text-night">
      <HeaderB />
      <main>
        <HeroB />
        <ExperienceB />
        <NumbersB />
        <OffersB />
        <GalleryB />
        <ReviewsB />
        <ServiceB />
        <FaqB />
      </main>
      <FooterB />
    </div>
  )
}
