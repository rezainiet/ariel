import { createContext, useContext, useMemo, useReducer, useCallback } from 'react'
import { getOffer, PRODUCT } from '../config/store'
import { trackAddCart } from '../lib/pixel'

// ─────────────────────────────────────────────────────────────
// État du panier centralisé.
// Le panier contient AU PLUS une offre à la fois (produit unique,
// trois bundles). Sélectionner une offre remplace la précédente :
// aucun ajout en double, aucun cumul accidentel.
// ─────────────────────────────────────────────────────────────

const CartContext = createContext(null)

const initialState = {
  offerId: null, // id de l'offre sélectionnée, ou null
  drawerOpen: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_OFFER':
      return { ...state, offerId: action.offerId }
    case 'CLEAR':
      return { ...state, offerId: null }
    case 'OPEN_DRAWER':
      return { ...state, drawerOpen: true }
    case 'CLOSE_DRAWER':
      return { ...state, drawerOpen: false }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const offer = state.offerId ? getOffer(state.offerId) : null

  // Sélectionne une offre (remplace), ouvre le drawer, déclenche ADD_CART
  // uniquement lors d'une vraie sélection utilisateur.
  const selectOffer = useCallback((offerId, { openDrawer = true } = {}) => {
    const o = getOffer(offerId)
    if (!o) return
    dispatch({ type: 'SELECT_OFFER', offerId })
    if (openDrawer) dispatch({ type: 'OPEN_DRAWER' })
    trackAddCart({
      currency: 'CHF',
      price: o.price,
      item_ids: [PRODUCT.id],
      item_category: 'detergent',
      number_items: o.packs,
    })
  }, [])

  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const openDrawer = useCallback(() => dispatch({ type: 'OPEN_DRAWER' }), [])
  const closeDrawer = useCallback(() => dispatch({ type: 'CLOSE_DRAWER' }), [])

  const value = useMemo(() => {
    const total = offer ? offer.price : 0
    return {
      offerId: state.offerId,
      offer,
      hasItems: Boolean(offer),
      packs: offer?.packs || 0,
      washes: offer?.washes || 0,
      subtotal: total,
      total, // livraison offerte -> total = sous-total
      drawerOpen: state.drawerOpen,
      selectOffer,
      clear,
      openDrawer,
      closeDrawer,
    }
  }, [offer, state.offerId, state.drawerOpen, selectOffer, clear, openDrawer, closeDrawer])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>')
  return ctx
}
