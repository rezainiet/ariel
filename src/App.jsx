import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import AddedToast from './components/AddedToast.jsx'
import ConsentBanner from './components/ConsentBanner.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Returns from './pages/Returns.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Legal from './pages/Legal.jsx'
import Contact from './pages/Contact.jsx'
import Shipping from './pages/Shipping.jsx'
import NotFound from './pages/NotFound.jsx'
// Boutique (Concept 2 « Frais », approuvé) : chargée immédiatement — page d'arrivée des publicités.
import FraisPage from './concepts/frais/FraisPage.jsx'
import { Announcement, HeaderF, FooterF } from './concepts/frais/ChromeF.jsx'
import { trackPageView } from './lib/pixel.js'
import { trackAnalyticsPage } from './lib/analytics.js'

// Archives de conception (v1, concepts A/B/C, page de comparaison) : INTERNES uniquement.
// Absentes du build public (VITE_DESIGN_PREVIEW=true seulement pour un environnement de recette).
const DESIGN_PREVIEW = import.meta.env.VITE_DESIGN_PREVIEW === 'true'
// Administration (paiement) : chargée à la demande, protégée côté serveur, non indexée.
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Home = DESIGN_PREVIEW ? lazy(() => import('./pages/Home.jsx')) : null
const ConceptC = DESIGN_PREVIEW ? lazy(() => import('./concepts/c/ConceptC.jsx')) : null
const ConceptA = DESIGN_PREVIEW ? lazy(() => import('./concepts/a/ConceptA.jsx')) : null
const ConceptB = DESIGN_PREVIEW ? lazy(() => import('./concepts/b/ConceptB.jsx')) : null
const DesignCompare = DESIGN_PREVIEW ? lazy(() => import('./pages/DesignCompare.jsx')) : null

// Remet le scroll en haut + PAGE_VIEW à chaque navigation (hors ancres).
// Le pixel n'est chargé qu'après consentement (ConsentBanner) : avant, l'appel est sans effet.
function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
    trackPageView()
    trackAnalyticsPage(pathname)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Pages de service et légales : habillage de la boutique.
function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-jakarta">
      <Announcement />
      <HeaderF />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterF />
    </div>
  )
}

// Gabarit v1 (archive de comparaison).
function V1Layout() {
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
    <div className="flex min-h-screen items-center justify-center bg-ivory" role="status" aria-label="Chargement">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest/20 border-t-forest" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <RouteEffects />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<FraisPage />} />
          {/* Tunnel de commande : gabarit épuré (sans navigation) */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/confirmation" element={<OrderConfirmation />} />
          {/* Anciennes adresses : redirigées (liens déjà partagés, retours prestataire) */}
          <Route path="/commande" element={<Navigate to="/checkout" replace />} />
          <Route path="/commande/confirmation" element={<OrderConfirmation />} />
          <Route path="/admin" element={<Admin />} />
          <Route element={<StoreLayout />}>
            <Route path="/retours-remboursements" element={<Returns />} />
            <Route path="/politique-de-confidentialite" element={<Privacy />} />
            <Route path="/conditions-generales-de-vente" element={<Terms />} />
            <Route path="/mentions-legales" element={<Legal />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/livraison" element={<Shipping />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          {DESIGN_PREVIEW && (
            <>
              <Route element={<V1Layout />}>
                <Route path="/v1" element={<Home />} />
              </Route>
              <Route path="/concept-a" element={<ConceptA />} />
              <Route path="/concept-b" element={<ConceptB />} />
              <Route path="/concept-c" element={<ConceptC />} />
              <Route path="/design" element={<DesignCompare />} />
            </>
          )}
        </Routes>
      </Suspense>
      <CartDrawer />
      <AddedToast />
      <ConsentBanner />
    </>
  )
}
