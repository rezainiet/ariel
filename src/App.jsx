import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Home from './pages/Home.jsx'
import Checkout from './pages/Checkout.jsx'
import Returns from './pages/Returns.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Legal from './pages/Legal.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import { initPixel, trackPageView } from './lib/pixel.js'

// Remet le scroll en haut + PAGE_VIEW à chaque navigation.
function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    trackPageView()
  }, [pathname])
  return null
}

export default function App() {
  useEffect(() => {
    initPixel()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <RouteEffects />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/commande" element={<Checkout />} />
          <Route path="/retours-remboursements" element={<Returns />} />
          <Route path="/politique-de-confidentialite" element={<Privacy />} />
          <Route path="/conditions-generales-de-vente" element={<Terms />} />
          <Route path="/mentions-legales" element={<Legal />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
