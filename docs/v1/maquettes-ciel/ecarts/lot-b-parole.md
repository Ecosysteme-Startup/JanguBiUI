# Écarts — lot B (espace fidèle, Parole)

Écrans : FID-Accueil (`/app`), FID-Parole (`/app/parole`), FID-Bible (`/app/bible`, `/app/bible/[livre]/[chapitre]`), FID-Chapelet (`/app/chapelet`).
Vérifié dans le code (`src/types/api.ts`, `../JanguBi/apps`) : aucun endpoint de signets, de surlignage ni de lecteur audio par lecture.

## Blocs de maquette sans donnée (non affichés)

| Écran | Bloc | Ce qu'il faudrait côté backend |
|---|---|---|
| FID-Accueil | Citation en exergue (« Une génération s'en va… », Ecclésiaste 1, 4) | Un verset mis en avant par jour liturgique (`key_verse` : texte + référence) dans `/liturgy/today/`. En attendant, rien n'est affiché (le schéma partagé `use-liturgy-today` ne garde pas les versets, voir demandes-fondations). |
| FID-Accueil | Bouton « Écouter · 7 min » | `audio_url` existe dans `/liturgy/{jour}/` mais pas dans le schéma partagé du bandeau ; durée absente. Demande fondations ouverte. |
| FID-Accueil | Dates des étapes de la demande (« Vérification 19 sept. ») | Historique daté des statuts dans `/documents/requests/` (seule la date de dépôt est affichée). |
| FID-Accueil | Annonce « Épinglée » | Pas de champ « épinglée » : on signale l'« Annonce du dimanche » (`is_sunday_notice`). |
| FID-Accueil | Office et objet de la conversation (« Vicaire · Préparation au mariage ») | Office du prêtre dans `/messaging/conversations/` (participant). |
| FID-Accueil | Titre de messe (« Messe du soir ») | Titre de célébration dans la semaine des horaires ; on affiche la note de l'horaire, sinon « Messe ». |
| FID-Parole | « Mes signets », « Surligné par vous » | Modèle signets/surlignages par fidèle + API. |
| FID-Parole | Lecteur « Écouter » par lecture (chapitres 0:00 / 2:48 / 4:31, lecteur nommé) | Découpage de l'audio par lecture et nom du lecteur. On affiche un lecteur audio natif quand `audio_url` existe. |
| FID-Parole | Bande de dates : libellé des fêtes | Pas de libellé court : dérivé de la célébration (« Saint Matthieu, apôtre » → « S. Matthieu »). La bande charge un jour liturgique par jour de la semaine (7 appels mis en cache) : un endpoint « semaine liturgique » allégerait. |
| FID-Bible | « Écouter le chapitre », « Surligner », « Signet » (menu du verset) | Audio de la Bible, signets/surlignages. Le menu garde Copier et Partager. |
| FID-Bible | Intertitres de péricope (« Hérode s'interroge sur Jésus ») | Titres de section dans les versets. |
| FID-Bible | « Traduction Louis Segond (1910) … Disponible hors connexion » | L'édition servie est la Crampon 1923 (ADR-008) ; l'API Bible n'expose pas l'édition (libellé en constante) ; pas de mode hors connexion. |
| FID-Chapelet | Lien « Marc 1, 14-15 » (source biblique cliquable) | `meditation_source` est un texte libre (souvent vide) : affiché sans lien. |

## Fonctions existantes absentes de la maquette (conservées)

| Écran | Fonction | Où |
|---|---|---|
| FID-Accueil | Chapelet du jour | Carte-lien sous « Parler à un prêtre ». |
| FID-Accueil | Prochain événement de la paroisse | Carte-lien sous « Dernières annonces ». |
| FID-Accueil | Sans conversation : un prêtre joignable de la paroisse + « Écrire » | Même bloc « Parler à un prêtre ». |
| FID-Accueil | Sans rendez-vous : « Prendre rendez-vous » | Bloc « Rendez-vous de confession ». |
| FID-Parole | Méditation : titre de la méditation | Dans « Pour méditer », au-dessus de l'extrait. |
| FID-Parole | Envoyer sur WhatsApp, copier le lien public, revenir aux lectures du jour | Pied de la lecture ; lien sous la date. |
| FID-Bible | Recherche plein texte (`/bible/search/`) | Le champ « Livre ou passage » filtre les livres et cherche le mot dans le texte (résultats sous la liste). |
| FID-Bible | Onglet « Psaumes » | L'API a trois testaments (Ancien, Nouveau, Psaumes) : trois segments au lieu de deux. |
| FID-Chapelet | « Mon intention », prières d'ouverture, prière de clôture (Salve Regina), méditation du mystère | Colonne de droite ; méditation repliée « Méditer ce mystère ». |
| FID-Chapelet | Prier d'autres mystères | Les groupes du tableau « Les mystères selon les jours » sont des liens (`?jour=0…6`, `/rosary/day/{n}/`) au lieu du lien unique « Prier d'autres mystères ». |

## Autres différences

- `/app/bible` s'ouvre sur l'Évangile du jour (passage, puis « Lire depuis le verset 1 » / « Afficher la suite ») comme la maquette ; sans Évangile, choix du livre.
- Menu du verset (Bible) placé dans le flux sous le verset (pas en surimpression).
- Onglets de lecture : un onglet par lecture (« Lecture » / « 1re lecture », « Psaume », « 2e lecture », « Évangile ») au lieu de « Lectures ».
- Accueil : deux colonnes à partir de 1280 px (une colonne entre 1024 et 1279, la colonne de 336 px serait trop étroite).
- Chapelet : avancée gardée dans le navigateur (localStorage, clé du jour + mystères), rien côté serveur.
- Dates relatives du jour : le 26/09/2026 (samedi) les données de démo diffèrent des textes de maquette.
