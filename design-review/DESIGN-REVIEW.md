# Ariel · Déstockage Suisse — Revue des trois concepts

Branche : `three-concepts` (la v1 est conservée sur `main`, commit `f2cd6c6`).
Aperçus locaux : `/concept-a`, `/concept-b`, `/concept-c` · comparaison interne : `/design` (dev uniquement).

Toutes les captures de ce dossier proviennent de l'application réelle, rendue par Microsoft Edge headless
piloté via le Chrome DevTools Protocol (émulation mobile 390 px DPR 2, desktop 1440 px), avec de vrais clics
pour la sélection d'offre et le panier.

---

## 1. Audit de la v1

| Problème constaté | Réponse dans les concepts |
| --- | --- |
| Colonne étroite (≈1200 px, contenu centré à ~600 px dans les sections) | Conteneurs 1280–1440 px, compositions multi-colonnes, héros en fiche produit 2 colonnes |
| Typographie petite et faible | Échelles typographiques propres à chaque concept (serif 3.6 rem / grotesque 6.2 rem / sans compacte) |
| Visuels produit sans impact | Packshot détouré, galerie interactive, zoom plein écran, présentation « tirage encadré » des recadrages basse résolution |
| Grands vides entre sections | Paddings réduits, regroupements, divulgation progressive, pages mobiles −10 à −22 % après revue |
| Cartes d'offre basiques | Trois sélecteurs distincts : lignes radio (A), tuiles + pile de packs animée (B), tuiles compactes + comparatif sélectionnable (C) |
| Pas de narration produit | Mentions réelles de l'emballage, annotations sur le packshot (B), utilisation, ouverture sécurisée, sécurité |
| Pas d'avis clients | Architecture complète : moyenne, répartition, filtres, tri, pagination, photos, « achat vérifié » — données d'exemple **dev uniquement** |
| Bénéfices peu convaincants | Remplacés par des faits vérifiables (60 PODS, 1 capsule = 1 lavage, fermeture sécurité enfants, prix/lavage calculé) |
| Interactions statiques | Galeries (swipe, vignettes, lightbox clavier), onglets, configurateurs, stepper panier, toast, barre collante |
| Trop de défilement sans interaction | Choix d'offre dans le héros (A, C) ou à 1 tap (B) ; barre d'achat collante (C) |
| Décision d'achat peu fluide | Bouton « Commander » express (C), récapitulatif intégré au sélecteur, économies réelles affichées |
| Peu de raisons vérifiables de faire confiance | Vendeur, expédition, délai, retours, contact répondus dans le parcours, sans badges inventés |

## 2. Les concepts

### A — Swiss Luxury Commerce
Ivoire, vert forêt, Fraunces (serif) + Manrope. Le héros est une vraie fiche produit : galerie à vignettes
verticales (swipe + points sur mobile), boîte d'achat avec sélecteur en lignes radio natives (prix/pack,
économie vs packs séparés), sections numérotées 01–06, tableau comparatif éditorial, avis en mise en page
éditoriale avec synthèse collante.

### B — Modern Product Experience
Sections sombres immersives, Space Grotesk XXL, accent jaune repris du bandeau « 60 PODS ». Héros annoté :
repères numérotés posés sur les mentions **réelles** du sachet, liés à une légende. Onglets « L'expérience
capsule », bandeau de chiffres (dont prix par lavage calculé), configurateur à pile de packs détourés qui
s'anime selon la quantité, galerie pellicule, avis en grille maçonnerie.

### C — Premium Conversion Commerce
Fiche produit compacte façon DTC : carrousel natif, trois offres en une rangée, « Commander · CHF 7.– »
(ajout + accès direct à la commande) et « Ajouter », livraison/stock/retours sous le bouton. Comparatif
sélectionnable synchronisé avec le héros et la barre collante, détails en accordéons, avis en rail
horizontal extensible. Barre d'achat collante mobile qui apparaît quand les boutons du héros sortent de l'écran.

### Logique partagée (inchangée ou étendue)
- `src/config/store.js` — prix de bundle (4 / 7 / 10), + `savingsFor`, `pricePerPack`, `centsPerWash`.
- `src/context/CartContext.jsx` — une offre à la fois ; ajout de `changeOffer` (stepper, sans ADD_CART),
  `addedAt` (retour visuel), `skin` (habillage du panier par concept), option `feedback`.
- `src/lib/pixel.js` — inchangé. ADD_CART uniquement sur un vrai ajout (les configurateurs gardent une
  sélection locale), START_CHECKOUT à l'arrivée en commande, PURCHASE toujours réservé au paiement vérifié.
- Panier, commande, pages légales, routes v1 : conservés.

## 3. Garde-fous d'honnêteté
- Avis : `src/data/reviews.js`. Les avis d'exemple sont dans un bloc `import.meta.env.DEV` — **vérifié absent
  du bundle de production** (`grep` sur `dist/`). En production, état vide honnête jusqu'à branchement d'une
  source vérifiée (`VITE_REVIEWS_ENDPOINT`). Statistiques calculées, jamais saisies.
- Aucun prix barré, aucun pourcentage inventé : économies = packs à CHF 4.– achetés séparément (−1 / −2).
- Mentions produit attribuées à l'emballage, avec la citation originale.
- `/design` : non enregistrée en production (vérifié dans `dist/`), sauf `VITE_DESIGN_PREVIEW=true`.
- Aucune urgence, aucun compte à rebours, aucune notification d'achat fictive.

## 4. Évaluation d'expert (sur 10)

Jugement de design — **pas une mesure**. Aucun taux de conversion n'est mesuré ni supposé.

| Critère | A | B | C |
| --- | :-: | :-: | :-: |
| Sophistication visuelle | **9** | **9** | 7 |
| Crédibilité du marchand | **9** | 7 | 8 |
| Utilisabilité mobile | 7 | 7 | **9** |
| Présentation produit | 8 | **9** | 7 |
| Clarté du choix d'offre | 8 | 8 | **9** |
| Qualité des interactions | 8 | **9** | 8 |
| Performance | 8 | 7 | **9** |
| Parcours de commande | 7 | 7 | **9** |
| **Total / 80** | **64** | **63** | **66** |

## 5. Recommandation

Pour un trafic Snapchat en Suisse romande (mobile, attention courte, arrivée sur une promesse de prix),
**C est la meilleure base**, enrichie de la finition typographique de A.

- **C** met tout le parcours dans le premier écran 390 px : produit, prix, trois offres, bouton de commande
  et réassurance livraison/retours. Page la plus courte (≈ 3 300 px mobile), JS le plus léger (6 kB gzip),
  pas de police supplémentaire, barre d'achat toujours accessible.
- **A** est le plus crédible et le plus « détaillant européen établi », mais le bouton d'achat arrive sous
  le premier écran mobile et la page reste longue (≈ 7 700 px).
- **B** est le plus spectaculaire, mais son esthétique sombre de campagne peut se lire comme le site officiel
  de la marque — un risque de confusion pour un revendeur, et un frein de crédibilité pour un déstockage.
  Le configurateur arrive après deux sections de narration.

**Hybride conseillé :** structure et parcours de C ; titres en Fraunces et fond ivoire de A pour le
caractère haut de gamme ; module « emballage annoté » de B réutilisé sous le pli.

## 6. À fournir / confirmer avant la production
- **Visuels HD** : seuls le packshot (1000 px) est en bonne résolution. Les autres visuels sont recadrés du
  collage fourni (≈ 220–420 px de large) et présentés en conséquence ; fournir des fichiers individuels HD.
- **Étiquetage** : le sachet de référence est en allemand (dont la campagne « #WirDrehenRunter »). Confirmer
  que les unités vendues en Suisse romande correspondent et respectent les exigences d'étiquetage applicables.
- **Avis** : choisir une plateforme d'avis vérifiés et renseigner `VITE_REVIEWS_ENDPOINT`.
- **Paiement** : prestataire (Stripe / Datatrans / Wallee…) + vérification serveur avant tout événement PURCHASE.
- **Identité du marchand**, TVA, adresse, IDE, contact service client.
- **Livraison** : transporteur, délai réel, lieu de stock confirmé.
- **Consentement** au pixel Snap (nLPD, RGPD le cas échéant).
- **Commande** : la page `/commande` est partagée et garde le style v1 ; l'habiller aux couleurs du concept retenu.

## 7. Index des captures
| Fichier | Contenu |
| --- | --- |
| `x-1-mobile-full.png` | Page complète mobile 390 px (DPR 2) |
| `x-2-mobile-first-viewport.png` | Premier écran mobile 390 × 844 |
| `x-3-desktop-full.png` | Page complète desktop 1440 px |
| `x-3b-desktop-first-viewport.png` | Premier écran desktop 1440 × 900 |
| `x-4-mobile-offer-selection.png` | Sélection de l'offre 3 packs (vrai clic) |
| `x-5-mobile-cart.png` | Panier après ajout (vrai clic), habillé par concept |
| `c-6-mobile-sticky-bar.png` | Barre d'achat collante (C) |
| `compare-mobile-first-screens.png` | Premiers écrans mobiles côte à côte |
| `compare-desktop-first-screens.png` | Premiers écrans desktop côte à côte |
| `compare-mobile-full-pages.png` | Pages mobiles complètes côte à côte |
| `design-compare-page.png` | Page interne `/design` |
