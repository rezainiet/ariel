import { useEffect } from 'react'
import { useCart } from '../../context/CartContext.jsx'

// Habille le panier (drawer partagé) aux couleurs du concept affiché.
export function useCartSkin(skin) {
  const { setSkin } = useCart()
  useEffect(() => {
    setSkin(skin)
    return () => setSkin(null)
  }, [skin, setSkin])
}
