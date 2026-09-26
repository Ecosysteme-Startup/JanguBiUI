# Écarts maquette ↔ produit — lot C (Ma paroisse, annonces, événements, notifications, demandes d'actes)

Blocs de la maquette sans donnée réelle (non affichés), fonctions existantes conservées hors maquette, textes corrigés.

## FID-Ma-Paroisse (`/app/paroisse`)
- **Onglets** Aperçu / Horaires / Annonces / Agenda : pilotés par l'ancre (`#horaires`…, `paths.app.paroisse.root`). Les onglets Horaires, Annonces (filtres « Annonces du dimanche / Vie paroissiale ») et Agenda reprennent les listes complètes existantes, dans le style Ciel ; la colonne de droite reste visible sur tous les onglets.
- **« Épinglée »** (annonce épinglée) : pas de champ côté API → remplacé par « Nouveau » (publiée depuis moins de 7 jours). Backend : `is_pinned` sur l'article.
- **« Lues à la fin des messes du 26 et 27 septembre »** : affiché seulement quand une annonce du dimanche existe (« Lues à la fin des messes du dimanche {date} »).
- **Titres des cartes de messe** (« Messe du soir », « Messe des étudiants ») : la note de l'horaire si elle existe, sinon « Messe ».
- **Lieux de culte** : distance « à 350 m » absente (pas de géolocalisation ni de coordonnées des lieux). Le plan est un dessin décoratif ; « Itinéraire » ouvre un service de cartes sur l'adresse. Backend : `lat`/`lng` des lieux.
- **Photos** : emplacements dessinés (`data-photo-slot`), le second seulement si la paroisse a un lieu secondaire.
- **Confessions** : texte dérivé de la prochaine permanence publiée ; le bloc vert n'apparaît qu'avec un rendez-vous réservé (`/me/confession-bookings/`) ; sinon le bouton devient « Réserver un créneau ».
- **Clergé et secrétariat** : offices titrés de la fiche publique (`/public/nodes/by-code/`), « Écrire » seulement pour les prêtres joignables par message. La secrétaire (« Mme Germaine Faye ») n'est pas une donnée exposée. Texte corrigé : « Messages chiffrés, aucun administrateur n'y a accès » (pas « de bout en bout »).
- **Contact** : n'affiche téléphone, e-mail et horaires que si la paroisse a publié son secrétariat ; sinon l'adresse seule.
- **« Paroisse suivie »** : menu (changer de paroisse suivie → profil ; voir la fiche publique).

## FID-Annonce
- **Épinglée, nombre de lectures** : pas de champ (le compteur de lectures est réservé au staff, EF-PAROI-05). Remplacé par la paroisse et la durée de lecture.
- **Bouton « Enregistrer » (signet)** : aucune fonction de favoris → absent. Backend : signets d'articles.
- **Bloc « En pratique »** (dates, lieu, encadré) : pas de données structurées sur l'annonce → absent. Backend : champs « quand / où / note » d'un article.
- **Chapô (extrait)** : n'est plus répété au-dessus du corps (déjà la première phrase du texte).
- **Conservé hors maquette** : partage WhatsApp (bouton contour à côté de « Partager l'annonce »).
- « Une question sur cette annonce ? » : affiché seulement si le secrétariat est publié.

## FID-Evenement
- **Ligne liturgique** (« 27ᵉ dimanche du temps ordinaire ») et **description du lieu** (adresse, stationnement) : pas de données → absentes. Backend : lieu d'événement structuré (lien vers un lieu de culte).
- **Carte « Plan d'accès »** et distance : absentes (pas de coordonnées) ; « Itinéraire » ouvre un service de cartes sur le lieu.
- **Carte organisateur** (« Accueil des nouveaux étudiants », « Écrire ») : pas de responsable sur l'événement → absente. Backend : `contact_user` sur l'événement.
- **Conservé hors maquette** : inscription (places, remarque, désinscription) dans la colonne de droite. « Ajouter au calendrier » génère un fichier .ics local ; il passe en contour quand l'inscription est l'action principale (un seul primaire).

## FID-Notifications
- **« sur les 30 derniers jours » / « Les notifications de plus de 30 jours sont effacées »** : aucune purge côté backend → textes retirés. Sous-titre : « N non lues. » / « Tout est lu. ».
- **Filtres** : Toutes, Non lues, Demandes, Messages, Paroisse, Confession (filtres vides masqués). « Non lues » et « Confession » sont conservés hors maquette.
- **Réglages « Me prévenir pour »** : ceux que l'API connaît (annonces, agenda, silence la nuit, dans l'application, par e-mail). « Réponses des prêtres », « Suivi de mes demandes », « Rappels de rendez-vous », « La Parole du jour » ne sont pas des préférences côté API (toujours signalés ou inexistants).
- **« Vous avez répondu ce matin à 8 h 52 »** (sous-ligne d'état) : pas dans la charge utile des notifications.
- « Marquer comme lu » s'affiche au survol et au focus de la rangée non lue.

## FID-Demandes
- **Brouillon, « Terminées »** : onglets En cours / Terminées (le filtre « Toutes » disparaît ; sans demande en cours, « Terminées » est ouvert par défaut). Filtre par type d'acte conservé quand plusieurs types.
- **Bandeau de carte** : dernier message du secrétariat, complément attendu (« Répondre ») ou original prêt.
- **« pour le baptême du 11 octobre »** : le motif seulement (pas de date de célébration côté API).
- Ancien encart « Repères » (3 à 7 jours, validité 6 mois) retiré : texte générique non fondé sur des données.

## FID-Demande-Nouvelle
- **« Brouillon enregistré à 9:41 » / « Enregistrer et quitter »** : pas de brouillon côté API → absents. Backend : brouillons de demande.
- **Mode de retrait « Par un tiers mandaté »** : pas une option de l'API ; les options réelles sont « Au secrétariat de la paroisse du sacrement » et « Transmission à ma paroisse » (si différente).
- Libellés des champs : ceux du formulaire existant (lieu de naissance, téléphone, e-mail, pièce justificative, consentement conservés). Dates : saisie texte JJ/MM/AAAA et mois/année du sacrement (pas de sélecteur de date).
- Titre du formulaire à l'étape 3 : « Comme au registre » ; les étapes 1, 2 et 4 gardent leur titre.

## FID-Demande-Suivi
- **« Acte retrouvé au registre »**, **registre de 1992** : pas d'étape intermédiaire ni de référence de registre exposée au fidèle (volontairement : liste blanche du sérialiseur). L'historique suit le journal réel.
- **Téléphone du secrétariat** dans « Où retirer l'original » : absent de `pickup`. Backend : `pickup.phone`.
- **« Répondre » au message** : seulement quand un complément est demandé (renvoie au formulaire de complément) ; pas de fil de discussion libre sur une demande.
- **« Pour un tiers : procuration »** : retiré de « À présenter » (le retrait par un tiers n'existe pas côté API) ; remplacé par la référence de la demande.
- « Annuler la demande » : bouton destructif + dialogue de confirmation (existant), au lieu d'un simple lien rouge.
