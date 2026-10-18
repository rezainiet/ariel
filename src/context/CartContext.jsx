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
  addedAt: 0, // horodatage du dernier ajout (retour visuel « ajouté »)
  skin: null, // habillage visuel du panier selon le concept affiché ('a' | 'b' | 'c')
}

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_OFFER':
      return { ...state, offerId: action.offerId }
    case 'MARK_ADDED':
      return { ...state, addedAt: action.at }
    case 'SET_SKIN':
      return { ...state, skin: action.skin }
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
  const selectOffer = useCallback((offerId, { openDrawer = true, feedback = true } = {}) => {
    const o = getOffer(offerId)
    if (!o) return
    dispatch({ type: 'SELECT_OFFER', offerId })
    if (feedback) dispatch({ type: 'MARK_ADDED', at: Date.now() })
    if (openDrawer) dispatch({ type: 'OPEN_DRAWER' })
    trackAddCart({
      currency: 'CHF',
      price: o.price,
      item_ids: [PRODUCT.id],
      item_category: 'detergent',
      number_items: o.packs,
    })
  }, [])

  // Change le bundle déjà présent dans le panier (stepper du panier).
  // Pas d'événement ADD_CART : ce n'est pas un nouvel ajout.
  const changeOffer = useCallback((offerId) => {
    if (getOffer(offerId)) dispatch({ type: 'SELECT_OFFER', offerId })
  }, [])

  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])
  const setSkin = useCallback((skin) => dispatch({ type: 'SET_SKIN', skin }), [])
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
      addedAt: state.addedAt,
      skin: state.skin,
      selectOffer,
      changeOffer,
      clear,
      setSkin,
      openDrawer,
      closeDrawer,
    }
  }, [offer, state.offerId, state.drawerOpen, state.addedAt, state.skin, selectOffer, changeOffer, clear, setSkin, openDrawer, closeDrawer])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>')
  return ctx
}
