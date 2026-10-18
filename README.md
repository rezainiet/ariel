# Ariel — Déstockage en Suisse

Boutique e-commerce mobile-first (React + Vite + Tailwind) pour les sachets
**Ariel All-in-1 PODS · 60 capsules**. Direction artistique approuvée : **Concept 2 « Frais »**.

## Démarrage

```bash
npm install
npm run dev      # serveur de développement
npm run build    # build de production + contrôle du bundle (scripts/check-bundle.mjs)
npm run preview  # prévisualisation du build
node server/validate-order.mjs   # auto-test de la validation serveur des commandes
```

## Routes

| Route | Contenu |
| ----- | ------- |
| `/` | Boutique (annonce, héros + 3 offres, « Pourquoi choisir », livraison & retours, FAQ) |
| `/checkout` | Commande : coordonnées, adresse suisse, paiement hébergé, récapitulatif modifiable |
| `/checkout/confirmation` | Confirmation affichée **uniquement** après vérification serveur du paiement |
| `/livraison`, `/retours-remboursements`, `/conditions-generales-de-vente`, `/politique-de-confidentialite`, `/mentions-legales`, `/contact` | Pages de service et légales |
| `/commande` | Ancienne adresse, redirigée vers `/checkout` |

Les archives de conception (`/concept-a|b|c`, `/v1`, `/design`) ne sont pas publiées : elles n'existent que si
`VITE_DESIGN_PREVIEW=true` (environnement de recette interne).

Avant toute mise en ligne : **`LAUNCH-CHECKLIST.md`** (informations marchand, paiement, livraison, retours).
Captures et notes : `design-review/frais-finition/`.

## Architecture

- `src/config/offers.js` — produit, offres et calculs de prix (module pur, partagé avec le serveur).
- `src/config/store.js` — configuration de la boutique (marchand, livraison, paiement, conditions) ; réexporte les offres.
- `src/context/CartContext.jsx` — panier : une offre à la fois (jamais de doublon), conservé au rechargement de l'onglet.
- `src/lib/orderValidation.js` — validation des coordonnées et de la commande (navigateur **et** serveur).
- `src/lib/payment.js` — frontière de paiement : session hébergée chez le prestataire, vérification serveur.
- `src/lib/storeStatus.js` — stock et campagne réels (jamais de valeur fictive).
- `src/lib/address.js` — aide à la saisie d'adresse, uniquement via un service configuré.
- `src/lib/pixel.js` — Snap Pixel après consentement (PAGE_VIEW, ADD_CART, START_CHECKOUT, PURCHASE vérifié).
- `src/concepts/frais/` — composants de la boutique Frais ; `src/pages/` — commande et pages de service.
- `server/validate-order.mjs` — validation à appeler par le serveur de commande avant de créer le paiement.

## Prix (bundles — ne pas multiplier un prix unitaire)

| Offre     | Sachets | Capsules | Prix     |
| --------- | ------- | -------- | -------- |
| 1 sachet  | 1       | 60       | CHF 4.–  |
| 2 sachets | 2       | 120      | CHF 7.–  |
| 3 sachets | 3       | 180      | CHF 10.– |

Livraison offerte en Suisse. Le serveur recalcule toujours le montant à partir de l'offre.

## Configuration

Toutes les variables sont décrites dans `.env.example`. Sans valeur, l'élément correspondant est masqué :
aucune donnée marchand, aucun avis, aucune vidéo, aucun stock ni délai n'est inventé.
