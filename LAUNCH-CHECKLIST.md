# Liste de contrôle avant mise en ligne

La boutique n'affiche **aucune** donnée inventée et **aucun** texte de développement. Tant qu'une information
manque, la rubrique correspondante est simplement **masquée** (rien n'est remplacé par une valeur fictive).
➡️ **La boutique n'est pas prête pour la production tant que les points « Bloquant » ne sont pas réglés.**

Chaque valeur se règle dans `.env.local` (modèle : `.env.example`). Justification juridique : `SWISS-MARKET-RESEARCH.md`.

## 1. Identité du marchand — Bloquant (LCD art. 3 al. 1 let. s)

| Information | Variable | Statut / effet tant qu'elle manque |
| --- | --- | --- |
| Nom commercial de la boutique | `VITE_STORE_NAME` | En-tête : libellé neutre « Déstockage Suisse » ; textes : « notre boutique » |
| Raison sociale | `VITE_MERCHANT_LEGAL_NAME` | Aranden GmbH (Sàrl) fourni comme valeur par défaut |
| Adresse postale (rue, NPA, localité) | `VITE_MERCHANT_STREET`, `_ZIP`, `_CITY` | Route du Moulin 50, 3977 Granges fourni par défaut |
| Numéro IDE (CHE-…) | `VITE_MERCHANT_UID` | CHE-109.911.687 fourni par défaut |
| Registre du commerce et gérant | `VITE_MERCHANT_REGISTER_NUMBER`, `VITE_MERCHANT_MANAGER` | CH-626.4.007.970-5 et Zika Cikiric fournis par défaut |
| E-mail du service client | `VITE_SUPPORT_EMAIL` | sales@destockage-suisse.store fourni par défaut |
| Téléphone (recommandé) | `VITE_SUPPORT_PHONE` | Masqué |
| Hébergeur du site | `VITE_HOSTING_PROVIDER` | Rubrique « Hébergement » masquée |
| Mention TVA (ex. « TVA incluse ») | `VITE_MERCHANT_VAT_NOTE` | Absente du récapitulatif de commande |

## 2. Paiement — Bloquant

Deux voies existent ; la redirection externe est prioritaire quand elle est activée.

### A. Redirection vers une page de paiement externe (prête) — réglée dans `/admin`

- [ ] Déployer avec le serveur Node (`npm run build` puis `npm start`, voir README) et définir `ADMIN_PASSWORD`
      (12 caractères minimum, jamais dans le dépôt) et `PUBLIC_ORIGIN` (adresse publique de la boutique, pour l'URL
      de la photo produit).
- [ ] Dans `/admin` → Paiement : domaine de paiement, chemin (`/{code}` par défaut), **un code par offre**
      (1, 2, 3 sachets), noms de produit, photo (facultatif), paramètres d'URL (valeurs par défaut : `sub10` prénom,
      `adv3` nom, `sub3` code postal, `sub4` e-mail, `sub6` ville, `sub7` adresse + complément, `sub8` téléphone,
      `adv1` produit, `adv2` photo). Vérifier l'aperçu, puis **Activer** et **Enregistrer**.
- [ ] Données personnelles dans l'URL : le domaine de paiement doit être de confiance (HTTPS, contrat de
      sous-traitance). La politique de confidentialité le mentionne automatiquement quand la redirection est active.
- [ ] Confirmation de commande et e-mails : gérés par la page de paiement externe. La boutique ne reçoit aucun
      retour de paiement : l'événement PURCHASE (Snap) n'est pas envoyé dans cette voie (aucun succès non vérifié).
- [ ] Tester une commande réelle par offre (1, 2, 3 sachets) avant la mise en ligne.

### B. Prestataire intégré avec vérification serveur (non connecté)

- [ ] `VITE_PAYMENT_PROVIDER` + `VITE_CHECKOUT_API` : `POST /checkout-session` (valider avec `server/validate-order.mjs`,
      montant recalculé), `GET /orders/verify?session=…` ; retours `/checkout/confirmation?session=…`,
      `/checkout?paiement=annule`, `/checkout?paiement=erreur`.
- [ ] `VITE_PAYMENT_METHODS` = uniquement les moyens réellement activés.

Sans voie active, « Acheter » n'envoie rien : le client lit « le paiement en ligne n'est pas encore ouvert ».

## 3. Livraison — Bloquant pour afficher un délai

Confirmé et affiché : **livraison offerte en Suisse**, livraison en Suisse uniquement.

- [x] Délai de livraison : **3 jours ouvrables maximum** (fixé le 2026-10-29), affiché sur la page produit, le panier,
      la FAQ, le contact, la page Livraison et les CGV. `VITE_DELIVERY_ESTIMATE_DAYS` peut le remplacer.
- [ ] Lieu d'expédition (`VITE_DISPATCH_CITY`) et transporteur (`VITE_CARRIER`) — sans valeur, masqués.

## 4. Retours et remboursements — Bloquant

Confirmé et affiché : **retour possible sous 15 jours après réception** ; garantie légale pour les défauts.

Textes par défaut en ligne (src/i18n/fr.js / de.js / en.js, `pages.policies`), **à faire confirmer par Aranden GmbH** :
sachets non ouverts (sauf produit défectueux, endommagé ou erroné), frais de retour à la charge du client
(sauf défaut), remboursement sous 14 jours au prorata de l'offre sur le moyen de paiement, adresse de retour
envoyée par e-mail, for au siège du vendeur sous réserve des fors des consommateurs (art. 32 et 35 CPC).
Chaque variable renseignée remplace le texte par défaut ; renseigner aussi ses versions `_DE` et `_EN`.

- [ ] Adresse de retour (`VITE_RETURN_ADDRESS`, `_DE`).
- [ ] Sachets ouverts acceptés ou non (`VITE_RETURN_CONDITION`, `_DE`).
- [ ] Qui paie les frais de retour (`VITE_RETURN_COSTS`, `_DE`).
- [ ] Délai et moyen de remboursement (`VITE_REFUND_TERMS`, `_DE`).
- [ ] For juridique (`VITE_JURISDICTION`, `_DE`).
- [ ] Relecture juridique des pages Retours, CGV, Confidentialité, Mentions légales.

## 5. Produit — Bloquant

- [ ] Confirmer que les sachets vendus sont exactement **Ariel All-in-1 PODS Universal+ « 60 PODS »** et leur EAN.
- [ ] Étiquetage conforme pour la Suisse (mentions FR/IT au dos), provenance, lot.

### Stock (réglé dans `/admin` → Stock) — à fournir par le marchand

Tant que la quantité n'est pas saisie, le stock reste **non renseigné** : les commandes ne sont pas limitées et rien
n'est affiché comme épuisé. Aucune quantité n'a été inventée.

- [ ] Nombre réel de sachets 60 PODS prêts à l'expédition (une seule référence : les offres 1/2/3 sachets puisent
      dans ce stock). Si les lots de 2 ou 3 sont des paquets préconditionnés distincts, le signaler : il faudrait
      alors un stock par lot.
- [ ] Durée de réservation pendant le paiement hébergé (30 minutes par défaut), à aligner sur la durée de session Everflow.
- [ ] Procédure de rapprochement : qui vérifie chez Everflow les paiements reçus et clique « Paiement reçu »
      (seule action qui déduit définitivement le stock), et à quelle fréquence. Sans webhook/postback Everflow,
      une réservation non confirmée expire et ses sachets redeviennent vendables.
- [ ] Un seul processus serveur doit écrire `DATA_DIR/stock.json` (pas de répartition sur plusieurs instances).

## 6. Mesure d'audience et vie privée

- [ ] `VITE_SNAP_PIXEL_ID` seulement avec la bannière de consentement (intégrée) ; la page Confidentialité s'adapte
      automatiquement (pixel actif ou non).

## 7. Contenus facultatifs — masqués tant qu'ils ne sont pas réels

| Contenu | Variable | Sans donnée réelle |
| --- | --- | --- |
| Avis clients vérifiés | `VITE_REVIEWS_ENDPOINT` | Section avis absente |
| Vidéo produit / client | `VITE_PRODUCT_VIDEO_URL`, `_POSTER`, `_CAPTION` | Section vidéo absente |
| « Quantités limitées » (confirmé par écrit) | `VITE_CLEARANCE_LIMITED=true` | Mention absente |
| Quantité restante et compte à rebours de campagne | `VITE_STORE_STATUS_API` | Absents (jamais de stock ni de compte à rebours fictif) ; l'état « épuisé » vient de `/admin` → Stock |
| Aide à la saisie d'adresse (service suisse réel) | `VITE_ADDRESS_API` | Aucune suggestion |

## 8. Visuels — recommandé

- Photos HD de capsule (les visuels actuels sont agrandis depuis le collage fourni) ; séance photo produit.

## Garde-fous automatiques

`npm run build` échoue si le bundle public contient un texte de développement, des avis d'exemple, un nom de
variable de configuration ou les archives de conception (`scripts/check-bundle.mjs`).
`node server/validate-order.mjs` teste la validation serveur (10 cas).
