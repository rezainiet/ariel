# Mesure du parcours client

## Ce qui est en place

Après « Tout accepter », la boutique ouvre une session anonyme dans `sessionStorage` (nouvelle session après 30 minutes sans activité). Elle envoie au serveur des instantanés au démarrage, lors d'une étape du tunnel, toutes les 10 secondes et quand la page est masquée ou quittée. Les données sont dans `DATA_DIR/analytics-sessions/`, hors dépôt, et les fichiers de plus de 90 jours sont supprimés au démarrage du serveur, chaque jour et lors de la lecture du rapport. Le tableau `/admin#analytics` est protégé par la session administrateur.

Une session a un seul canal d'arrivée : Meta, Snapchat, Google, autre référent ou direct. Le classement utilise d'abord les paramètres de clic publicitaire, puis `utm_source`, puis le domaine référent. « Direct » inclut l'adresse saisie, les favoris, les liens sans référent et certains navigateurs qui ne transmettent pas le référent : ces origines ne peuvent pas être séparées de façon fiable. Les chiffres décrivent des **sessions avec consentement**, pas des personnes uniques ni tout le trafic.

Le **temps actif** s'accumule lorsque l'onglet est visible, au premier plan et qu'une interaction a eu lieu dans les deux dernières minutes. Une seconde est attribuée à la section située au centre de l'écran ; une section est « atteinte » quand elle entre dans la zone visible. Le tableau affiche la moyenne, le minimum et le maximum des secondes parmi les sessions qui ont atteint cette section. « Plus loin atteint » est la section la plus basse vue pendant la session, approximation du point d'arrêt. La profondeur maximale de défilement est également comptée à 25, 50, 75 et 90 %.

Le tunnel distingue ajout au panier, visite de la page de commande, clic valide sur « Acheter », formulaire incomplet, erreur, redirection vers le prestataire et paiement vérifié. Le clic et la redirection **ne prouvent pas un paiement**. La voie Everflow actuelle n'a pas de confirmation serveur du paiement ; son chiffre « Paiement vérifié » restera donc à zéro jusqu'à une intégration du prestataire. Meta `Purchase` est actuellement envoyé au clic valide sur « Acheter » selon la configuration demandée, et ne représente donc pas des ventes payées.

Les instantanés ne contiennent ni coordonnées client, ni URL de référent complète, ni identifiant de clic brut, ni adresse IP. Ils peuvent être perdus quand un navigateur coupe le réseau ou ferme la page avant l'envoi. Les bloqueurs, le refus de consentement et le trafic automatisé influencent les chiffres. Il n'y a pas de reconstitution du trafic antérieur au déploiement.

## Priorités pour décider quoi améliorer

1. **Paiements vérifiés et chiffre d'affaires réel**, reliés à la commande et au canal. C'est la mesure commerciale essentielle ; elle nécessite un retour fiable du prestataire.
2. **Taux de passage par étape et par canal** : arrivée → panier → commande → clic Acheter → redirection → paiement vérifié. Cela localise les pertes et compare les sources au même dénominateur.
3. **Coût et rendement par campagne** : dépenses et clics Meta/Snap rapprochés des sessions, commandes et paiements vérifiés. Les dépenses ne sont pas dans ce serveur ; elles exigent un accès en lecture aux comptes publicitaires.
4. **Frictions de commande** : formulaires incomplets, erreurs du serveur, ruptures de stock, abandon avant redirection. Garder les catégories d'erreur, jamais les valeurs des champs.
5. **Engagement par section et appareil** : portée, temps actif, profondeur, puis mobile/ordinateur pour isoler les problèmes de mise en page. La segmentation par appareil n'est pas encore collectée.
6. **Performance réelle du site** : LCP, INP et CLS, pour repérer les pages lentes et instables. À ajouter lorsque le volume de sessions permettra des comparaisons fiables.

Ne pas confondre sessions, visiteurs uniques, clics publicitaires, clics sur « Acheter », redirections et paiements. Le tableau donne des mesures internes du site ; Meta et Snapchat peuvent présenter d'autres totaux à cause du consentement, de leurs fenêtres d'attribution et de leurs propres filtres.
