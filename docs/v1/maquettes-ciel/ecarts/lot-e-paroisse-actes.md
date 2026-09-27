# Écarts — lot E (espace paroisse : tableau de bord, demandes d'actes, confessions)

Blocs de la maquette sans source de données (rien n'est inventé ; ce qu'il faudrait côté backend) et
fonctions existantes gardées hors maquette.

## PAR-Tableau-de-bord (`/espace/[nodeId]`)

| Bloc | Décision | Ce qu'il faudrait |
|---|---|---|
| Cases à cocher « Marquer comme fait » et progression « 1 sur 5 fait » | Non affichées : aucun état « fait » n'existe. Chaque point porte une pastille d'icône (ambre si retard) et un bouton d'action. | Un état de tâche du jour par nœud et par personne (ou dériver « fait » d'événements du journal). |
| Points « Confirmer les confesseurs », « Relire les annonces… validées par… 8:12 » | Remplacés par des points calculés : actes à traiter (soumises + en vérification), en retard, conversations sans réponse 48 h, rendez-vous de confession à venir, compléments attendus, actes prêts à retirer, annonce du dimanche. | Workflow de relecture des annonces et de confirmation des confesseurs. |
| « Répondre à 3 messages · La plus ancienne : Anna Sarr, hier à 17 h 40 » | Nombre seul (« 1 conversation sans réponse depuis 48 h »), sans nom : le tableau de bord ne reçoit que des agrégats. | Rien (choix de confidentialité). |
| Encart « Pièce reçue à 8:52 · Complément reçu » | Absent. | Un endpoint « dernières pièces / compléments reçus » (ou `last_event` sur l'élément de file). Le badge « Complément reçu » est en revanche affiché sur la fiche d'une demande (déduit de son historique). |
| Graphique « Fidèles actifs par jour » (7 barres) | Absent : pas de série par jour. Les chiffres de la semaine sont gardés en liste (période 7 jours). | `GET /dashboards/nodes/{id}/` avec une série `fideles.active_by_day`. |
| Statut de l'annonce « Relue, à publier » et bouton « Programmer samedi 18 h » | Remplacés par le nombre d'annonces programmées de la feuille du dimanche, « Nouvelle annonce » et « Aperçu » (feuille). | Un statut de relecture sur la feuille du dimanche. |
| Salutation « Vous êtes de permanence jusqu'à 18 h » | Remplacée par « Vous agissez comme {qualité réelle} ». | Des horaires de permanence par personne. |
| Fonctions gardées hors maquette | Indicateurs ajoutés à « Activité de la semaine » : nouveaux rattachements, demandes reçues, conversations ouvertes, événements et inscriptions, confessions honorées. | — |

## PAR-Demandes (`/espace/[nodeId]/demandes`)

| Bloc | Décision | Ce qu'il faudrait |
|---|---|---|
| Onglets groupés « À traiter », « Terminées » | Onglets par statut (Toutes, Soumises, En vérification, Complément demandé, Prêtes à retirer, Retirées, Rejetées) au style de la maquette : le serveur ne filtre qu'un statut à la fois. | `status` multiple (`status=submitted,under_verification`). |
| « Exporter », « Saisir une demande au guichet » | Absents. | Endpoint d'export (CSV) et création d'une demande par le secrétariat. |
| « Affichage » (colonnes) | Absent. | — (préférence d'interface, pas prévue). |
| Barre de sélection : « Relancer les demandeurs », « Attribuer » | Seule l'action existante « Passer en vérification » est proposée. | Relance groupée ; attribution groupée (l'attribution existe demande par demande). |
| Compteur « En retard 2 » dans la pilule | Pilule sans compteur. | `overdue` dans `/staff/documents/counts/`. |
| Pilule « Reçues en septembre » | Filtre période existant (7 derniers jours, 30 derniers jours, ce mois-ci) en pilule. | — |
| Cadenas « 1 note interne » sur une ligne | Absent. | `notes_count` dans l'élément de file. |
| Sous-ligne de statut (« Baptême à Saint-Joseph », « Complément reçu à 8:52 ») | Absente de la file (présente sur la fiche). | Motif de rejet et dernier évènement dans l'élément de file. |
| Fonctions gardées hors maquette | Filtres « Motif » et « Période » en pilules ; tri descendant par date de réception (affiché sur « Reçue le »). | — |

## PAR-Demande-Detail (`/espace/[nodeId]/demandes/[id]`)

| Bloc | Décision | Ce qu'il faudrait |
|---|---|---|
| « Fidèle · compte vérifié » | « Fidèle · adresse » : pas d'information de vérification. | Indicateur de compte vérifié. |
| Bouton « Écrire » | Absent. | Ouverture d'une conversation par le secrétariat vers le demandeur. |
| Menu « … » (autres actions) | Absent (aucune action supplémentaire définie). | — |
| Table « Déclaré dans la demande / Inscrit au registre » et badge « 4 sur 4 concordent » | Carte « Données du registre » avec les champs existants (volume, page, n° d'acte, mentions marginales) ; badge « Acte retrouvé » quand volume et n° sont saisis. | Transcription structurée de l'acte du registre pour une comparaison champ à champ. |
| « Message à Marie-Thérèse Diouf » dans « Notes et message » | Le message au demandeur reste dans la fenêtre de confirmation du changement de statut (il part avec la transition, avec le lieu et les horaires de retrait) ; une note l'explique sous les notes internes. La carte s'appelle « Notes internes ». | — |
| « Signataire : Abbé A. Ndiaye » | Absent. | Signataire désigné par demande ou par paroisse. |
| « Délai : 4 j sur 5 ouvrés » | « Reçue il y a N j » et « Délai indicatif N j » (délais par type d'acte, lisibles avec `horaires.gerer` ou `structure.gerer`). | Âge en jours ouvrés dans la fiche. |
| Case « L'original papier est signé par le curé et scellé » | Reprise : elle conditionne le bouton « Marquer prête à retirer » (garde côté interface uniquement). | — |
| Fonctions gardées hors maquette | Flèches « demande précédente / suivante » de la file (à côté d'« Imprimer la fiche ») ; « Me l'attribuer » ; « Enregistrer l'attribution » ; formulaire de référence du registre ; horodatage serveur de l'historique. | — |

## PAR-Confessions (`/espace/[nodeId]/confessions`)

| Bloc | Décision | Ce qu'il faudrait |
|---|---|---|
| « Samedis suivants » avec « Non ouverts » et « Ouvrir » | « Jours suivants » : jours déjà ouverts des quatre semaines chargées, avec « Voir » (va au jour). Les jours non ouverts ne sont pas connus. | Jours habituels attendus (règles de la paroisse, pas seulement celles du prêtre connecté). |
| Paramètres « Réservation possible », « Rappel au fidèle », « Annulation par le fidèle » | Absents. Restent « Durée d'un créneau », « Plage habituelle » (déduites du planning) et « Lieu ». | Réglages de réservation exposés par l'API. |
| Texte « Seuls le prénom et l'heure sont visibles, par le secrétariat comme par les prêtres » | Corrigé selon le produit : le secrétariat voit des initiales, le prêtre le nom de la personne qu'il reçoit. | — |
| « Ouvrir des créneaux » | Ouvre le panneau existant des créneaux récurrents du prêtre (`confessions.gerer`). | — |
| Fonctions gardées hors maquette | Annulation d'un rendez-vous (avec message au fidèle) et retrait d'un créneau libre : on choisit la case dans la grille, puis « Annuler le rendez-vous » / « Retirer le créneau ». La liste séparée des rendez-vous du jour est remplacée par la grille (mêmes informations, noms accessibles par case). | — |

## Données de démo

La base de dev n'a aucun créneau de confession : les captures `*-fixtures.png` servent un planning de
démonstration par interception réseau (`capture.ts --fixtures`), sans écriture en base.
