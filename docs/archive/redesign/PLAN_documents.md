# PLAN_documents.md — Refonte du système Documents (V4-3)

> **Statut : CONCEPTION — maquettes à faire valider par le client avant toute implémentation.**
> Retour client : « dans documents le UI/UX est resté le même alors qu'on avait parlé de refonte
> de tout le système ». Ce plan et les maquettes associées servent à obtenir un **GO explicite
> sur les partis pris** avant d'écrire du code, pour éviter un troisième aller-retour.
>
> Maquettes avant/après : `docs/redesign/mockups-documents/` (ouvrir `00-index.html`).
> Même format que l'initiative `docs/redesign/` (PLAN_redesign.md + mockups) : tokens réels
> (Sacred Editorial, bleu #1A8FCC light / #70CBFF dark, Playfair, filet or), light par défaut,
> maquettes autonomes sans dépendance réseau.
>
> Toutes les affirmations sur l'existant sont sourcées `fichier:ligne`. Le code lu fait foi.

---

## 0. Synthèse exécutive

Le système Documents actuel est **fonctionnellement complet et propre** (workflow entier,
timeline, coffre-fort, traitement admin, 24 tests dédiés) mais son UX est restée **générique** :
listes plates, onglets, menus « ⋯ », timeline reléguée en bas de page. Le client attendait une
**expérience**, pas des écrans CRUD.

Le parti central de la refonte : traiter la demande de document comme un **colis que l'on suit**
et le document délivré comme un **acte que l'on conserve** :

- côté **fidèle** : hub de suivi (mini-timelines), wizard en 4 étapes nommées, page de suivi
  « tracking » avec état courant en héros, coffre-fort en cartes-certificats ;
- côté **paroisse** : file de traitement priorisée par SLA (alignée sur l'escalade backend
  existante) et signature du curé mise en scène.

**Aucun changement de contrat métier** : mêmes 5 types, mêmes 6 statuts, mêmes transitions,
mêmes rôles, même payload de création. La refonte est presque intégralement frontend ;
les rares enrichissements backend souhaitables sont listés en §6.

---

## 1. L'existant (audit sourcé)

### 1.1 Contrat métier réel (à ne pas réinventer)

**5 types de documents** (`features/documents/utils/format-document-type.ts:1-7`,
mêmes valeurs dans le wizard `new-document-form.tsx:40-46`) :

| Valeur backend | Libellé |
|---|---|
| `baptism` | Certificat de baptême |
| `first_communion` | Attestation de première communion |
| `confirmation` | Attestation de confirmation |
| `religious_marriage` | Attestation de mariage religieux |
| `godparent` | Attestation parrain / marraine |

**6 statuts** (`features/documents/types/index.ts:3-10`) avec libellés/tons uniques
(`document-status-badge.tsx:21-36`) :
chemin nominal `submitted → under_verification → validated → document_deposited`
(`document-detail.tsx:46-51`), branches `info_requested` (le fidèle répond via
`submit-supplement`) et `rejected` (motif `rejection_reason`). Statuts terminaux :
`document_deposited`, `rejected` (`document-detail.tsx:54`).

**Historique immuable** : `status_logs[] = { to_status, created_at, comment }`
(`types/index.ts:39-47`) — **pas d'acteur** dans le contrat actuel.

**Rôles de traitement** (SRS / matrice de permissions) : niveau 1 = diacre / admin paroissial
(vérification), niveau 2 = curé (signature/validation). Côté front, l'accès est gardé par
`canProcessDocuments` (`app/app/admin/documents/page.tsx:35`) sans distinction niv.1/niv.2.

**SLA backend existant** : escalade automatique quotidienne à 08:00 UTC, seuils
`DOCS_ESCALATE_DAYS`, `DOCS_DEPOSIT_REMINDER_DAYS`, `DOCS_REQUESTER_REMINDER_DAYS`
(CLAUDE.md racine, apps/documents). **L'UI n'en montre rien aujourd'hui.**

### 1.2 Écrans actuels et limites

| Écran | Fichiers | Limites principales |
|---|---|---|
| Hub `/app/documents` | `app/app/documents/page.tsx` + `documents-list.tsx` | Coffre-fort caché dans un onglet (`page.tsx:48-68`) ; cartes sans progression (badge seul, liseré `documents-list.tsx:30-37`) ; demande `info_requested` (action attendue du fidèle) noyée dans la liste ; FAB redondant qui masque la dernière carte (`page.tsx:75-83`) |
| Wizard `/app/documents/new` | `new-document-form.tsx` | 6 micro-étapes anonymes (`:140-147`), barre segmentée sans libellés ni ARIA (`:504-514`) ; lignes 2 colonnes `flex gap-3` sans repli mobile (`:573,:646,:697`) ; types = boutons texte nus (`SelectCard :183-215`) ; récap final partiel (`:862-900`) ; `router.back()` sans confirmation (`:488-492`). Bon point : redirection vers le suivi après création (`:465-473`) |
| Suivi `/app/documents/[id]` | `document-detail.tsx` + `components/ui/status-timeline.tsx` | **Timeline en dernière section de la page** (`:368-376`) ; pas d'acteur ; étape courante non mise en scène (`status-timeline.tsx:74,85`) ; formulaire de complément isolé au milieu (`:280-318`), déconnecté du nœud « Infos requises » et du message de la paroisse ; « document déposé » = bandeau texte sans CTA coffre-fort (`:246-257`) |
| Coffre-fort (onglet) | `vault-content.tsx` | Carte → détail de la *demande* → pièces jointes = téléchargement à 2 clics (`:34-38`) ; `reference_number` jamais affiché ; pill « Disponible » en 10px (`:94`) ; aucun vocabulaire du document acquis |
| Traitement `/app/admin/documents` | `admin/documents/page.tsx` + `admin-document-list.tsx` + `document-status-actions.tsx` | Table triée par date, **zéro notion d'urgence/SLA** ; action principale cachée dans le menu « ⋯ » (`document-status-actions.tsx:72-124`) ; 7 filtres sans comptage (`page.tsx:14-22`) ; « Valider » (signature du curé) = simple item de menu |

Acquis à **conserver** : structure Bulletproof (api/components/types/utils), schémas Zod,
`StatusTimeline`, `StatusBadge` + `DOCUMENT_STATUS_CONFIG` (mapping unique statut→ton/icône),
`DataTable`, dialogues motif de rejet / demande d'info, ParishPicker (FK `parish_id`, diocèse
déduit), upload avec validation 10 Mo, redirection création → suivi, les 6 fichiers de tests.

---

## 2. Partis pris UX (à valider par le client)

1. **Le suivi d'abord — métaphore « suivi de colis ».** La question n°1 du fidèle est « où en
   est ma demande ? ». Le hub montre une mini-timeline horizontale 4 étapes sur chaque carte en
   cours ; la page de suivi ouvre sur un **héros d'état courant** (icône pulsante + jauge) suivi
   de la timeline verticale riche : étapes franchies **datées avec acteur**, étape courante
   animée, étapes à venir explicites (« Validation et signature du curé », « Dépôt dans votre
   coffre-fort »). Animations coupées sous `prefers-reduced-motion`.

2. **L'action requise remonte.** Une demande `info_requested` attend le *fidèle* : carte
   « Action requise » en tête du hub avec CTA, et sur la page de suivi le message de la paroisse
   (le `comment` du log, déjà renvoyé par l'API) est **cité au nœud** de la timeline avec la
   zone de réponse juste dessous (même mutation `submit-supplement`).

3. **Moins d'étapes perçues.** Wizard regroupé **6 → 4 étapes nommées** : Document (type+motif,
   cartes enrichies icône+description) → Paroisse (ParishPicker en pleine étape) → Détails
   (identité + sacrement + contact + pièce jointe en sous-sections défilantes) → Validation
   (récap sectionné avec « Modifier » par bloc + consentement). Aucun champ ajouté/retiré,
   payload `CreateDocumentInput` inchangé, mêmes règles Zod.

4. **Le document a une dignité.** Coffre-fort = **cartes-certificats** : double cadre or, sceau
   ✠, grain papier (`.bg-paper` existe déjà dans `globals.css`), référence officielle en
   pastille, « Délivrée à {nom} », **téléchargement en 1 clic**, slot « Partager (bientôt) »
   réservé mais non construit. Ligne de réassurance : conservation à vie + confidentialité.

5. **La paroisse pilote par l'urgence — liste SLA, pas de kanban.** Justification du choix :
   (a) 6 statuts dont 2 terminaux et 1 « en attente du fidèle » → colonnes kanban
   structurellement déséquilibrées ; (b) les transitions exigent des dialogues à motif
   obligatoire (rejet, demande d'info) → le drag & drop serait dangereux ; (c) le besoin
   opérationnel réel est de **tenir les délais que le backend surveille déjà** (escalade
   quotidienne) ; (d) un kanban est illisible sur mobile, où travaillent les agents paroissiaux.
   La file affiche : compteurs-filtres par étape, pastille SLA (vert/orange/rouge alignée sur
   `DOCS_ESCALATE_DAYS`), tri par âge décroissant, **action principale visible** par statut
   (le « ⋯ » ne garde que les actions secondaires), demandes « attente fidèle » mises en veille.

6. **La signature du curé est un acte (niveau 2).** Section dédiée visible du prêtre : aperçu
   du document, mention « vérifié niveau 1 », référence, bouton or « Signer et déposer ».
   La transition backend reste `validated` puis `document_deposited` — la mise en scène est
   frontend ; la distinction stricte des acteurs niv.1/niv.2 dépend du backend (§6, §7 Q3).

---

## 3. Parcours cibles

**Fidèle — demander et suivre :**
Hub (CTA « Nouvelle demande ») → wizard 4 étapes → redirection vers le **suivi** (existant,
conservé) → notifications e-mail bilatérales (existantes, backend) → si `info_requested` :
carte « Action requise » sur le hub + réponse inline au nœud → `document_deposited` :
CTA « Télécharger » + « Ouvrir le coffre-fort » → le document vit ensuite dans le coffre-fort.
Si `rejected` : motif + rebond « refaire une demande avec d'autres informations ».

**Paroisse — traiter :**
File priorisée (compteurs + SLA) → « Démarrer la vérification » (1 clic, action visible) →
consultation du registre → « Demander une info » (dialogue existant) ou « Transmettre au curé » →
panneau signature (curé) « Signer et déposer » → la demande sort de la file (historique).

---

## 4. Composants : réutilisés vs nouveaux

**Réutilisés tels quels / enrichis :**

| Composant | Usage dans la refonte |
|---|---|
| `StatusBadge` + `DOCUMENT_STATUS_CONFIG` | inchangé — source unique statut→libellé/ton/icône |
| `StatusTimeline` (`components/ui/status-timeline.tsx`) | **enrichi** : acteur, nœud courant animé, contenu riche au nœud (citation + formulaire) |
| `ParishPicker`, dialogues info/rejet, `DataTable`, `EmptyState`/`ErrorState`/`Skeleton`, `FilterPills`, `Card`, `Button`, `SectionHeader` | conservés |
| `submit-supplement`, `admin-actions`, `create-document`, `upload-document-file` (API hooks) | inchangés |

**Nouveaux (tous dans `features/documents/components/` sauf mention) :**

| Composant | Rôle | Maquette |
|---|---|---|
| `MiniTrack` | timeline horizontale 4 points (hub) | 01 |
| `ActionRequiredCard` | carte « action requise » en tête du hub | 01 |
| `VaultTeaserCard` | accès permanent au coffre-fort depuis le hub | 01 |
| `WizardStepper` (candidat `components/ui/`) | stepper nommé 4 étapes, ARIA progressbar | 02 |
| `TrackingHero` | carte d'état courant animée (suivi) | 03 |
| `VaultCard` | carte-certificat (sceau, réf, actions) | 04 |
| `SlaChip`, `QueueCounters`, `QueueRow` | file de traitement priorisée | 05 |
| `SignaturePanel` | mise en scène signature niveau 2 | 05 |

---

## 5. Phasage d'implémentation (après GO client)

> Ordre choisi par **valeur perçue décroissante** côté client : le suivi est le cœur du retour.
> Chaque phase est un chantier revue-able seul. Effort : S ≈ 1-2 j · M ≈ 3-5 j (1 dev front).

| Phase | Contenu | Fichiers principaux | Effort | Dépendances |
|---|---|---|---|---|
| **D1 — Suivi « colis »** | héros d'état, timeline riche (acteur, animation, réponse au nœud), variantes déposé/refusé | `document-detail.tsx`, `status-timeline.tsx` | M | aucune (rôle d'acteur générique possible sans backend) |
| **D2 — Hub fidèle** | mini-timelines, action requise, coffre teaser, fin des onglets et du FAB | `app/app/documents/page.tsx`, `documents-list.tsx` | M | D1 (styles timeline) |
| **D3 — Wizard 4 étapes** | stepper nommé, cartes de type, étape Paroisse, récap modifiable, garde de sortie | `new-document-form.tsx`, `WizardStepper` | M | aucune |
| **D4 — Coffre-fort** | cartes-certificats, téléchargement direct, slot partage | `vault-content.tsx`, `VaultCard` | S | backend : réf + URL fichier dans la liste (§6) |
| **D5 — File paroisse** | compteurs, SLA, action principale, panneau signature | `admin/documents/page.tsx`, `admin-document-list.tsx`, `document-status-actions.tsx` | M | backend : âge/seuil SLA + comptages (§6) |

Transverse : chaque phase met à jour les tests co-localisés
(`components/__tests__/*`, 6 fichiers existants) et respecte le gate CI local
(`yarn lint && yarn check-types && yarn test --run && yarn build`).
Cohérence avec `PLAN_redesign.md` : D1-D5 s'appuient sur les primitives des Phases 1-2
(shell unique, `Button` 44px, `ContentContainer`) si elles sont livrées avant — sinon les
maquettes restent implémentables dans le shell actuel.

---

## 6. Dépendances backend (à chiffrer côté Django)

1. **Acteur des étapes** : ajouter un rôle générique (`by_role: fidele | parish_agent | pretre`)
   aux entrées de `status_logs` (aujourd'hui `to_status/created_at/comment` seulement).
   *Fallback D1 sans backend : libellés génériques par étape (« secrétariat paroissial », « curé »).*
2. **SLA exposé** : par demande, `age_days` + `sla_threshold_days` (ou simplement le flag
   « escaladée ») pour la pastille SLA — les seuils existent déjà en settings.
3. **Comptages par statut** pour les compteurs-filtres de la file (sinon calcul client sur la
   page courante, dégradé).
4. **Liste coffre-fort** : exposer `reference_number` + URL du document final dans l'endpoint
   liste (aujourd'hui portés par le détail uniquement).
5. *(Optionnel, lié à Q3)* : distinction formelle des transitions niv.1 / niv.2 par rôle.

---

## 7. Questions ouvertes pour le client

1. **Wizard** : validez-vous le regroupement 6 → 4 étapes (Document · Paroisse · Détails ·
   Validation), ou préférez-vous conserver 6 micro-étapes avec le stepper nommé ?
2. **Acteur sur la timeline** : afficher le *rôle* (« secrétariat paroissial », « curé ») ou le
   *nom* de la personne ? (le nom exige l'évolution backend §6.1 et pose une question de
   confidentialité côté clergé).
3. **Signature du curé** : mise en scène purement visuelle (proposé ici), ou souhaitez-vous une
   vraie signature numérique (cachet/qualifiée) ? — ce serait un chantier backend séparé.
4. **Partage depuis le coffre-fort** : le slot « Partager (bientôt) » vous convient-il ?
   Quelle cible pour la V2 : lien sécurisé à durée limitée ? partage vers une paroisse ?
5. **Kanban vs liste SLA** : nous recommandons la liste priorisée SLA (justification §2.5) —
   confirmez-vous, ou souhaitez-vous voir une variante kanban maquettée ?
6. **Seuils SLA affichés** : reprendre tels quels `DOCS_ESCALATE_DAYS` (config actuelle) ?
7. **Référence** : peut-on générer `reference_number` dès la soumission (aujourd'hui nullable)
   pour l'afficher dès le hub ?
8. **Terminées** : repliées par défaut sur le hub (proposé : lignes compactes) ou masquées
   derrière un lien « Historique » ?

---

## 8. Ce qu'on ne change pas

- Le **contrat backend** : types, statuts, transitions, payload `CreateDocumentInput`,
  mutations admin — identiques.
- Les **tokens** (`globals.css`, light par défaut) et la direction Sacred Editorial.
- L'architecture Bulletproof (feature `documents`, imports unidirectionnels, un fichier par
  endpoint, tests co-localisés MSW).
- Les emails bilatéraux et l'escalade Celery côté Django (on les **rend visibles**, on ne les
  modifie pas).
- La redirection création → page de suivi (déjà le bon réflexe « colis »).
