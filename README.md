# Ariel — Déstockage en Suisse

Boutique e-commerce mobile-first (React + Vite + Tailwind) pour les packs
**Ariel All-in-1 PODS · 60 lavages**. Direction artistique « Swiss Editorial Commerce ».

## Démarrage

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production
npm run preview  # prévisualisation du build
```

## Architecture

- `src/config/store.js` — **source unique de vérité** : offres, prix (bundles fixes), livraison, boutique.
- `src/context/CartContext.jsx` — état panier centralisé (une offre à la fois, pas de doublon).
- `src/lib/pixel.js` — intégration Snap Pixel (PAGE_VIEW, VIEW_CONTENT, ADD_CART, START_CHECKOUT, PURCHASE), anti-duplication.
- `src/components/` — header, hero, offres, trust, produit, livraison, FAQ, footer, drawer, UI réutilisable.
- `src/pages/` — accueil, commande, retours, confidentialité, CGV, mentions légales, contact.

## Prix (bundles — ne pas multiplier un prix unitaire)

| Offre   | Packs | Lavages | Prix     |
| ------- | ----- | ------- | -------- |
| 1 pack  | 1     | 60      | CHF 4.–  |
| 2 packs | 2     | 120     | CHF 7.–  |
| 3 packs | 3     | 180     | CHF 10.– |

## Configuration (`.env.local`, copier depuis `.env.example`)

| Variable                 | Rôle                                            |
| ------------------------ | ----------------------------------------------- |
| `VITE_STORE_NAME`        | Nom légal de la boutique (défaut : placeholder) |
| `VITE_SUPPORT_EMAIL`     | E-mail du service client                        |
| `VITE_SUPPORT_PHONE`     | Téléphone du service client                     |
| `VITE_SNAP_PIXEL_ID`     | ID Snap Pixel (vide = pixel désactivé)          |
| `VITE_PAYMENT_PROVIDER`  | Prestataire de paiement (à connecter)           |
| `VITE_DISPATCH_LOCATION` | Lieu d'expédition                               |
| `VITE_DELIVERY_ESTIMATE_DAYS` | Délai de livraison estimé                  |

## À fournir / confirmer avant mise en production

- **Photos produit réelles** (voir `public/images/README.txt`).
- **Nom légal, adresse, IDE/CHE, hébergeur** (mentions légales).
- **Prestataire de paiement** conforme (Stripe/Datatrans/Wallee) + vérification serveur.
  Aucune donnée de carte ne transite par l'app ; `PURCHASE` ne se déclenche
  qu'après paiement vérifié côté serveur.
- **Politique de retours** validée au regard du droit suisse.
- **Transporteur, délais, stock** confirmés avant d'être présentés comme vérifiés.
- **Consentement / vie privée** (nLPD, RGPD si clients UE) avant d'activer le pixel.
