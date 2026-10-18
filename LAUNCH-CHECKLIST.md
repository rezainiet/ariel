# Liste de contrôle avant mise en ligne

La boutique n'invente **aucune** information marchand. Tant qu'un élément manque, il apparaît en
développement sous forme de marqueur ambré « À fournir » et **disparaît** en production.
➡️ Ne lancez pas tant que les points **Bloquant** ne sont pas réglés.

Chaque valeur se configure dans `.env.local` (voir `.env.example`). Justification des exigences :
`SWISS-MARKET-RESEARCH.md`.

## 1. Identité du marchand — Bloquant (LCD art. 3 al. 1 let. s)

| Information | Variable | Où elle s'affiche |
| --- | --- | --- |
| Nom de la boutique (remplace « NOM DE LA BOUTIQUE ») | `VITE_STORE_NAME` | En-tête, pied de page, partout |
| Raison sociale exacte (registre du commerce) | `VITE_MERCHANT_LEGAL_NAME` | « Qui vous livre ? », pied de page, mentions légales, commande |
| Adresse postale (rue, NPA, localité) | `VITE_MERCHANT_STREET`, `_ZIP`, `_CITY` | Idem |
| Numéro IDE (CHE-…) | `VITE_MERCHANT_UID` | Idem |
| E-mail du service client (un formulaire seul ne suffit pas) | `VITE_SUPPORT_EMAIL` | Idem + FAQ + retours |
| Téléphone (recommandé) | `VITE_SUPPORT_PHONE` | Contact, mentions |
| Hébergeur du site | — (texte des mentions légales) | Mentions légales |

## 2. Prix et déstockage — Bloquant

- [ ] **Raison réelle du déstockage** (`VITE_CLEARANCE_REASON`), formulée par le marchand. Aucune raison
      ne sera inventée (fin de série, surstock, emballage étranger…) : seule la vraie raison est publiable.
      Sans elle, la page n'affiche pas « Pourquoi ce prix ? » mais « Le prix, en clair » (faits seulement),
      et la question n'apparaît pas dans la FAQ.
- [ ] Statut **TVA** et mention à afficher (`VITE_MERCHANT_VAT_NOTE`, ex. « TVA incluse ») — l'OIP exige
      le prix final TVA comprise.
- [ ] Confirmer que les prix 4.– / 7.– / 10.– sont les prix finaux, sans frais ajoutés.
- [ ] Ne jamais ajouter de prix barré ou de % sans base conforme à l'OIP.

## 3. Produit — Bloquant

- [ ] Confirmer que les sachets vendus sont exactement **Ariel All-in-1 PODS Universal+ « 60 PODS »**
      (le visuel fourni) et leur EAN.
- [ ] Vérifier l'**étiquetage** des sachets (face avant en allemand) : présence des mentions requises
      en français/italien au dos, conformité aux exigences suisses sur les produits chimiques.
- [ ] Confirmer l'origine et l'authenticité des produits (provenance, lot, date).

## 4. Livraison — Bloquant

- [ ] Ville réelle de l'entrepôt (`VITE_DISPATCH_CITY`) — remplace « Suisse » près du bouton d'achat.
- [ ] Transporteur (`VITE_CARRIER`, ex. « La Poste (PostPac Economy) »).
- [ ] Délai réel (`VITE_DELIVERY_ESTIMATE_DAYS`) : PostPac Economy = 2 jours ouvrables en principe ;
      3 jours affichés supposent 1 jour de préparation — à confirmer (heure limite d'expédition).
- [ ] Gratuité de la livraison confirmée pour toute la Suisse.

## 5. Retours et remboursements — Bloquant

- [ ] Adresse de retour physique.
- [ ] Sachets ouverts/entamés acceptés ou non.
- [ ] Qui paie les frais de retour.
- [ ] Délai et moyen de remboursement.
- [ ] Relecture juridique de `/retours-remboursements`, `/conditions-generales-de-vente`,
      `/politique-de-confidentialite`.

## 6. Paiement — Bloquant

- [ ] Choisir un prestataire suisse ou compatible (TWINT + cartes + wallets recommandés pour un panier
      de CHF 4.– à 10.– ; facture à évaluer selon les frais).
- [ ] Serveur de commande (`VITE_CHECKOUT_API`) : création de session, **vérification serveur**,
      e-mail de confirmation immédiat (LCD).
- [ ] `VITE_PAYMENT_PROVIDER` et `VITE_PAYMENT_METHODS` = **uniquement** les moyens réellement actifs.
- [ ] Tester `/commande/confirmation` : PURCHASE n'est envoyé qu'après vérification serveur.

## 7. Mesure d'audience et vie privée — Bloquant si le pixel est activé

- [ ] `VITE_SNAP_PIXEL_ID` renseigné **seulement** avec la bannière de consentement (déjà intégrée).
- [ ] Politique de confidentialité complétée (responsable, sous-traitants : paiement, transporteur,
      Snapchat ; durées de conservation ; droits) — nLPD.

## 8. Avis clients — Optionnel

- [ ] Brancher une plateforme d'avis vérifiés (`VITE_REVIEWS_ENDPOINT`). D'ici là, **aucune** note,
      étoile ou nombre d'avis n'est affiché dans la boutique (le composant est prêt).
- Le build échoue automatiquement si des avis d'exemple se retrouvent dans le bundle (`scripts/check-bundle.mjs`).

## 9. Visuels — Fortement recommandé

| Besoin | Pourquoi |
| --- | --- |
| **Packshot HD officiel** (≥ 2000 px, fond détouré ou blanc, face avant) | Seul visuel net actuel (1000 px). Indispensable pour un zoom de qualité. |
| **Packshots HD dos et côté du sachet** | Montrer les mentions en français, le mode d'emploi, les pictogrammes de sécurité. |
| **Photo HD d'une capsule** (gros plan, fond neutre) | Le gros plan actuel provient du collage (~290 px). |
| **Séance photo avec le vrai produit** (recommandée) | Le héros et la scène « 3 sachets » sont de **vraies photos de buanderie** (Unsplash License, `assets-src/stock/CREDITS.md`) dans lesquelles le packshot réel est posé. Une séance photo réelle restera plus fidèle (perspective, lumière, reflets). |
| Autorisation d'utiliser les photos fournies | Confirmer les droits sur le collage d'origine. |

Fichiers à déposer : `public/images/` puis mise à jour des chemins dans `src/config/assets.js` et
`src/concepts/c/media.js`. Les compositions se régénèrent (par ex. avec un packshot HD détouré) :
`python scripts/compose-hero-photo.py assets-src/stock/unsplash-in7u-CJYHyA-laundry-nook.jpg public/images/packshot-cutout.webp public/images`
(Pillow avec AVIF + numpy).

## 10. Marque et Swissness

- [ ] Pas de croix suisse ni de drapeau dans le logo tant que le siège et l'administration en Suisse ne
      sont pas confirmés (critères Swissness pour les services).
- [ ] Mention « Ariel est une marque de The Procter & Gamble Company. Cette boutique n'est pas le site
      officiel de la marque. » — conservée.
- [ ] Label « Swiss Online Garantie » : uniquement après adhésion et certification réelles.
