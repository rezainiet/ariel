import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import './index.css'
import { captureTrafficSource } from './lib/trafficSource.js'

// Provenance (Meta / Snapchat / Google…) lue une fois à l'arrivée, avant que le routeur ne nettoie l'URL.
captureTrafficSource()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
)
