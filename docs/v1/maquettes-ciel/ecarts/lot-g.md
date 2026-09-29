# Écarts maquette ↔ produit — lot G (espace diocèse et plateforme)

Blocs de la maquette sans source de données réelle (non affichés, aucune donnée inventée) et fonctions existantes absentes de la maquette (conservées dans le style Ciel).

## DIO-Tableau-de-bord (`/espace/[nodeId]`, diocèse)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| Sélecteur de mois « Septembre 2026 » | Non affiché : le tableau de bord porte sur une période glissante de 30 jours (`period`) | Un paramètre `month=YYYY-MM` sur `GET /dashboards/nodes/{id}/` |
| « Exporter le rapport » | Non affiché | Un export (CSV/PDF d'agrégats) du tableau de bord |
| Statut « En préparation » et colonne « Prochaine étape » des paroisses (formation, convention, référent à nommer, date d'ouverture prévue) | Non affichés : seules les paroisses **ouvertes** (`is_active_on_platform`) sont listées, badge « Active » | Un suivi d'onboarding par paroisse (statut, prochaine étape, date prévue) |
| Tableau des demandes **par paroisse** (reçues, délai, retard, à retirer) | Remplacé par une ligne « Toutes les paroisses » (agrégat du nœud) | `actes` ventilés par paroisse dans l'API du tableau de bord |
| Histogramme « Demandes reçues par semaine » | Non affiché | Série hebdomadaire des demandes reçues |
| « Par type d'acte » | Remplacé par « Par statut » (donnée existante `actes.counts`) | Ventilation par type d'acte |
| « Réorientées vers une paroisse non ouverte » | Non affiché | Compteur de réorientations |
| « Prochaines nominations » avec noms, initiales et fonctions | **Règle métier** : au-dessus de la paroisse, agrégats uniquement → seul le nombre de nominations proposées est montré, avec « Tout voir » vers l'écran Nominations | — |
| Alerte « Mouvement annuel : 1 ligne sur 42 reste à corriger » | Non affichée : pas d'état d'import persistant | Un état de l'import en cours (lignes en erreur) |
| « À suivre » : convention à signer, référent à nommer | Non affichés (pas de donnée). « À suivre » reprend les signaux réels : actes en retard, conversations sans réponse à 48 h, nominations proposées, déclarations de clercs à vérifier | Tâches de déploiement par paroisse |
| « Fidèles sur Jàngu Bi — Saint-Dominique, cette semaine » | Agrégat de tout le sous-arbre sur 30 jours (fidèles rattachés, actifs, nouveaux, lectures d'annonces, conversations, 1re réponse médiane, confessions réservées / offertes) | — |

Fonctions existantes gardées hors maquette : bouton « Préparer un mouvement » (vers Nominations, si `offices.nommer`), horodatage « données au … », mention de période.
Tableau « Déploiement par doyenné » (ancien écran) : remplacé par la liste des paroisses ouvertes avec leur doyenné, comme la maquette.

## DIO-Structure (`/espace/[nodeId]/structure`)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| Compteurs « 62 paroisses · 188 CEB » et nombre d'enfants par ligne de l'arbre | Non affichés : l'API ne donne que `has_children` | Un `children_count` (et/ou comptes par type) sur `NodeOutputSerializer` |
| Province au-dessus du diocèse et « 6 autres diocèses de la province » (hors périmètre) | Non affichés : l'arbre part du nœud du contexte ; le chemin des ancêtres est dans la fiche (« Chemin ») | — |
| Sous-titre du nœud « 12 paroisses et 43 CEB, du Plateau à Fann » | Remplacé par l'adresse et la ville du nœud | Comptes par type dans le sous-arbre |
| Fiche : « Registres : par paroisse », « Dernière modification » | Remplacés par « Statut canonique » et « Type » (données réelles) | `updated_at` et mode de tenue des registres |
| « Sur Jàngu Bi : 1 active, 2 à venir » (agrégat du sous-arbre) | Montre l'état du nœud lui-même (« Active » / « Pas encore ouverte ») | Agrégat d'ouverture par sous-arbre |
| Offices vacants (« Secrétaire du doyenné — Vacant depuis le 1er août ») | Non affichés : seuls les titulaires en vigueur et proposés sont connus | Liste des offices attendus par type de nœud et leurs vacances |
| Sous-nœuds : colonne « CEB » et statut « En préparation » | Colonnes Nom, Type, Jàngu Bi (Active / Pas encore) | Comptes de CEB, statut d'onboarding |
| Menu « Plus d'actions » (…) | Remplacé par le bouton icône « Ajouter un enfant » (fonction existante) | — |

Fonctions existantes gardées hors maquette : filtre par type de nœud (sous la recherche), « Importer un CSV » (nœuds ou lieux de culte), section « Lieux de culte » (ajout, modification), bouton « Tout replier ».

## DIO-Nominations (`/espace/[nodeId]/nominations`)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| « Exporter » | Non affiché ; la place est prise par « Importer » (ouvre l'assistant du mouvement annuel, fonction existante) | Export CSV du registre |
| Recherche « Nom, office ou paroisse » | Non affichée : l'API des nominations n'a pas de recherche plein texte | Paramètre `q` sur `GET /hierarchy/assignments/` |
| Onglet « Prennent fin ce mois » | Non affiché (pas de filtre par date de fin) ; le badge « Prend fin » et la date de fin en couleur d'alerte signalent ces lignes | Filtre `end_before` / `ending_this_month` et son compteur |
| Filtre « Début depuis septembre 2019 » et tri « Début ↓ » | Non affichés | Filtre et tri par date de début |
| Filtre « Doyenné » | Remplacé par le filtre de nœud existant (le diocèse et ses sous-nœuds) | — |
| Assistant d'import : pas « Déposer / Vérifier / Publier », carte du fichier déposé, lignes éditables, « Remplacer », « Télécharger le modèle » | L'assistant existant (`ImportWizard`, composant partagé) est conservé : simulation puis application, date d'effet obligatoire | Modèle de fichier téléchargeable ; correction de ligne en place |

Fonctions existantes gardées hors maquette : onglet « Annulées », « Qualité » (curé / administrateur), « Terminer », « Annuler » par ligne, panneau « Nommer une personne ».

## DIO-Clerge (`/espace/[nodeId]/clerge`)

La maquette montre un **annuaire du clergé** (offices en cours, parcours, compte Jàngu Bi, contact de chancellerie). Aucune API n'expose cet annuaire : l'écran reste la **file des déclarations d'état de vie à vérifier** (`GET /hierarchy/verifications/`), mise en page comme la maquette (liste + fiche latérale).

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| Liste de tous les prêtres et diacres, colonne « Office principal », « Jàngu Bi : Actif / Invité / Sans compte » | Liste des déclarations : nom, état de vie · degré, incardination · institut, statut (« À vérifier » / « Complément demandé ») | Un annuaire du clergé par sous-arbre (personne, office principal, état du compte) |
| Filtres « Doyenné », « Office » | Remplacés par un filtre « Statut » (données réelles) | Filtres de l'annuaire |
| « Ajouter une fiche », « Nommer à un office », « Modifier » | Non affichés (les nominations se font dans l'écran Nominations) | Création de fiche clerc sans compte |
| Fiche : « Ordonné le … », offices en cours, parcours, « Sur Jàngu Bi », contact de chancellerie | Fiche de la déclaration : état de vie, degré, incardination, institut, justificatifs, décision (valider, complément, refuser) | Date d'ordination, historique des offices, coordonnées |
| « Ses conversations sont chiffrées : ni le diocèse ni Numerisen ne peuvent les lire » | Non repris (pas de bloc messagerie) | — |

Vérification visuelle : la base de démo n'a aucune déclaration en attente ; l'état vide est capturé, l'état rempli est couvert par les tests Vitest.

## PLA-Tableau-de-bord (`/plateforme`)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| « Page de statut publique » | Remplacé par « Journal d'audit » (lien existant) | Une page de statut |
| Santé : diocèses et paroisses paramétrés, disponibilité 30 j, temps de réponse p95, dernière sauvegarde, version déployée | Non affichés. Santé = comptes (dont staff), actifs 30 j, nouveaux 30 j, MFA du staff | Métriques d'infrastructure (supervision, sauvegardes, version) dans `GET /dashboards/platform/` |
| Services (API, Keycloak, messagerie, push, SMS, e-mail) | Non affichés | Sondes d'état par service |
| Incidents (en cours, historique) | Non affichés | Un registre d'incidents |
| Inscriptions par semaine (histogramme) | Non affiché | Série hebdomadaire des inscriptions |
| Files techniques (SMS, push, e-mails, imports, suppressions) | Reprend les files réelles : courriels en échec (7 j), actes en retard, tâches planifiées en retard | Compteurs des files SMS/push/imports/suppressions |

Fonction existante gardée hors maquette : tableau « Tâches planifiées » (Celery beat : dernière exécution, état).

## PLA-Referentiels (`/plateforme/referentiels`)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| Brouillon versionné (« Brouillon de la version 13 », « Voir les différences », « Publier la version 13 », « Abandonner le brouillon ») | Non affichés : le catalogue est fermé (RG-14), non éditable ; un encart « Catalogue fermé » l'explique | Versionnement et édition du référentiel |
| Matrice éditable (cases cochables, « Modifiée dans le brouillon », « Réservée aux ministres ordonnés ») | Matrice en lecture seule, colonnes regroupées comme la maquette (Vie paroissiale, Demandes d'actes, Pastorale, Gouvernance) ; plateforme.admin exclue (rôle realm) | Édition des capacités par office |
| « Modifications du brouillon », « Versions » | Non affichés | Historique des versions |

Fonctions existantes gardées hors maquette : onglet « Retraits par diocèse » (retirer / rétablir une capacité), colonnes du catalogue d'offices (condition d'ordre, nommé par, héritage).

## PLA-Comptes (`/plateforme/comptes`)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| « Inviter un membre du staff » | Non affiché (les droits viennent des nominations) ; place prise par « Console Keycloak » si configurée | Invitation staff |
| Compteurs par onglet (Tous 312, Staff 14, Fidèles 298) | Seul l'onglet actif porte le total (celui de la liste chargée) | Compteurs par rôle |
| Filtre « Rôle » | Remplacé par les onglets de rôle (Tous, Staff, Fidèles, Admin plateforme) | — |
| Fiche : origine du droit, codes de secours, « Réinitialiser la double authentification », sessions par appareil avec « Fermer » unitaire, « Suspendre le compte » | Fiche : rôle, rattachement, e-mail, connexion, identifiant, MFA (méthode, « Forcer la MFA »), nominations et capacités, sessions (« Fermer les sessions »), « Verrouiller / Déverrouiller » | Réinitialisation MFA, fermeture de session unitaire |
| Compte « Verrouillé — 5 échecs » | Statut « Verrouillé » sans le nombre d'échecs | Nombre d'échecs et date |

## PLA-Audit (`/plateforme/audit`, `/espace/[nodeId]/audit`)

| Bloc de la maquette | Décision | Ce qu'il faudrait côté backend |
|---|---|---|
| « Exporter en CSV », « Intégrité vérifiée à 11 h » | Non affichés | Export et contrôle d'intégrité (empreinte chaînée) |
| Recherche « Acteur, objet ou référence » | Le champ filtre l'acteur par identifiant (UUID) ; pas de recherche plein texte | Paramètre `q` sur `GET /audit/` |
| Pilule « Aujourd'hui » | Remplacée par les dates « Du / Au » en pilules | — |
| Fiche : « Changement » avant → après en badges, « Voir les 6 événements de cette demande » | Fiche : acteur, objet, nœud, adresse IP, événement brut (copiable) ; le changement figure dans l'événement brut (`metadata`) | Champs `avant` / `apres` structurés, filtre par objet |
| « Événements plus anciens » | Pagination numérotée (25 par page) | — |
