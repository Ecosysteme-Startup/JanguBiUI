# Branchement des écrans staff hérités sur le backend V1

Lot F-web-staff (phase 4). Cibles : environnement local et recette. Backend de
référence : `jangubi`, branche `feat/v1-dons`, préfixe `/api/v1/` (le client web
ajoute `/v1/…` à `NEXT_PUBLIC_API_URL`).

## Principes

- **Droits = capacités sur des nœuds.** `useUser()` expose `capabilities` et
  `capability_nodes` (`GET /v1/me/capacites/`). Les gardes passent par
  `src/lib/staff/capacites.ts` (`peut(...)`, `aCapacite`, `noeudsPour`) ; les
  anciens rôles (`parish_admin`, `diocese_admin`…) ne servent plus à ouvrir un
  écran staff. Le back reste seul juge (403 `dons_forbidden`, `permission_denied`…).
- **Nœud actif.** Chaque écran travaille sur un nœud de la hiérarchie
  (`useNoeudActif(...capacités)` dans `src/components/staff/noeud-actif.tsx`) :
  le premier nœud où s'exerce la capacité, avec un sélecteur si la personne en a
  plusieurs, et l'état « Vue non ouverte » sinon.
- **`org` → `hierarchy`.** L'ancien module `org` (provinces, diocèses, paroisses,
  églises) est remplacé par `/v1/hierarchy/` : nœuds typés, lieux de culte,
  semaine type, exceptions, offices et nominations.
- **Contrats.** Chaque réponse est validée par un schéma zod calqué sur le
  sérialiseur du backend. Pagination `LimitOffset` (`count`, `next`,
  `previous`, `results`) branchée sur `DataTable` (`pagination`). Erreurs au
  format V1 `{ "error": { "code", "message", "details" } }` → `ApiError`
  (`message` affiché tel quel, sobre).
- **Mocks** (`NEXT_PUBLIC_API_MOCKING=true` et tests) : `src/testing/mocks/handlers/`
  `staff.ts` (actes, annonces, agenda, tableaux de bord), `staff-dons.ts`,
  `staff-structure.ts` ; comptes de démonstration dans `auth.ts`
  (Père Emmanuel Tine, curé ; Mme Cécile Coly, économe…).

## Écrans et routes

### Paroisse

| Écran | Route web | Routes V1 | Capacités |
| --- | --- | --- | --- |
| Accueil staff (espaces + indicateurs) | `/app/admin` | `GET /dashboards/nodes/{id}/`, `GET /dashboards/platform/` | au moins une capacité ; `tableau_bord.voir` ; `plateforme.admin` |
| Tableau de bord du nœud | `/app/clerge/analytique` | `GET /dashboards/nodes/{id}/?period=` | `tableau_bord.voir` |
| Demandes d'actes (file + compteurs) | `/app/admin/documents` | `GET /staff/documents/?node=&status=&limit=&offset=`, `GET /staff/documents/counts/` | `actes.traiter` |
| Détail d'une demande | `/app/admin/documents/{id}` | `GET /staff/documents/{id}/`, `POST …/{transition}/`, `GET/POST …/notes/`, `GET …/assignees/`, `POST …/assign/` | `actes.traiter` |
| Annonces + éditeur | `/app/admin/articles`, `…/new`, `…/{id}/edit` | `GET/POST /staff/news/`, `GET/PATCH/DELETE /staff/news/{id}/`, `POST …/publish/`, `POST …/unpublish/`, `GET /news/categories/` | `annonces.publier` |
| Agenda staff | `/app/admin/agenda` | `GET/POST /staff/agenda/`, `PATCH/DELETE /staff/agenda/{id}/`, `GET …/registrations/` (CSV) | `evenements.gerer` |
| Horaires et lieux de culte | `/app/paroisse/horaires` | `GET/POST /hierarchy/nodes/{id}/places/`, `GET/PUT /hierarchy/places/{id}/schedule/`, `GET/POST/DELETE …/exceptions/` | `horaires.gerer`, `structure.gerer` (lieux) |
| Confessions staff | `/app/paroisse/confessions` | `GET/POST/DELETE /staff/confessions/rules/`, `GET /staff/confessions/planning/`, `POST …/slots/{id}/cancel/`, `POST …/bookings/{id}/attendance/` | `confessions.gerer`, `confessions.voir_planning` |
| Équipe et offices | `/app/admin/nominations` | `GET/POST /hierarchy/assignments/`, `PATCH /hierarchy/assignments/{id}/` (`terminer` / `annuler`), `GET /hierarchy/office-types/`, `GET /hierarchy/persons/?q=` | `offices.nommer` |
| Paramètres | `/app/paroisse/parametres` | `GET/PATCH /hierarchy/nodes/{id}/settings/`, `GET/PUT /staff/documents/nodes/{id}/type-delays/`, `GET/PUT /messaging/availability/` | `horaires.gerer` / `structure.gerer` ; `messagerie.recevoir_fideles` |
| Messagerie staff | `/app/messages` | `/messaging/conversations/…` (écran commun, lot messagerie) ; disponibilités dans Paramètres | `messagerie.recevoir_fideles` |
| Dons et quêtes | `/app/paroisse/dons?vue=fonds\|operations\|quetes\|export` | voir ci-dessous | `dons.voir_fonds`, `dons.gerer_fonds`, `dons.saisir_quete`, `dons.exporter` |

Dons de la paroisse (`src/features/dons-staff/`), nœud de type paroisse ou
quasi-paroisse seulement (le back refuse un autre nœud : `not_a_parish`) :

- **Fonds** (`dons.voir_fonds`) : `GET /staff/dons/fonds/?node=&status=` ;
  création `POST /staff/dons/fonds/` (brouillon), `POST …/{id}/publier/`,
  `POST …/{id}/clore/` avec `dons.gerer_fonds`. Une quête impérée déclinée
  (`parent_id` non nul) n'a pas d'action : elle est pilotée par le diocèse.
- **Opérations** (`dons.voir_fonds`) : `GET /staff/dons/operations/?node=&channel=&limit=&offset=`
  (paginé) ; remboursement `POST …/{id}/rembourser/` (`dons.gerer_fonds`). Le
  nom du donateur n'est jamais demandé par l'écran (champ `donor` déjà filtré
  par le back).
- **Quêtes en espèces** (`dons.saisir_quete`) : `GET /staff/dons/quetes/?node=&status=` (paginé),
  `GET …/quetes/fonds-proposes/?node=&date=`, `POST /staff/dons/quetes/`,
  `POST …/{id}/valider/`, `POST …/{id}/rejeter/` (motif obligatoire). La règle
  des quatre yeux (`four_eyes`) est appliquée par le back ; son message
  s'affiche tel quel.
- **Export** (`dons.exporter`) : `GET /staff/dons/export/?node=&date_from=&date_to=&fichier=csv|xlsx`,
  téléchargé avec le jeton (`src/lib/staff/telecharger.ts`).

### Diocèse

| Écran | Route web | Routes V1 | Capacités |
| --- | --- | --- | --- |
| Tableau de bord | `/app/admin`, `/app/clerge/analytique` | `GET /dashboards/nodes/{id}/` sur le nœud diocèse | `tableau_bord.voir` |
| Structure / hiérarchie | `/app/admin/org` | `GET /hierarchy/nodes/{id}/`, `…/children/`, `…/ancestors/`, `POST /hierarchy/nodes/`, `PATCH /hierarchy/nodes/{id}/`, `GET /hierarchy/node-types/` | `structure.gerer` |
| Nominations (clergé et offices) | `/app/admin/nominations` | `/hierarchy/assignments/` sur le nœud diocèse | `offices.nommer` |
| Clergé : vérification des statuts | `/app/admin/users/validation` | `GET /hierarchy/verifications/?statut=`, `POST /hierarchy/verifications/{person}/decision/` | `personnes.verifier` |
| Quêtes impérées + reversements | `/app/diocese/quetes-imperees` | `GET/POST /staff/dons/quetes-imperees/?node=`, `GET …/{id}/suivi/`, `GET /staff/dons/reversements/?node=` (paginé) | `dons.definir_quete_imperee` sur un nœud diocèse |
| Dons du diocèse (agrégats) | `/app/diocese/dons` | lot dons-analyse | `dons.voir_agregats` |
| Journal d'audit | `/app/admin/audit` | `GET /audit/?node=&action=&date_from=&date_to=` (paginé) | `audit.voir` |

### Plateforme

| Écran | Route web | Routes V1 | Capacités |
| --- | --- | --- | --- |
| Tableau de bord | `/app/admin` | `GET /dashboards/platform/` | `plateforme.admin` |
| Référentiels | `/app/plateforme/referentiels` | `GET /hierarchy/node-types/`, `GET /hierarchy/office-types/` | `plateforme.admin` |
| Comptes | `/app/admin/users` | `GET /platform/accounts/?q=&role=` (paginé), `GET …/{id}/`, `POST …/{id}/lock\|unlock\|logout-sessions\|require-mfa/` (503 si Keycloak injoignable) | `plateforme.admin` |
| Paiements | `/app/plateforme/paiements` | lot dons-analyse | `plateforme.admin` |

## Compléments V1 (lot V1C, backend `docs/API-V1-COMPLEMENTS.md`)

Branchés et actifs par défaut : les indicateurs `invitationsClerge` et `intentionsMesse` sont
retirés de `src/config/fonctionnalites.ts`.

| Écran | Route web | Routes | Capacité |
| --- | --- | --- | --- |
| Intentions de messe (file, planifier ou déplacer, refuser avec motif, célébrer) | `/app/paroisse/intentions` (ancienne `/app/clerge/intentions` redirigée), tuile « Intentions de messe », Espace clergé | `GET /mass-intentions/parish/?node=&status=`, `POST /mass-intentions/{id}/accept\|decline\|celebrate/` | `intentions.gerer` |
| Validation du clergé (comptes en attente, valider, refuser avec motif, activer ; invitations : envoyer, lien montré une fois, révoquer) | `/app/admin/users/clerge` (anciennes `…/invitations` et `…/invite` redirigées), tuile « Comptes du clergé » | `GET /clergy-accounts/pending/`, `POST /clergy-accounts/{person_id}/validate\|refuse\|activate\|deactivate/`, `GET/POST /clergy-accounts/invitations/`, `POST …/{id}/revoke/` | `comptes.valider` (diocèse ou plateforme, même écran) |
| Acceptation d'une invitation | `/accept-invitation?token=` (publique) | `POST /clergy-accounts/invitations/validate/ {token}`, `POST …/accept/ {token}` (403 `invitation_email_mismatch` expliqué) | connecté avec l'adresse invitée |
| Épinglage d'une annonce | éditeur `/app/admin/articles/{id}/edit` (bloc « Épingler en tête, jusqu'au… »), mention dans la liste | `POST/DELETE /staff/news/{id}/pin/` (`until` = fin de journée locale, 60 jours au plus) | `annonces.publier` |
| Tâches du jour | tableau de bord `/app/admin` (« Reste à faire aujourd'hui », nœuds paroissiaux) | `GET /staff/taches-du-jour/?node=` | une des capacités de la rubrique |
| Équipe des compteurs | onglet Quêtes de `/app/paroisse/dons` (bouton « Équipe des compteurs » ; noms proposés dans la saisie) | `GET/POST /staff/dons/compteurs/`, `PATCH/DELETE …/{id}/` | `dons.saisir_quete` sur la paroisse |

Choix retenus : l'anonymat est visible du secrétariat (badge « Anonyme à la messe ») ; `accept`
couvre aussi le déplacement (plus de `propose-date`) ; « Célébrée » n'est proposée qu'une fois
la date passée. Non faits faute de route : « Feuille des intentions » (impression), messes de la
semaine avec remplissage, pièce jointe d'un compte du clergé, « Relancer » une invitation
(révoquer puis réinviter), filtre diocèse/rôle des comptes en attente, liste des comptes déjà
validés.

## Routes manquantes (écrans masqués)

> Fusion V1 (29/09/2026) : ce mécanisme n'a pas été porté dans l'architecture V1 ; `NEXT_PUBLIC_FEATURES`
> n'est plus lu par le code ni passé au build (workflow de livraison, Dockerfile). Le tableau reste comme
> inventaire des routes manquantes.

Aucune route V1 n'existe côté backend pour ces écrans hérités. Ils ne sont pas
inventés côté web : l'entrée est masquée et la page affiche « Bientôt
disponible » tant que l'indicateur est éteint (`src/config/fonctionnalites.ts`,
composant `SansRoute`). Activation explicite pour la recette ou une
démonstration : `NEXT_PUBLIC_FEATURES=cle1,cle2`.

| Indicateur | Écran | Route attendue (lot backend) |
| --- | --- | --- |
| `transferts` | `/app/clerge/transferts` | `GET /transfers/admin/`, `POST /transfers/{id}/approve\|reject\|acknowledge/` |
| `messagerieClericale` | `/app/clerge/messages` | `GET /messaging/clerical/inbox/`, `POST /messaging/clerical/` |
| `jangubiTv` | `/app/admin/tv` | `GET/POST/PATCH/DELETE /tv/videos/`, `GET/POST /tv/categories/` |
| `reflexionPastorale` | carte de l'accueil du clergé | `GET/POST /spiritual/reflections/`, `PATCH /spiritual/reflections/{id}/` |
| `analytiqueActivite` | ancienne analytique (remplacée par le tableau de bord du nœud) | `GET /dashboards/analytics/`, `GET /dashboards/analytics/activity/` |

Autres écarts relevés :

- Pas de liste nominative « clergé du diocèse » dédiée : l'écran Nominations
  (sur le nœud diocèse) et les Vérifications la couvrent.
- Dépôts en banque, remises à la curie, clôtures mensuelles, ajustements,
  incidents et rapprochement (`/staff/dons/depots|remises-curie|clotures|ajustements|incidents|rapprochement/`)
  existent côté backend mais n'ont pas d'écran web hérité : non branchés ici.
- Les capacités `dons.*` tenues au niveau diocèse n'ouvrent pas les écrans de
  dons d'une paroisse (le back exige une nomination locale) : « Vue non ouverte ».
