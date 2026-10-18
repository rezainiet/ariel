# Concept C révisé — la boutique

Branche `concept-c-revision` · route `/` (et `/concept-c`) · v1 archivée sur `/v1` · Concepts A et B
inchangés (`/concept-a`, `/concept-b`). Recherche à l'origine des décisions : `SWISS-MARKET-RESEARCH.md`.

## Pourquoi ce design convient à ce produit et à ce public

**Le vrai risque n'est pas esthétique, c'est la méfiance.** Ce produit est vendu ailleurs en Suisse autour
de CHF 20.– à 26.– (sources §1 de la recherche) ; à CHF 4.–, un visiteur venu de Snapchat se demande
« est-ce sérieux ? ». La révision répond donc à des questions précises, dans cet ordre :

| Question du visiteur | Où la page répond |
| --- | --- |
| Qu'est-ce qui est vendu ? | Premier écran : photo du vrai sachet, « Ariel All‑in‑1 PODS — 60 lavages par sachet · 60 capsules » |
| Combien ça coûte, vraiment ? | « Dès CHF 4.– », prix par capsule (convention suisse), « livraison offerte », total du configurateur |
| Quelle quantité ? | Tuiles 1/2/3 packs avec pile de sachets réels, récapitulatif « 2 sachets · 120 capsules · 120 lavages » |
| Pourquoi ce prix ? | Section dédiée juste après l'achat — raison **fournie par le marchand**, aucune inventée |
| Qui vend ? | « Qui vous livre ? » : raison sociale, adresse, IDE, e-mail, lieu d'expédition (LCD art. 3 let. s) |
| À quoi ça sert, comment l'utiliser ? | Format capsule, 60 lavages (dosage nuancé), allégations attribuées au fabricant, mode d'emploi illustré |
| Est-ce sûr ? | Consignes OFSP, Tox Info Suisse 145, « pour linge blanc et clair / pas pour laine, délicat » |
| Livraison, retours ? | Ligne sous le bouton + section unique détaillée (pas de répétition) |
| Comment payer en sécurité ? | Moyens réellement actifs uniquement ; prestataire externe ; bouton final conforme « Acheter » |

## Ce qui a changé

1. **Héros art-dirigé** : composition originale « lumière du matin » (mur calcaire, ombres de fenêtre et
   d'olivier, plan en pierre, serviettes pliées en arrière-plan flou) autour du **packshot réel non
   retouché**. Deux compositions : mobile 4:5 (zone de texte libre en haut) et desktop 4:3. AVIF + WebP,
   `srcset`, 31 kB (mobile 780 px AVIF). Légendé « Mise en scène avec le produit réel ».
2. **Mobile** : titre et prix posés sur la photo, configurateur immédiatement dessous — produit, prix,
   choix et bouton dans le premier écran 390 × 844. L'image garde sa composition 4:5 (jamais recadrée) et
   rétrécit sur les écrans courts plutôt que de chevaucher le texte.
3. **Desktop / tablette (≥ 768 px)** : galerie dominante + vignettes à gauche, titre/prix/configurateur à droite.
4. **Galerie** : une image dominante, vignettes, compteur « 1 / 6 » + légende, flèches, balayage, zoom
   plein écran clavier. Les visuels basse résolution sont présentés en « tirage » à taille raisonnable.
5. **Configurateur** : prix de bundle exacts, prix par capsule, économie réelle vs packs à CHF 4.–,
   badges marchands, barre collante mobile qui reflète toujours la sélection.
6. **Quatre sections produit** (A format, B 60 lavages, C allégations vérifiées, D mode d'emploi + sécurité),
   chacune avec une composition différente — pas de cartes blanches identiques.
7. **Confiance** : « Pourquoi ce prix ? » + « Qui vous livre ? » ; aucune croix suisse dans le logo
   (Swissness) ; mention « n'est pas le site officiel de la marque ».
8. **Avis** : composant conservé, **masqué** en l'absence de source vérifiée (aucune étoile, aucun
   nombre). Le build échoue si des avis d'exemple atteignent la production.
9. **Commande** : gabarit épuré, étapes visibles, récapitulatif modifiable (repliable sur mobile),
   adresse suisse (NPA 4 chiffres), erreurs accessibles, bouton « Acheter · CHF x.– », frontière de
   paiement explicite (`src/lib/payment.js`), page de confirmation qui n'affiche un succès et n'envoie
   PURCHASE **qu'après vérification serveur**.
10. **Vie privée** : le pixel Snap ne se charge qu'après consentement (deux boutons de même poids).

## Revue critique effectuée (captures réelles)

Corrigé après la 1re série de captures : page mobile trop longue (−1 160 px), lignes « vendeur » vides en
production, boutons superposés au produit dans le héros, chevauchement titre/produit à 768 px, prix qui
se coupent à 320 px, coupure « All- / in-1 », badge tronqué (libellés courts « Populaire / Meilleure
offre », libellé complet en info-bulle), colonne d'achat écrasée à 768 px (`min-w-0` sur la grille),
récapitulatif de commande qui repoussait le formulaire, « depuis Suisse ». Le bouton « Passer commande »
est désormais entièrement visible dans le premier écran 390 × 844 (vérifié : 787–841 px).

Vérifications : aucun débordement horizontal à 320 / 375 / 390 / 430 / 768 / 1024 / 1440 px ; aucune
erreur console ; build de production contrôlé (aucun avis d'exemple, aucun marqueur « À fournir ») ;
rendu production vérifié (aucune note ni avis, aucune ligne vendeur vide) ; navigation clavier du
sélecteur d'offre ; toutes les images ont un texte alternatif, tous les boutons un nom accessible.

## Limites assumées

- Le héros est une **composition** (décor généré, produit réel), pas une photographie de scène : aucun
  outil de génération d'image n'était disponible, et aucune photo tierce n'a été téléchargée sans
  autorisation. Une séance photo ou des visuels sous licence l'amélioreraient — voir `LAUNCH-CHECKLIST.md`.
- Les visuels secondaires restent des recadrages basse résolution du collage fourni.
- Les marqueurs ambrés « À fournir » visibles sur les captures n'existent qu'en développement.
- Aucune amélioration de conversion n'est revendiquée : rien n'a été mesuré.

## Captures (Edge headless piloté par DevTools Protocol, vrais clics)

| Fichier | Contenu |
| --- | --- |
| `01-mobile-hero-390.png` | Premier écran mobile 390 × 844 |
| `02-mobile-full-390.png` | Page mobile complète |
| `03-mobile-bundle-selector.png` | Sélection de l'offre 3 packs |
| `04a`–`04e` | Sections produit (format, 60 lavages, allégations, mode d'emploi/sécurité, prix & vendeur) |
| `05-mobile-cart.png` | Panier après ajout |
| `06a/06b/06c` | Commande mobile, état d'erreurs, page complète |
| `07-desktop-hero-1440.png` / `08-desktop-full-1440.png` | Desktop |
| `09-desktop-checkout-1440.png` | Commande desktop |
| `10-mobile-sticky-bar.png` | Barre d'achat collante |
| `11-width-*.png` | Premiers écrans 320 / 375 / 430 / 768 / 1024 |
| `board-*.png` | Planches comparatives |
