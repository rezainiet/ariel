import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import Offers from '../components/Offers.jsx'
import LifestyleBanner from '../components/LifestyleBanner.jsx'
import TrustBar from '../components/TrustBar.jsx'
import ProductInfo from '../components/ProductInfo.jsx'
import Delivery from '../components/Delivery.jsx'
import Faq from '../components/Faq.jsx'

export default function Home() {
  const { hash } = useLocation()

  // Permet aux liens /#offres (depuis une autre page) de défiler à l'arrivée.
  useEffect(() => {
    if (!hash) return
    const id = hash.replace('#', '')
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [hash])

  return (
    <>
      <Hero />
      <TrustBar />
      <Offers />
      <LifestyleBanner />
      <ProductInfo />
      <Delivery />
      <Faq />
    </>
  )
}
