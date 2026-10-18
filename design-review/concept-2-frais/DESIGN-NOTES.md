# Concept 2 « Frais » — boutique implémentée

Branche `concept-2-frais` · route `/` · Concept C conservé sur `/concept-c` pour comparaison.
**Non déployé** : en attente de validation.

## Parcours de la page d'accueil

1. **Bandeau d'annonce** (vert profond) : « Déstockage en cours · offres dès CHF 4.– », livraison offerte, retour
   15 jours. Desktop : les trois messages côte à côte. Mobile : fondu enchaîné lent (pas de défilement), en pause au
   survol et figé si l'utilisateur réduit les animations.
2. **Héros Frais** : panneau menthe avec le packshot réel, puces factuelles, galerie (5 visuels, balayage, zoom),
   sélecteur 3 offres avec économie réelle (« − CHF 1.– » / « Économisez CHF 1.– » face à 2 × CHF 4.–).
3. **Ajout au panier** : bouton principal visible dans le premier écran 390 × 844, lien « commander directement »,
   bloc de motivation d'achat juste dessous, réassurance livraison / retour / paiement.
4. **« Pourquoi choisir Ariel All-in-1 PODS ? »** : sommaire en puces, puis quatre chapitres de compositions
   différentes (voir ci-dessous).
5. **Avis** : uniquement depuis une source vérifiée (`VITE_REVIEWS_ENDPOINT`). Sans source : section absente.
6. **Vidéo** : uniquement avec un fichier réel (`VITE_PRODUCT_VIDEO_URL`). Sans fichier : section absente.
7. **Livraison & retours** : trois cartes + étapes après commande.
8. **FAQ compacte** (7 questions, ouverture animée).
9. **Pied de page** : identité du marchand (données configurées uniquement), liens, mention P&G.

## Motivation d'achat : uniquement des données réelles

| Élément | S'affiche si… | Jamais |
| --- | --- | --- |
| Quantités limitées | le marchand le confirme (`VITE_CLEARANCE_LIMITED=true`) | par défaut |
| Stock (« En stock · N sachets », « Plus que N ») | le serveur renvoie la quantité réelle ; à 0, bouton « Épuisé » | nombre aléatoire |
| Compte à rebours | le serveur renvoie une date de fin réelle ; calcul sur l'heure serveur (décalage d'horloge corrigé), identique sur tous les appareils, jamais remis à zéro, disparaît à l'échéance | compte à rebours fictif ou qui redémarre |
| Activité client | — | aucune notification « quelqu'un a acheté » |

Contrat serveur : `src/lib/storeStatus.js`. Les captures marquées « Aperçu — exemple de données » utilisent
`VITE_URGENCY_PREVIEW=sample` (développement uniquement ; exclu du build, vérifié par `scripts/check-bundle.mjs`).
Les captures `prod-*` montrent la page réelle sans configuration : aucune urgence, aucun avis, aucune vidéo.

## « Pourquoi choisir » — quatre compositions

1. **Une capsule. Un geste simple.** Grande photo de capsule (révélation du cadre), médaillon gros plan, trois
   repères iconographiques (dose pré-mesurée, tambour, mains sèches) tirés du mode d'emploi Ariel.
2. **60 capsules dans un seul sachet.** Chiffre éditorial « 60 » + packshot, comparateur interactif 1/2/3 sachets
   (grille de 60/120/180 capsules animée, prix, coût par lavage, économie) relié au sélecteur d'offre. Précise que le
   nombre de lavages dépend de la charge, de la salissure et de la dureté de l'eau.
3. **Pensé pour votre routine de lavage.** Photo de scène avec trois repères interactifs posés à côté des mentions
   imprimées (dissolution rapide ; lavez plus froid ; détachage dès le 1er lavage, même à l'eau froide), traduites de
   l'allemand et attribuées au fabricant. Cadran « froid » animé.
4. **Le soin du linge au quotidien.** Scène des trois sachets, routine en quatre étapes (fil conducteur), détails
   produit dépliables : pour quel linge, dosage, sécurité (OFSP, Tox Info Suisse 145), ouverture du sachet.

## Système d'icônes

Lucide, trait 1.75 sur grille 24, dans des tuiles arrondies menthe (`IconTile`, 3 tailles, 4 tons) + deux glyphes
maison dessinés sur la même grille (capsule, sachet). Utilisé pour : puces produit, chapitres, routine, détails,
livraison, retours, paiement, FAQ, urgence, panier.

## Mouvement

Révélations au défilement (fondu + glissement, cascades de 80–90 ms), ouverture de cadre photo (clip-path),
remplissage de la grille de capsules, cadran animé, repères pulsants, accordéons fluides. Pas de bibliothèque
d'animation. `prefers-reduced-motion` : tout est affiché immédiatement, sans pulsation ni fondu enchaîné.

## Cohérence

Panier (habillage « f ») et commande reprennent la police Plus Jakarta Sans (auto-hébergée), le vert Frais, les
boutons pilule et la pile de sachets réels. Libellés « sachets » partout. Prix, logique panier, bouton final
« Acheter », frontière de paiement et événements pixel inchangés.

## Vérifié dans le navigateur

Sélection d'offre (clavier compris) → prix du bouton ; ajout → panier ouvert avec le bon bundle et compteur d'en-tête ;
barre collante visible seulement après le bouton principal, masquée panier ouvert ; comparateur, repères, détails,
galerie ; compte à rebours qui décompte ; aucun débordement horizontal (320–1440) ; aucune erreur console ;
build de production vérifié.

## Limites

- Photos de capsule : agrandies depuis le collage fourni (~290 px d'origine) — des photos HD les rendraient parfaites.
- Scènes lifestyle : vraie photo de buanderie + packshot réel ; une séance photo produit resterait plus fidèle.
- Identité du marchand, moyens de paiement, raison du déstockage : toujours à fournir (`LAUNCH-CHECKLIST.md`).
