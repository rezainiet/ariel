# Liste de contrôle avant mise en ligne

La boutique n'affiche **aucune** donnée inventée et **aucun** texte de développement. Tant qu'une information
manque, la rubrique correspondante est simplement **masquée** (rien n'est remplacé par une valeur fictive).
➡️ **La boutique n'est pas prête pour la production tant que les points « Bloquant » ne sont pas réglés.**

Chaque valeur se règle dans `.env.local` (modèle : `.env.example`). Justification juridique : `SWISS-MARKET-RESEARCH.md`.

## 1. Identité du marchand — Bloquant (LCD art. 3 al. 1 let. s)

| Information manquante | Variable | Effet tant qu'elle manque |
| --- | --- | --- |
| Nom commercial de la boutique | `VITE_STORE_NAME` | En-tête : libellé neutre « Déstockage Suisse » ; textes : « notre boutique » |
| Raison sociale exacte (registre du commerce) | `VITE_MERCHANT_LEGAL_NAME` | Absente du pied de page, des mentions légales, des CGV, de la confidentialité |
| Adresse postale (rue, NPA, localité) | `VITE_MERCHANT_STREET`, `_ZIP`, `_CITY` | Idem |
| Numéro IDE (CHE-…) | `VITE_MERCHANT_UID` | Idem |
| E-mail du service client | `VITE_SUPPORT_EMAIL` | Page Contact sans e-mail ; FAQ et retours renvoient vers /contact |
| Téléphone (recommandé) | `VITE_SUPPORT_PHONE` | Masqué |
| Hébergeur du site | `VITE_HOSTING_PROVIDER` | Rubrique « Hébergement » masquée |
| Mention TVA (ex. « TVA incluse ») | `VITE_MERCHANT_VAT_NOTE` | Absente du récapitulatif de commande |

## 2. Paiement — Bloquant

État actuel : **aucun prestataire connecté**. Le formulaire de commande fonctionne (validation, récapitulatif),
mais « Acheter » n'envoie rien : le client lit « le paiement en ligne n'est pas encore ouvert : aucune commande n'a
été enregistrée et aucun montant n'a été débité ».

- [ ] Choisir le prestataire (cartes, Apple Pay, Google Pay, TWINT) avec **page de paiement hébergée** ou champs
      sécurisés du prestataire. Aucune donnée de carte ne doit passer par nos formulaires.
- [ ] Serveur de commande (`VITE_CHECKOUT_API`) :
  - `POST /checkout-session` : valider avec `server/validate-order.mjs` (mêmes règles que le navigateur,
    **montant recalculé depuis l'offre**, jamais repris du client), créer la session, renvoyer `{ redirectUrl }` ;
  - `GET /orders/verify?session=…` : vérifier le paiement auprès du prestataire (API/webhook), renvoyer
    `{ verified: true, orderId, total, currency, packs }` ;
  - envoyer l'e-mail de confirmation de commande, puis l'e-mail d'expédition.
- [ ] URL de retour chez le prestataire : succès `/checkout/confirmation?session=…`, annulation
      `/checkout?paiement=annule`, erreur `/checkout?paiement=erreur` (le formulaire est conservé).
- [ ] `VITE_PAYMENT_PROVIDER` + `VITE_CHECKOUT_API` renseignés ; `VITE_PAYMENT_METHODS` = **uniquement** les moyens
      réellement activés (`card`, `twint`, `apple_pay`, `google_pay`, …).
- [ ] Tester paiement réussi, refusé, annulé ; la confirmation n'affiche un succès et n'envoie PURCHASE (Snap)
      **qu'après** vérification serveur.

## 3. Livraison — Bloquant pour afficher un délai

Confirmé et affiché : **livraison offerte en Suisse**, livraison en Suisse uniquement.

- [ ] Délai réel (`VITE_DELIVERY_ESTIMATE_DAYS`) — sans valeur, aucun délai n'est affiché.
- [ ] Lieu d'expédition (`VITE_DISPATCH_CITY`) et transporteur (`VITE_CARRIER`) — sans valeur, masqués.

## 4. Retours et remboursements — Bloquant

Confirmé et affiché : **retour possible sous 15 jours après réception** ; garantie légale pour les défauts.

- [ ] Adresse physique de retour (`VITE_RETURN_ADDRESS`).
- [ ] Sachets ouverts acceptés ou non (`VITE_RETURN_CONDITION`).
- [ ] Qui paie les frais de retour (`VITE_RETURN_COSTS`).
- [ ] Délai et moyen de remboursement (`VITE_REFUND_TERMS`).
- [ ] For juridique (`VITE_JURISDICTION`).
- [ ] Relecture juridique des pages Retours, CGV, Confidentialité, Mentions légales.

## 5. Produit — Bloquant

- [ ] Confirmer que les sachets vendus sont exactement **Ariel All-in-1 PODS Universal+ « 60 PODS »** et leur EAN.
- [ ] Étiquetage conforme pour la Suisse (mentions FR/IT au dos), provenance, lot.

## 6. Mesure d'audience et vie privée

- [ ] `VITE_SNAP_PIXEL_ID` seulement avec la bannière de consentement (intégrée) ; la page Confidentialité s'adapte
      automatiquement (pixel actif ou non).

## 7. Contenus facultatifs — masqués tant qu'ils ne sont pas réels

| Contenu | Variable | Sans donnée réelle |
| --- | --- | --- |
| Avis clients vérifiés | `VITE_REVIEWS_ENDPOINT` | Section avis absente |
| Vidéo produit / client | `VITE_PRODUCT_VIDEO_URL`, `_POSTER`, `_CAPTION` | Section vidéo absente |
| « Quantités limitées » (confirmé par écrit) | `VITE_CLEARANCE_LIMITED=true` | Mention absente |
| Stock réel et compte à rebours de campagne | `VITE_STORE_STATUS_API` | Absents (jamais de stock ni de compte à rebours fictif) |
| Aide à la saisie d'adresse (service suisse réel) | `VITE_ADDRESS_API` | Aucune suggestion |

## 8. Visuels — recommandé

- Photos HD de capsule (les visuels actuels sont agrandis depuis le collage fourni) ; séance photo produit.

## Garde-fous automatiques

`npm run build` échoue si le bundle public contient un texte de développement, des avis d'exemple, un nom de
variable de configuration ou les archives de conception (`scripts/check-bundle.mjs`).
`node server/validate-order.mjs` teste la validation serveur (10 cas).
