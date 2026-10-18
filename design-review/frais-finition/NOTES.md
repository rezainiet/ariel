# Boutique Frais — finition et commande

Branche `concept-2-frais` · **non déployé**.

## Ce qui a été retiré de l'interface client

Marqueurs « À fournir », « À confirmer avant la mise en ligne », nom fictif « Nom de la boutique », avis d'exemple et
bandeau d'aperçu, stock et compte à rebours d'exemple, emplacement vidéo avec noms de variables, messages de
configuration du paiement, délai « 3 jours ouvrables » et « expédié depuis la Suisse » non confirmés, archives de
conception publiques (`/concept-a|b|c`, `/v1`). Rien n'a été remplacé par une donnée inventée : les rubriques sans
information réelle sont masquées, et la liste des éléments manquants est dans `LAUNCH-CHECKLIST.md`.

Sans nom commercial configuré, l'en-tête affiche le libellé descriptif « Déstockage Suisse » et les textes disent
« notre boutique ».

## Commande (`/checkout`)

- Coordonnées : Prénom*, Nom*, Adresse e-mail*, Téléphone (facultatif). Adresse : Pays Suisse (CH), Adresse*,
  Complément, Code postal* (4 chiffres, 1000–9999, clavier numérique), Ville*.
- Autocomplétion navigateur standard (`given-name`, `email`, `postal-code`…) ; suggestions d'adresse uniquement avec
  un service réel (`VITE_ADDRESS_API`).
- Validation en français au fil de la saisie et à l'envoi, résumé des erreurs avec liens vers les champs, valeurs
  conservées (rechargement, retour depuis les conditions, modification de l'offre). Mêmes règles côté serveur
  (`src/lib/orderValidation.js` + `server/validate-order.mjs`, montant recalculé).
- Récapitulatif : image produit, sachets, capsules, sous-total, livraison offerte, économie, total en CHF ;
  sélecteur 1/2/3 sachets (remplace l'offre, jamais de doublon). Mobile : repliable ; desktop : colonne collante.
- Réassurance confirmée près du bouton (livraison offerte, retour 15 jours) + liens vers Livraison et Retours,
  résumé de la politique de retour dépliable, acceptation des CGV obligatoire.
- Paiement : moyens affichés seulement s'ils sont activés ; redirection vers la page hébergée du prestataire ;
  états chargement / erreur / annulation (`?paiement=annule`) ; succès uniquement après vérification serveur.
  Sans prestataire : bouton « ACHETER — CHF x.– » qui valide le formulaire puis indique honnêtement que le paiement
  n'est pas encore ouvert (aucune commande, aucun débit).

## Tests effectués (navigateur)

- Parcours 1, 2 et 3 sachets : offre → panier → commande, montant identique à chaque étape (CHF 4.– / 7.– / 10.–).
- Modification de l'offre dans la commande : montant du bouton mis à jour, e-mail et adresse conservés.
- Validation : champs vides, e-mail invalide, NPA « 123 », « 0123 » et lettres filtrées, téléphone invalide, CGV.
- Rechargement de `/checkout` : panier et coordonnées conservés ; retour `?paiement=annule` : message d'annulation.
- Aucune erreur console sur l'accueil, la commande, la confirmation et toutes les pages de service ; aucun
  débordement horizontal (320, 375, 390, 430, 768, 1440 px).
- `npm run build` : bundle contrôlé ; `node server/validate-order.mjs` : 10/10.

## Captures

| Fichier | Contenu |
| --- | --- |
| `01-mobile-accueil-390` / `02-desktop-accueil-1440` | Accueil complet, sans contenu de développement |
| `03-mobile-hero-390` / `15-desktop-hero-1440` | Premier écran |
| `04-mobile-panier-390` → `05-mobile-panier-vers-commande-390` | Panier puis arrivée sur la commande |
| `06` / `07-mobile-commande…` / `12` / `13-desktop-commande…` | Formulaire de commande mobile et desktop |
| `08-mobile-recapitulatif-390` | Récapitulatif déplié avec sélecteur d'offre |
| `09` / `10-mobile-erreurs…` / `14-desktop-erreurs-1440` | États d'erreur de validation |
| `11-mobile-paiement-non-ouvert-390` | Formulaire valide, paiement pas encore connecté |
| `20-largeur-*-accueil` / `21-largeur-*-commande` | 320, 375, 390, 430, 768, 1440 px |
