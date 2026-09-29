# Branchement des écrans web hérités côté fidèle (Phase 4, lot F-web-fidèle)

Cible : environnements local et recette. Backend de référence : `jangubi`, branche
`feat/v1-dons` (préfixe `/api/v1/`, `apps/api/urls.py → API_V1_ROUTES`). Les écrans V2
déjà branchés (Pour vous, signets, sonothèque, lecteur, paroisses multiples, analyse des
dons) ne sont pas repris ici.

Règles appliquées :

- chaque écran appelle une route réelle, et la réponse est validée par un schéma zod
  aligné sur le serializer du backend ;
- pagination V1 `{limit, offset, count, next, previous, results}` (`src/lib/pagination.ts`),
  plafonnée à 50 par page par défaut ;
- erreurs V1 `{"error": {"code", "message"}}` et anciennes `{"error": "texte"}` lues par
  `readApiError` (`src/lib/api-client.ts`) ;
- sans route backend : l'écran est masqué derrière un indicateur (`src/config/features.ts`,
  composant `FeatureGate`) ; en mode réel, jamais de données fictives ;
- les mocks MSW (`src/testing/mocks/handlers/`) renvoient le format exact du backend.

## Écran → appel précédent → route réelle

| Écran | Appel précédent | Route réelle (V1) |
| --- | --- | --- |
| Onboarding, choix de paroisse (`/onboarding`) | `POST /users/me/memberships/` (cascade diocèse → paroisse → église) | `GET /me/paroisses/`, `GET /public/nodes/?q=&type=paroisse`, `POST /me/paroisses/` `{paroisse_id, principale: true}` ; paroisse facultative (« Plus tard ») |
| Profil : mes paroisses | (déjà V2) | `GET|POST /me/paroisses/`, `DELETE /me/paroisses/<id>/`, `PUT /me/paroisses/<id>/principale/` |
| Profil : identité | `PATCH /me/` (champs hérités) | `PATCH /me/` (MeProfileSerializer : prénom, nom, titre, date de naissance, téléphone) |
| Profil : préférences de notification | aucune | `GET|PUT /me/notification-preferences/` (heures calmes) |
| Profil : export de mes données | aucune | `GET /me/export/` (fichier JSON) |
| Bible : testaments | `GET /bible/testaments/` (supposé paginé) | `GET /bible/testaments/` (liste nue `{slug, name, order, books}`) |
| Bible : livres | `GET /bible/books/?limit=100` (tronqué à 50) | `GET /bible/books/?testament=&search=&limit=50&offset=` — toutes les pages suivies (73 livres) |
| Bible : versets d'un chapitre | `…/verses/?limit=50` | `GET /bible/books/<id>/chapters/<n>/verses/?limit=200` (un chapitre entier par page) |
| Bible : recherche | `GET /bible/search/` | idem (liste nue de groupes par livre, `q` ≥ 3 caractères) |
| Aujourd'hui / Messe : liturgie du jour | `GET /liturgy/today/` (ancien format `season`, `readings[].raw_metadata`, `offices`) | `GET /liturgy/today/` (format `liturgy_day` : `calendar`, `source`, `notice`, `readings[{type, citation, text, verses}]`, `meditation`) |
| Liturgie d'un autre jour | `GET /liturgy/date/<AAAA-MM-JJ>/` (inexistante) | `GET /liturgy/<AAAA-MM-JJ>/` (date locale, sans décalage UTC) |
| Lectures en source `crampon_refs` | non gérée | versets de la Bible locale (`readings[].verses`) ; mention `notice` affichée |
| Liturgie des Heures (`/app/spirituel/heures`, onglet Heures) | `offices` du jour liturgique (absents du format V1) | `GET /liturgy/v1/<office>/?date=` (OfficeSerializer : `hymn`, `psalms`, `canticle`, `readings`, `intercessions`) — **gelée** (`liturgy.heures`), clergé seulement → indicateur `heures` |
| Lectio divina | `GET|POST /bible/lectio/` (`passage_id` obligatoire) | idem, `passage_id` nul accepté — **gelée** (`bible.avance`) → indicateur `lectio` |
| Parcours de lecture | `POST /bible/reading-plans/` avec `duration_days`, `is_published` | `{title, description}` (publication : `…/<id>/publish/`) — **gelée** → indicateur `parcours` |
| Notes d'homélie | `/bible/homily-notes/?passage_id=` | `GET|POST /bible/homilenotes/` (`passage_start_id`, filtre côté client) — **gelée** → indicateur `notes-homelie` |
| Chapelet du jour | `GET /rosary/today/` (types générés : `mysteries` en chaîne) | `GET /rosary/today/` (`day.group.mysteries[]` objets, `standalone_prayers[]`) |
| Chapelet : groupes | `GET /rosary/groups/` (supposé `{results}`) | `GET /rosary/groups/` (liste nue) |
| Chapelet communautaire | `GET|POST /rosary/community/` | idem (schéma aligné) — **gelé** (`rosary.communautaire`) → indicateur `chapelet-communautaire` |
| Agenda : liste | `GET /agenda/events/?…` | `GET /agenda/?limit=&offset=&type=` |
| Agenda : détail | `GET /agenda/events/<id>/` | `GET /agenda/<id>/` |
| Agenda : inscription | `POST|DELETE /agenda/events/<id>/register/` | `POST|DELETE /agenda/<id>/register/` (nombre de places ; refus V1 expliqués) |
| Confessions (nouvel écran `/app/confessions`) | aucun écran | `GET /confessions/slots/?node=&place=&date_from=`, `POST /confessions/bookings/`, `GET /me/confession-bookings/`, `POST /confessions/bookings/<id>/cancel/` |
| Demandes d'actes : liste, détail | `GET /documents/requests/` (ancien schéma) | `GET /documents/requests/`, `GET /documents/requests/<uuid>/` (RequesterOutput) |
| Demandes d'actes : création | `POST /documents/requests/` (paroisse en entier) | `GET /documents/requests/options/` puis `POST /documents/requests/` (`target_node_id` UUID) |
| Demandes d'actes : complément, pièce jointe | `POST …/supplement/` | `POST /files/upload/standard/` puis `POST /documents/requests/<uuid>/supplement/` |
| Demandes d'actes : annulation | aucune | `POST /documents/requests/<uuid>/cancel/` |
| Messagerie : prêtres joignables | `GET /messaging/priests/` (ancien schéma) | `GET /messaging/priests/` (ReachablePriestOutput : `user_id`, office, paroisses, disponibilité) |
| Messagerie : CGU | aucune | `GET|POST /messaging/cgu/` (avant d'écrire) |
| Messagerie : envoi | `…/messages/send/` sans identifiant client | `POST /messaging/conversations/<uuid>/messages/send/` avec `client_message_id` |
| Notifications | `GET /messaging/notifications/`, `…/<id>/read/` | `GET /notifications/`, `POST /notifications/<id>/read/`, `POST /notifications/read-all/` |
| Dons : page de don | `GET /donations/campaigns/` (inexistante) | `GET /public/dons/paroisses/<node_id>/` (activation, mention d'autorisation, montants suggérés, bornes, frais, fonds ouverts) pour chacune de mes paroisses |
| Dons : donner | `POST /donations/donate/` (inexistante ; espèces, église, moyen de paiement) | `POST /dons/checkout/` `{fund_id, amount, fees_covered, anonymous, source: "web"}` + en-tête `Idempotency-Key`, puis redirection vers `checkout_url` (le moyen de paiement se choisit chez l'agrégateur) |
| Dons : retour de paiement (`/dons/retour?don=`) | aucun écran | `GET /dons/checkout/<uuid>/` (relu tant que le don est `initie`/`en_attente`) |
| Dons : mes dons | aucun écran | `GET /me/dons/?limit=10&offset=`, `GET /me/dons/resume/?year=`, `GET /me/dons/<uuid>/recu/` (PDF, don confirmé) |

Réglage backend pour le retour de paiement : `DONATIONS_RETURN_URL=<origine du web>/dons/retour`
(défaut `http://localhost:3000/dons/retour`, adapté au développement local).

## Indicateurs de fonctionnalité

> Fusion V1 (29/09/2026) : ce mécanisme n'a pas été porté dans l'architecture V1 ; `NEXT_PUBLIC_FEATURES`
> n'est plus lu par le code ni passé au build (workflow de livraison, Dockerfile). Le tableau reste comme
> inventaire des routes manquantes.

`NEXT_PUBLIC_FEATURES=<liste séparée par des virgules>` (ou `*` pour tout activer sur les
mocks). Sans indicateur, l'entrée est masquée (navigation, raccourcis, onglets) et l'URL
directe affiche « Bientôt disponible ».

| Indicateur | Écrans | Motif |
| --- | --- | --- |
| `heures` | onglet Heures (Bible), `/app/spirituel/heures`, entrée Spiritualité | route gelée (`liturgy.heures`, pas d'accord AELF), clergé seulement |
| `lectio` | onglet Lectio (Bible) | route gelée (`bible.avance`) |
| `parcours` | onglet Parcours (Bible) | route gelée (`bible.avance`) |
| `notes-homelie` | notes d'homélie sous une lecture | route gelée (`bible.avance`) |
| `chapelet-communautaire` | `/app/chapelet/communautaire` | route gelée (`rosary.communautaire`) |
| `tv` | `/app/tv`, entrée Spiritualité | route manquante |
| `transfert` | `/app/transfert`, navigation | remplacé par les paroisses multiples |
| `assistant` | `/app/assistant`, carte de l'accueil | route manquante |
| `pj-messagerie` | réservé : aucun bouton d’envoi de pièce jointe n’est affiché | route manquante (les pièces jointes reçues sont affichées) |
| `resume-fidele` | résumé chiffré de l'accueil fidèle | route manquante |
| `reflexion-pastorale` | réflexion pastorale du jour (accueil fidèle) | route manquante |

## Compléments V1 (lot V1C, backend `docs/API-V1-COMPLEMENTS.md`)

Branchés et actifs par défaut (plus d'indicateur) :

| Écran | Route web | Routes |
| --- | --- | --- |
| Intentions de messe (demande et suivi) | `/app/intentions`, section et raccourci de l'accueil, navigation | `POST /mass-intentions/`, `GET /mass-intentions/mine/`, `POST /mass-intentions/{id}/cancel/` (`GET …/notice/` disponible) |
| Recherche transverse | `/app/recherche?q=`, navigation | `GET /search/?q=&types=&limit=` (Bible, paroisses, lieux, annonces, prêtres, écoute) |
| Annonces épinglées | fil des actualités (mention « Épinglée ») | champs `is_pinned`, `pinned_until` de `news/`, `me/feed/` |

Règles tenues : aucun montant ni paiement pour les intentions ; la phrase des maquettes sur
l'offrande (« Il est d'usage d'accompagner une intention d'une offrande… elle ne passe pas par
l'application ») est affichée près du formulaire. Choix retenus : la date souhaitée est
obligatoire (le contrat n'a pas de « pas de date précise ») ; la messe se saisit en texte libre
(pas de route des messes d'un jour avec leur remplissage) ; « Choisir une autre messe » reprend
l'intention refusée dans le formulaire. Recherche : les versets ne sont pas cliquables (la
sortie donne `book_slug`, pas l'identifiant de livre attendu par l'onglet Bible) ; un prêtre
renvoie à la messagerie.

## Routes manquantes (pour le lot backend)

- route manquante : `GET /v1/tv/…` (vidéos, catégories, direct) — module supprimé (ADR-016).
- route manquante : questions à l'assistant (`/v1/rag/query/`) — module supprimé.
- route manquante : résumé du fidèle pour l'accueil (`/v1/dashboards/me/`) — seuls
  `dashboards/nodes/<id>/` et `dashboards/platform/` existent.
- route manquante : réflexion pastorale du jour (`/v1/spiritual/reflections/…`).
- route manquante : envoi d'une pièce jointe dans une conversation (messagerie).
- routes existantes mais gelées en V1 (à rouvrir par `JANGUBI_MODULES`) : `liturgy.heures`,
  `bible.avance` (lectio, parcours, notes d'homélie), `rosary.communautaire`.
- transfert paroissial (`/v1/transfers/…`) : pas de route, remplacé par `/me/paroisses/` ;
  l'écran reste masqué.

## Hors périmètre de ce lot (constats)

- consentement explicite (`GET|POST /v1/me/consent/`) : route présente, aucun écran web.
- écrans du clergé et du staff encore sur des routes absentes : envoi clérical
  (`/v1/messaging/clerical/…`), création et suppression d'événements
  (`/v1/agenda/events/…` → `staff/agenda/`), traitement des demandes
  (`/v1/documents/admin/…` → `staff/documents/`), réflexion pastorale du prêtre.
