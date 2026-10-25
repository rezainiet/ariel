import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { I18nProvider, bootLocale } from './i18n/index.jsx'
import './index.css'
import { captureTrafficSource } from './lib/trafficSource.js'

// Provenance (Meta / Snapchat / Google…) lue une fois à l'arrivée, avant que le routeur ne nettoie l'URL.
captureTrafficSource()
// Langue et devise fixées avant le premier rendu : jamais d'affichage dans la mauvaise langue.
bootLocale()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)
