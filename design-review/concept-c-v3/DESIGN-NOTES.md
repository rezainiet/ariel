# Concept C — 3e itération (visuels et sections produit)

Branche `concept-c-revision` · route `/`. **Non déployé** : en attente de validation du design.

## Ce qui a changé

1. **Héros photographique.** Le décor généré est remplacé par une **vraie photo de buanderie**
   (Mariana Rascão, Unsplash License) : niche en pin, serviettes blanches, lumière de fenêtre. Le
   packshot Ariel réel y est posé avec ombres de contact et étalonnage global ; **l'étiquette n'est pas
   modifiée**. Les inscriptions du lave-linge (autre marque) sont effacées et les flacons d'une autre
   marque restent hors cadre. Deux cadrages distincts : mobile 4:5 (titre sur le mur clair, sans
   lave-linge), desktop 4:3. Légende : « En situation, dans une buanderie ».
2. **« Le sachet, traduit ».** La face avant est en allemand, ce qui pose problème pour un client
   romand. La section remplace les cartes d'allégations : le vrai sachet, 6 repères numérotés posés
   à côté du texte imprimé, et pour chacun la traduction française + la mention allemande d'origine.
   Repères et liste sont liés (survol, focus, clic).
3. **« 60 lavages par sachet ».** Une scène réelle avec trois sachets identiques (même photo, même
   méthode), plus le chiffre le plus parlant et vérifiable de l'offre : **moins de 7 centimes le
   lavage** (6,7 / 5,8 / 5,6 ct, calculé depuis les prix et au dosage standard). Chaque colonne
   sélectionne l'offre dans le configurateur.
4. **« Une capsule, c'est tout. »** Le mode d'emploi devient une séquence éditoriale (illustrations,
   « Étape 1 »…, filets) au lieu de cartes ; l'ouverture du sachet et la sécurité sont conservées.
5. **Transparence.** « Un prix bas, des réponses claires » : 01 le prix, 02 le vendeur, en double page
   éditoriale. **Sans raison de déstockage fournie**, la page n'affiche pas « Pourquoi ce prix ? »
   mais « Le prix, en clair » (faits uniquement). La FAQ n'ajoute la question que si la raison existe.
6. **Service.** « Livré chez vous, sans frais » en colonnes à filets et ligne de temps de commande,
   plus de cartes blanches.
7. **Cohérence panier / commande.** Le panier adopte l'ivoire, le serif et le bouton « Passer commande
   · CHF x.– » de la page ; la mention non vérifiée « notre stock » est supprimée (« Expédié depuis la
   Suisse » ou la ville configurée).
8. **Mobile 320–430.** La galerie mobile en double est supprimée (accessible via « 6 photos » du héros),
   les textes secondaires des repères sont masqués sur mobile, la barre collante n'est plus tronquée
   (« 2 packs · 120 lavages » + « Commander · CHF 7.– »). Page mobile : 9 065 → 8 448 px.

## Photos écartées (et pourquoi)

- Étagère en chêne : angle rasant, l'étiquette aurait été déformée.
- Serviettes au soleil : serviettes jaunes et grises, en contradiction avec « linge blanc et clair ».
- Panier de serviettes : jouets d'enfants dans le cadre, inadapté à une lessive.

## Ce qui n'a pas été inventé

Aucun avis, aucune note, aucune raison de déstockage, aucune donnée vendeur, aucune spécification.
Chaque mention traduite figure sur la face avant fournie. Les marqueurs ambrés « À fournir » ne
s'affichent qu'en développement ; les captures `prod-*` montrent ce que verra un client.

## Captures

| Fichier | Contenu |
| --- | --- |
| `01-mobile-hero-390.png` | Premier écran mobile |
| `02-mobile-full-390.png` · `prod-02-…` | Page complète 390 px (dev / production) |
| `03` · `04a`–`04e` | Configurateur, sachet traduit, 60 lavages, mode d'emploi, sécurité, transparence |
| `05-mobile-cart.png` | Panier mobile |
| `06a/06b/06c` · `prod-06c-…` | Commande mobile, erreurs, page complète |
| `07-desktop-hero-1440.png` · `08-desktop-full-1440.png` · `prod-08-…` | Desktop 1440 px |
| `09-desktop-checkout-1440.png` · `10-mobile-sticky-bar.png` · `11-width-*` | Commande desktop, barre collante, largeurs 320–1024 |

## Limites

- Les compositions restent des compositions (photo réelle + packshot réel) : une séance photo avec le
  produit physique serait plus fidèle (perspective, reflets).
- Le packshot source fait 1 000 px : suffisant pour ces cadrages, pas pour un zoom plein écran.
- Les vignettes « capsule », « tambour », « au quotidien » viennent toujours du collage basse résolution.
