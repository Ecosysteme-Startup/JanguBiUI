# Écarts assumés — lot A (site public et inscription)

## Données absentes (aucun endpoint créé, bloc retiré ou adapté)
| Écran | Bloc de la maquette | Rendu | Ce qu'il faudrait côté backend |
|---|---|---|---|
| Accueil, Parole du jour | « Écouter, 7 min » ; carte « Écouter les lectures » (lecteur, vitesse) | retirés | URL audio des lectures du jour (`audio_url` par jour, lecteur désigné) |
| Parole du jour | pastilles de couleur liturgique sur tout le calendrier du mois | pastilles des seuls jours déjà chargés (semaine affichée) | `GET /liturgy/?month=AAAA-MM` : couleur et célébration de chaque jour du mois |
| Parole du jour | « Traduction Louis Segond (1910) » | mention `notice` de l'API (ex. Bible Crampon) | — |
| Paroisses | statut « En préparation » | deux états seulement : « Sur Jàngu Bi » / « Annuaire diocésain » | statut d'accueil d'une paroisse (en préparation) dans `GET /public/nodes/` |
| Paroisses | carte dessinée (quartiers, zoom, « Me localiser ») | carte schématique des positions connues (lat/lng), sans zoom ni géolocalisation ; rien si aucune position | coordonnées des paroisses ; fond de carte (tuiles) à choisir |
| Paroisses | tri « par présence sur Jàngu Bi » | tri par nom (API) | paramètre `ordering` sur `GET /public/nodes/` |
| Accueil (« Trouver votre paroisse »), Paroisses | « Prochaine messe aujourd'hui à 18 h 30 » pour chaque paroisse | calculé des horaires de la semaine pour les paroisses ouvertes seulement (une requête par paroisse ouverte) ; sinon messes du dimanche de l'annuaire | prochaine messe dans `GET /public/nodes/` |
| Fiche paroisse | « Épinglée », « Voir les 6 annonces » | les 4 dernières annonces publiques ; pas de lien « toutes » (page publique inexistante) | champ `is_pinned` ; liste publique paginée des annonces |
| Fiche paroisse | photos | dessins au trait (`data-photo-slot`) | photos des paroisses |
| Fiche paroisse | clergé avec secrétaire paroissiale | clercs nommés seulement (API) ; titre « Clergé » | secrétariat nominatif (si souhaité) |
| Pour les paroisses | « 1 480 lectures », « Délai moyen 4,2 jours », « 12 rendez-vous » | retirés | agrégats publics du pilote |
| Pour les paroisses | citation de l'abbé Augustin Ndiaye | remplacée par une phrase factuelle sur le pilote (pas de témoignage nominatif non validé) | témoignage validé par l'intéressé |
| Pour les paroisses | téléphone +221 33 869 21 40 | retiré (numéro non confirmé) ; e-mail paroisses@jangubi.sn gardé | coordonnées officielles à confirmer (aussi aide@ et donnees@jangubi.sn) |
| Inscription-Paroisse | « 3 prêtres joignables par messagerie chiffrée » | retiré | nombre de prêtres joignables par paroisse, public |
| Inscription-Paroisse | « Annonce épinglée » | « Dernière annonce » (réelle) | `is_pinned` |
| Inscription-Consentement | « Après la création, un lien de confirmation est envoyé… » | retiré : l'e-mail est déjà vérifié à l'étape 1 (Keycloak) | — |

## Fonctions gardées, absentes de la maquette
- Accueil : les deux aperçus « Demande d'acte » et « Parler à un prêtre » restent des exemples illustratifs (non interactifs, `aria-hidden`) ; nom du prêtre remplacé par « Un prêtre de votre paroisse », « Chiffré de bout en bout » par « Messages chiffrés » (ADR-014).
- Parole du jour : bouton « Aujourd'hui » quand une autre date est affichée ; lien « Recevoir la Parole chaque matin » sous la mention de droits ; « Envoyer » = partage natif, sinon e-mail (le SMS disparaît).
- Paroisses : bouton « Effacer les filtres » (les pastilles de filtres appliqués disparaissent, comme dans la maquette).
- Fiche paroisse : bouton « Cette semaine » / « Semaine suivante » (paramètre `start`) ; carte « Prochains événements » (agenda public) en bas de la colonne ; « Démarches » seulement pour une paroisse ouverte ; avis « pas encore ouverte » pour une fiche d'annuaire ; itinéraire par lieu (OpenStreetMap, position ou recherche).
- Pour les paroisses : champ « Diocèse » séparé (le contrat `POST /public/contact/` exige `diocese_node_id`) et case « Le curé est informé » (facultative).
- Inscription : filtre « Tous les diocèses » en tête des pilules ; « Déjà un compte ? Se connecter » remplacé par « Se déconnecter » (l'utilisateur est connecté sur /bienvenue) ; pas de bouton « Retour » à l'étape 2 (l'étape 1 est dans Keycloak) ; « Modifier » des informations → « Modifier plus tard » (profil) ; bouton « Terminer mon inscription » au lieu de « Créer mon compte » (le compte existe déjà) ; notification facultative sans mention « par e-mail » (le canal dépend des préférences).
- Pages légales et /connexion/erreur : pas de maquette ; langage des pages publiques (titre 40, sommaire en carte surface) ; l'erreur de connexion utilise `ErrorScreen` des fondations.

## Textes corrigés
- « chiffrée de bout en bout » → « Messages chiffrés, aucun administrateur n'y a accès » (Accueil, fiche, offre).
- Chiffres de maquette (62 paroisses, « Quatre autres paroisses ») remplacés par les comptes réels de l'annuaire ou retirés.
