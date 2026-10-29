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

## Serveur et administration

`server/index.mjs` (Node ≥ 18, sans dépendance) sert l'API de la boutique et, en production, le site compilé :

```bash
npm run build
ADMIN_PASSWORD="…12 caractères minimum…" PUBLIC_ORIGIN="https://votre-boutique.ch" NODE_ENV=production npm start
```

En développement : lancer `npm run server` (port 8787) en parallèle de `npm run dev` (Vite relaie `/api`).

- **`/admin`** (non lié, non indexé, mot de passe `ADMIN_PASSWORD`, session par cookie httpOnly, tentatives limitées) :
  vue d'ensemble puis trois onglets — **Stock** (quantité, réservations à confirmer, historique), **Avis**, **Paiement** ;
  activer / désactiver le **paiement par redirection externe**, domaine, chemin, un code par offre, paramètres d'URL,
  aperçu de l'URL générée ; publier et retirer des avis clients avec nom, note sur 5, texte et jusqu'à trois photos.
- Avis publiés dans `DATA_DIR/reviews.json`, photos dans `DATA_DIR/review-images/` ; le site les lit depuis
  `GET /api/reviews`. Sans avis publié, la section reste masquée. Les avis saisis par l'administrateur ne portent
  pas automatiquement le badge « Achat vérifié ». Les photos sont limitées à PNG/JPEG/WebP, 2 Mo chacune.
- Dix résumés traduits d'avis publics sur la gamme Ariel All-in-1 PODS ont été importés pour l'aperçu local via
  `DATA_DIR=... node server/import-sourced-reviews.mjs`. Chaque avis indique sa source, sa date d'origine et la
  contenance connue ; aucun n'est présenté comme un achat dans cette boutique. L'import est idempotent et chaque
  avis peut être supprimé dans `/admin` → Avis. Les images des auteurs ne sont pas reprises.
- **Stock** (`/admin` → Stock) : une seule référence, le sachet `ariel-all-in-1-pods` ; chaque offre en retire
  `packs` (1, 2 ou 3). Enregistré côté serveur dans `DATA_DIR/stock.json` (écritures sérialisées, fichier réécrit
  atomiquement, saisie absolue refusée si le stock a changé entre-temps ; entrées/sorties relatives sûres).
  Quantité vide = **non renseignée** : rien n'est limité ni affiché épuisé.
  Cycle : la création de la commande Everflow `pending` **réserve** les sachets pendant la durée réglée (30 min par
  défaut) ; une commande sans stock est refusée (`409 out_of_stock`) avant toute redirection. La redirection n'est pas
  une preuve de paiement : sans action, la réservation expire. « Paiement reçu » (après vérification chez Everflow)
  **déduit** définitivement et passe la commande en `confirmed` ; « Annuler » libère et la passe en `cancelled`.
  `GET /api/stock` ne publie que disponible / épuisé par offre, jamais de quantité.
  `POST /api/checkout/redirect` (redirection générique, sans fiche commande) refuse une offre épuisée mais ne réserve pas.
  Tester avec `node --test server/*.test.mjs`.
- Réglages enregistrés dans `server/data/payment-config.json` (hors dépôt ; `DATA_DIR` pour un autre dossier).
- `POST /api/checkout/redirect` : le serveur revalide la commande puis construit l'URL — jamais le navigateur.
- `GET /api/featured-offer` : sélection à la une parmi les trois vrais bundles, pendant 20 à 40 minutes.
  La sélection et son échéance sont conservées dans `DATA_DIR/featured-offer.json` : recharger la page ne
  relance pas le chronomètre. À l'échéance, une autre offre est mise en avant ; les prix et disponibilités
  des trois offres ne changent pas. Aucun niveau de stock n'est simulé.
- Everflow : trois offres figées dans `server/everflow.mjs`, activation séparée par `EVERFLOW_ENABLED=true`,
  `EVERFLOW_IMAGES_APPROVED=true` et `PUBLIC_ORIGIN` (origine HTTPS publique servant les trois images dans
  `public/images/everflow/`). Le serveur crée d'abord une commande
  `pending` idempotente dans `DATA_DIR/everflow-orders/`, puis renvoie l'URL hébergée. Aucune redirection
  ou visite de retour ne confirme le paiement. Aucun webhook/API de confirmation Everflow n'est configuré.
  Le serveur ajoute les coordonnées validées du formulaire, le libellé de l'offre et son image.
  Tester avec `node --test server/everflow.test.mjs` ; ces tests n'ouvrent pas le prestataire et ne paient rien.

## Routes

| Route | Contenu |
| ----- | ------- |
| `/` | Boutique (annonce, héros + 3 offres, « Pourquoi choisir », livraison & retours, FAQ) |
| `/checkout` | Commande : coordonnées, adresse suisse, paiement hébergé, récapitulatif modifiable |
| `/checkout/confirmation` | Confirmation affichée **uniquement** après vérification serveur du paiement |
| `/livraison`, `/retours-remboursements`, `/conditions-generales-de-vente`, `/politique-de-confidentialite`, `/mentions-legales`, `/contact` | Pages de service et légales |
| `/commande` | Ancienne adresse, redirigée vers `/checkout` |
| `/admin` | Administration du paiement (protégée par mot de passe, côté serveur) |

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
- `src/lib/analytics.js` et `server/analytics.mjs` — statistiques internes après consentement : sessions par canal, temps actif, défilement et étapes de commande. Rapport protégé dans `/admin#analytics`, sur 24 h, 7 j ou 30 j ; conservation d’environ 90 jours. Voir `ANALYTICS.md` pour les définitions et limites.
- `src/concepts/frais/` — composants de la boutique Frais ; `src/pages/` — commande et pages de service.
- `server/validate-order.mjs` — validation à appeler par le serveur de commande avant de créer le paiement.

## Prix (bundles — ne pas multiplier un prix unitaire)

| Offre     | Sachets | Capsules | Prix     |
| --------- | ------- | -------- | -------- |
| 1 sachet  | 1       | 60       | CHF 9.–  |
| 2 sachets | 2       | 120      | CHF 15.– |
| 3 sachets | 3       | 180      | CHF 20.– |

Livraison offerte en Suisse. Le serveur recalcule toujours le montant à partir de l'offre.

## Configuration

Toutes les variables sont décrites dans `.env.example`. Sans valeur, l'élément correspondant est masqué :
aucune donnée marchand, aucun avis, aucune vidéo, aucun stock ni délai n'est inventé.
