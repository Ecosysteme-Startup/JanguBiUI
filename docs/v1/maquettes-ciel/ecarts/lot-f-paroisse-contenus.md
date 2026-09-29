# Écarts — lot F (espace paroisse : annonces, horaires, agenda, équipe, paramètres)

Blocs de la maquette sans donnée réelle (non affichés) et fonctions existantes gardées hors maquette.

## PAR-Annonces
| Bloc | Décision | Côté backend |
|---|---|---|
| Filtres « Catégorie » et « Auteur » | Non affichés (pas de filtre serveur). Filtres gardés : « Type » (annonce/article) et « Lieu ». | `category` et `author` dans `StaffArticleFilterSerializer` |
| « Cette semaine : 3 publiées, 1 480 lectures » | Non affiché. | agrégat hebdomadaire (publiées, lectures) sur `/staff/news/` |
| Icône « Épinglée » | Non affichée. | champ `is_pinned` |
| Onglet « Archivées » | Remplacé par « Retirées » (statut `unpublished`) ; l'archivage automatique à 30 jours n'existe pas, la phrase de pied de tableau est retirée. | archivage automatique si voulu |
| Carte « Annonces du 26e dimanche · Relue · Programmer » | Remplacée par la feuille d'annonces du dimanche à venir (« Ouvrir la feuille ») : pas d'état « relue ». | état de relecture |
| Onglet « Toutes » | Gardé en dernier (fonction existante), avec l'état en badge. | — |
| Actions de rangée | Menu « … » : Modifier, Voir côté fidèle. | — |

## PAR-Annonce-Editeur
| Bloc | Décision | Côté backend |
|---|---|---|
| « Contact pour les inscriptions », « Lien vers l'événement » | Non affichés. | champs `contact_phone`, `event_id` sur l'article |
| « Épingler en tête », « Afficher sur la fiche publique » | Non affichés. | `is_pinned`, `is_public` |
| « Lieux concernés » (cases multiples) | Choix unique « Lieu concerné » (toute la paroisse ou un lieu) : le modèle n'a qu'un `place_id`. | plusieurs lieux |
| Compteur « 412 / 1 500 » du texte | Remplacé par « n mots · n min de lecture » (pas de limite serveur). | — |
| « Enregistré automatiquement » | Pas d'enregistrement automatique : « Enregistré à … » après enregistrement. | — |
| « Aux 214 fidèles rattachés » | Nombre inconnu : « Aux fidèles rattachés, à l'heure de publication ». | compte des abonnés du nœud |
| Fonctions gardées | Chapô, bannière (+ texte alternatif), type Annonce/Article, annonce du dimanche, « Aperçu complet », Retirer (publiée). | — |
| Titre de la carte d'aperçu | En Libre Franklin (Source Serif réservé à la Parole, CLAUDE.md §3), la maquette le met en serif. | — |
| Fil d'Ariane | « Annonces / Nouvelle annonce » dans la barre supérieure (`TopbarContent`) ; plus de lien « Retour ». | — |

## PAR-Horaires
| Bloc | Décision | Côté backend |
|---|---|---|
| « Exporter en PDF » | Non affiché. | export |
| « En vigueur depuis le … » | Remplacé par « n lieux de culte · n messes par semaine, hors exceptions ». | date de validité de la semaine type |
| Type « Autre » | Absent (types : messe, confessions, adoration). | — |
| « Durée » | Remplacée par « Fin » (heure), le modèle stocke `end_time`. | — |
| Statuts « Annoncée aux fidèles » / « À annoncer » | Toujours « Annoncée aux fidèles » (toute exception est publiée). | — |
| Suppression d'un horaire | Bouton « × » sur chaque carte de la semaine type (fonction existante). | — |
| Dialogue | `Modal lg` (720) au lieu de 600, pied sans bande surface (voir demandes). | — |

## PAR-Agenda
| Bloc | Décision | Côté backend |
|---|---|---|
| Légende « Événement public / Interne / Fête liturgique » et fêtes du calendrier | Non affichées : pas de visibilité ni de fêtes dans `/staff/agenda/`. Tous les événements en b50. | `visibility`, calendrier liturgique par date |
| Messes régulières dans le panneau du jour | Non affichées (horaires dans une autre feature) : note vers « Horaires et lieux ». | endpoint agenda + horaires |
| Ligne liturgique du jour (« 27e dimanche… ») | Non affichée. | liturgie par date |
| « Public · annonce publiée, 571 lectures » | Non affiché. | lien événement ↔ annonce |
| Fonctions gardées | Vues Semaine et Liste, inscrits et export CSV, annulation, « Voir côté fidèle » ; « Dupliquer » ajouté (création préremplie). | — |
| Petite largeur | Grille en points, le panneau du jour détaille les événements. | — |

## PAR-Equipe
| Bloc | Décision | Côté backend |
|---|---|---|
| « Inviter un membre » (invitation par e-mail) | Remplacé par « Nommer une personne » (recherche d'une personne existante, panneau latéral non modal A11Y-16 conservé). | flux d'invitation |
| Onglet « Invitations », « Invitation acceptée », colonne « MFA » | Non affichés. | état d'invitation, état MFA par personne |
| « Catalogue des offices » | Non affiché (le catalogue apparaît dans le formulaire). | — |
| Nomination en attente | Carte en tête pour les nominations `proposee`. | — |
| Actions | Menu « … » : Modifier la qualité (Curé / Administrateur paroissial), Terminer la nomination. | — |

## PAR-Parametres
| Bloc | Décision | Côté backend |
|---|---|---|
| Identité éditable (nom, nom court, photo) | Lecture seule (gérée par la chancellerie). | édition par la paroisse, photo |
| « Registres et actes délivrés » (cases, depuis) | Non affiché. | actes délivrés par paroisse, années de registres |
| « Modèles de messages » | Non affiché. | modèles par statut |
| « Visibilité publique » (5 interrupteurs) | Un seul : « Publier sur la fiche publique » (secrétariat). | réglages de visibilité |
| « Moyenne constatée », « Registres aux archives », « Signalé en retard après » | Non affichés ; délais par type d'acte gardés. | statistiques, seuils |
| Enregistrement | Un seul formulaire : barre « n modifications · Annuler · Enregistrer » en bas des deux colonnes (au lieu d'un pied par carte). | — |
| Fonctions gardées | Horaires d'accueil, message d'accueil des demandes, lieux de culte, CEB rattachées. | — |
