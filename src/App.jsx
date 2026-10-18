import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import AddedToast from './components/AddedToast.jsx'
import Home from './pages/Home.jsx'
import Checkout from './pages/Checkout.jsx'
import Returns from './pages/Returns.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Legal from './pages/Legal.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import { initPixel, trackPageView } from './lib/pixel.js'

// Concepts : chargés à la demande (code splitting, polices incluses dans leur chunk).
const ConceptA = lazy(() => import('./concepts/a/ConceptA.jsx'))
const ConceptB = lazy(() => import('./concepts/b/ConceptB.jsx'))
const ConceptC = lazy(() => import('./concepts/c/ConceptC.jsx'))
const DesignCompare = lazy(() => import('./pages/DesignCompare.jsx'))
const DESIGN_PREVIEW = import.meta.env.DEV || import.meta.env.VITE_DESIGN_PREVIEW === 'true'

// Remet le scroll en haut + PAGE_VIEW à chaque navigation (hors ancres).
function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
    trackPageView()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Gabarit de la boutique v1 + pages légales / commande.
function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas" role="status" aria-label="Chargement">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
    </div>
  )
}

export default function App() {
  useEffect(() => {
    initPixel()
  }, [])

  return (
    <>
      <RouteEffects />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/commande" element={<Checkout />} />
            <Route path="/retours-remboursements" element={<Returns />} />
            <Route path="/politique-de-confidentialite" element={<Privacy />} />
            <Route path="/conditions-generales-de-vente" element={<Terms />} />
            <Route path="/mentions-legales" element={<Legal />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/concept-a" element={<ConceptA />} />
          <Route path="/concept-b" element={<ConceptB />} />
          <Route path="/concept-c" element={<ConceptC />} />
          {/* Page interne de comparaison — non liée publiquement, désactivée en production
              (sauf VITE_DESIGN_PREVIEW=true pour un environnement de recette). */}
          {DESIGN_PREVIEW && <Route path="/design" element={<DesignCompare />} />}
        </Routes>
      </Suspense>
      <CartDrawer />
      <AddedToast />
    </>
  )
}
