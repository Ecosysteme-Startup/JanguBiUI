# Jàngu Bi — Plan frontend V1, de A à Z

> Version du 24/09/2026. Référentiels : `02-SPEC-FRONT-V1.md` (quoi), `03-DECISIONS-ADR-FRONT.md` (pourquoi), `04-CI-LOCALE-ET-GIT.md` (comment livrer), maquettes dans `maquettes/` et dans Claude Design.
> Le backend a son propre plan : `../../JanguBi/docs/v1/01-PLAN-BACKEND-V1.md`. Les deux avancent **contrat d'abord** (OpenAPI).

---

## 0. En une page

**Stratégie : refondre sur place, écran par écran, à partir des maquettes validées.** On garde la base technique (Next.js App Router, TanStack Query, Zod, react-hook-form, Tailwind, primitives Radix, Vitest + MSW, Playwright). On refait le design system, les shells, la navigation, l'authentification et les écrans du périmètre V1. Les features hors V1 sont gelées.

**10 lots, environ 10 à 12 semaines pour un développeur assisté de Claude Code**, calés sur les lots backend :

| Lot | Contenu | Attend du backend | Estimation |
|---|---|---|---|
| **F0** | Préparation : hygiène git, baseline verte, gel des features hors V1, CI (ajout des tests), `act`, docs, maquettes dans le repo | — | 3 j |
| **F1** | Design system : tokens (4 palettes × clair/sombre), polices, primitives restylées, composants signature, Storybook | — | 6 à 8 j |
| **F2** | Shells et navigation : public, fidèle (desktop et mobile), back-office avec sélecteur de contexte, `paths.ts` | — | 4 à 5 j |
| **F3** | Authentification Keycloak, session sans `localStorage`, `useCan()` basé sur `/me/capacites/` | L3 (mock MSW avant) | 5 à 6 j |
| **F4** | Site public et onboarding (annuaire, fiche paroisse, Parole publique, offre paroisses, inscription) | L1, L7 | 5 à 6 j |
| **F5** | Espace fidèle : Parole (lectures, Bible, chapelet) et Ma paroisse (annonces, horaires, agenda, notifications) | L4, L7 | 6 à 7 j |
| **F6** | Demandes d'actes : fidèle (demande, suivi) et paroisse (file, traitement) | L5 | 6 à 7 j |
| **F7** | Parler à un prêtre et confession : fidèle et prêtre ; client E2E après L6b | L6a (L6b) | 6 à 8 j (+ 5 j E2E) |
| **F8** | Back-office : annonces, horaires, agenda, équipe, paramètres ; diocèse ; plateforme ; tableaux de bord | L2, L4, L8 | 8 à 10 j |
| **F9** | Qualité et recette : accessibilité, performance 3G, e2e Playwright, Sentry, pilote | tous | 4 à 5 j |

**Parallélisme** : F1 et F2 démarrent sans le backend. À partir de F3, chaque lot commence avec des handlers MSW écrits d'après le SRS backend §7, puis branche la vraie API dès que le lot backend correspondant a publié son `schema.yml`.

---

## 1. Principes d'exécution

1. **Maquette = spécification visuelle.** Chaque écran a son fichier de référence dans `maquettes/` (voir `maquettes/INDEX.md`). On reproduit la composition, la hiérarchie, les textes et les états ; on ne réinvente pas.
2. **Tokens uniquement.** Aucune couleur en dur, aucune classe de palette Tailwind brute (`bg-blue-500`) : seulement les tokens `--jb-*` exposés dans Tailwind. La règle ESLint anti-palette est étendue à tout `src/`.
3. **Bulletproof React** : features isolées, pas d'import entre features, pas de barrel files, API par endpoint (schéma Zod, fetcher, hook).
4. **Contrat d'abord** : types générés depuis `schema.yml` (`yarn generate-api`), corps de requête dérivés du contrat (`RequestBody<'operationId'>`). MSW reproduit le contrat tant que l'API n'existe pas.
5. **Autorisation côté interface = confort, jamais sécurité** : on masque selon `useCan(capacite, nodeId)`, le backend reste l'autorité.
6. **TDD** : `react-feature-architect`, puis `react-tdd-assistant`, puis implémentation, puis `react-reviewer`.
7. **CI locale obligatoire** : `make act` vert avant tout push ou PR vers `develop`, `stage` ou `main`.

---

## 2. Les lots en détail

### F0 — Préparation (3 j)

| # | Tâche | Critère de sortie |
|---|---|---|
| F0.1 | Hygiène git : `fix/audit-beta` → `develop` (PR), réalignement de `stage` (7 en avance, 9 en retard) et de `main` (6 en avance, 24 en retard), archivage des branches mortes | `develop` à jour, tag `pre-v1` |
| F0.2 | Baseline : `yarn lint`, `check-types`, `test --run`, `build` et e2e smoke au vert | Rapport `docs/v1/rapports/F0-baseline.md` |
| F0.3 | **React 19** : Next 16 est installé avec React 18.3. Aligner sur React 19 (et `@types/react` 19), ou documenter pourquoi on reste en 18 | Build vert, tests verts |
| F0.4 | Gel des features hors V1 : `dons`, `intentions`, `transfert-paroissial`, `tv`, `assistant`, `reflexion-pastorale`, `clergy-accounts`, `clergy-declaration`, `analytics` (sera remplacé par les tableaux de bord), chapelet communautaire, Offices des Heures. Routes retirées de `paths.ts` et de la nav, pages qui renvoient `notFound()`, code conservé | Test : chaque route gelée renvoie 404 |
| F0.5 | CI : **ajouter l'étape `yarn test --run`** au job `lint-and-typecheck` (absente aujourd'hui), plus `paths-ignore` pour la doc, les PR brouillon ignorées, `.actrc`, `.secrets.example`, hook `pre-push`, `make hooks` | `make act` vert |
| F0.6 | Docs : ce kit dans `docs/v1/`, `CLAUDE.md` réécrit, maquettes copiées dans `docs/v1/maquettes/` (exclues du lint et du build) | Relu |

### F1 — Design system (6 à 8 j)

| # | Tâche | Détail |
|---|---|---|
| F1.1 | Tokens | `docs/v1/design/tokens.css` → `src/styles/tokens.css`. 4 palettes (`lumiere`, `ciel`, `atlantique`, `cathedrale`) × clair/sombre, via `data-palette` et la classe `dark`. Palette par défaut : `NEXT_PUBLIC_PALETTE` (défaut `lumiere`). |
| F1.2 | Tailwind | `theme.extend.colors` alimenté par les variables (`paper`, `surface`, `ink`, `primary`…). Suppression de l'ancien thème indigo/or et des variables shadcn inutilisées. |
| F1.3 | Polices | `next/font/google` : **Source Serif 4** (titres, Parole ; axes `opsz`) et **Libre Franklin** (interface). Suppression d'Inter et de Fraunces. Chiffres tabulaires pour les données. Test visuel des caractères wolof (à, ë, ñ, ŋ). |
| F1.4 | Typographie française | Utilitaire `frenchTypo()` (espaces insécables avant `: ; ! ?`, guillemets « »), appliqué aux contenus éditoriaux. |
| F1.5 | Primitives restylées | Bouton (primaire, secondaire, tertiaire, danger), champ, select, textarea, case, radio, interrupteur, onglets soulignés, modale, toast, tableau, pagination, avatar à initiales. Radix conservé, style refait d'après `DS-Composants`. |
| F1.6 | Composants signature | `LiturgicalBanner` (desktop, mobile, back-office), `PhotoSlot` (emplacement art-dirigé avec `data-photo-slot`), `StatusDot` (6 statuts d'acte), `RequestTimeline`, `ConfessionNotice`, `E2EBadge`, `SlotPicker`, `AnnouncementCard`, `ScheduleWeek`, `NodeContextSwitcher`, `Icon` (jeu d'icônes des maquettes, en remplacement progressif de Lucide). |
| F1.7 | Nettoyage | Suppression de `quick-action-tile`, `stat-card`, `metric-strip` et `role-badge` (signatures « IA » ou ancien modèle), après remplacement. |
| F1.8 | Storybook | Une story par composant, en clair et en sombre, pour les 4 palettes (addon a11y actif). |

### F2 — Shells et navigation (4 à 5 j)

- `paths.ts` réécrit selon la carte des routes (SPEC §2).
- **Shell public** : header (logo serif, navigation, connexion, appel à l'action) et footer « nuit ».
- **Shell fidèle desktop** : header fin avec bandeau liturgique, sidebar de 264 px avec sections et sous-navigations, retour systématique, footer discret (retours R2 du client).
- **Shell fidèle mobile** : en-tête compact, bandeau liturgique compact, bottom-nav à 5 entrées (Accueil, Parole, Paroisse, Demandes, Prêtre) et menu « Plus ».
- **Shell back-office** : sidebar de 272 px, **sélecteur de contexte** (nœud courant : paroisse, diocèse ou plateforme) qui pilote `/espace/[nodeId]/…`, fil d'Ariane, recherche, notifications, utilisateur avec son office.
- Thème : bascule clair/sombre (`next-themes`), palette via `data-palette`.

### F3 — Authentification Keycloak (5 à 6 j)

- **Auth.js v5** (fournisseur Keycloak, PKCE), session en **cookie httpOnly**, rafraîchissement du jeton dans le callback `jwt`. Aucun jeton dans `localStorage`. Étude préalable d'une demi-journée pour valider la compatibilité avec Next 16. Si elle échoue, repli sur `openid-client` avec des route handlers (ADR-F02).
- `api-client` : ajoute `Authorization: Bearer` depuis la session. Le 401 déclenche un refresh, puis une redirection vers la connexion. Le WebSocket récupère le jeton au moment de la connexion et se reconnecte après un refresh.
- `useCan(capacite, nodeId?)` et `useNodes(capacite)` alimentés par `GET /me/capacites/`. `src/lib/authorization.ts` (fonctions par rôle) est supprimé à la fin du lot.
- Onboarding : après la première connexion, choix de la paroisse suivie, puis consentement (`POST /me/consent/`).
- Écrans Keycloak habillés : thème du realm (FTL + CSS) conforme à `PUB-Connexion` et `PUB-Inscription-Compte`, livré dans `JanguBi/infra/keycloak/themes/jangubi/`.

### F4 — Site public et onboarding (5 à 6 j)
Accueil, annuaire des paroisses (recherche, filtres, carte schématique), fiche paroisse, Parole du jour publique, « Pour les paroisses » (formulaire de contact), parcours d'inscription. Métadonnées SEO, OpenGraph, `sitemap.xml`.

### F5 — Espace fidèle : Parole et Ma paroisse (6 à 7 j)
Accueil fidèle, lectures du jour (taille du texte réglable), Bible (livres, chapitres, recherche), chapelet guidé, Ma paroisse (onglets annonces, horaires de la semaine, agenda), détail d'une annonce en lecture éditoriale, événement et inscription, centre de notifications et préférences.

### F6 — Demandes d'actes (6 à 7 j)
Côté fidèle : liste, nouvelle demande en 4 étapes (type, paroisse du sacrement, informations, récapitulatif) avec validation inline, suivi en timeline, annulation. Côté paroisse : file avec onglets et compteurs, filtres, sélection multiple, détail et traitement (références du registre, mentions marginales, notes internes, modales de transition).

### F7 — Parler à un prêtre et confession (6 à 8 j, + 5 j pour l'E2E)
Côté fidèle : prêtres joignables, conversation temps réel (bandeau permanent, indicateur de chiffrement), prise de rendez-vous de confession, mes rendez-vous. Côté prêtre : messagerie avec disponibilité, planning et règles de créneaux. **E2E** (après L6b) : client WASM (`vodozemac` ou OpenMLS selon l'ADR backend), écrans « Sécuriser mes messages », « Nouvel appareil », clé de récupération.

### F8 — Back-office (8 à 10 j)
- **Paroisse** : tableau de bord, annonces et éditeur TipTap (bannière, annonce du dimanche, programmation, aperçu mobile), horaires et lieux de culte, agenda, équipe et nominations, paramètres.
- **Diocèse** : tableau de bord, structure (arbre), nominations et import du mouvement annuel (assistant avec simulation), annuaire du clergé et vérifications.
- **Plateforme** : tableau de bord, référentiels (types, offices, matrice des capacités), comptes, journal d'audit.

### F9 — Qualité et recette (4 à 5 j)
- Accessibilité : axe sur toutes les pages, navigation clavier, contrastes (déjà vérifiés dans les palettes), cibles de 44 px.
- Performance : Lighthouse mobile ≥ 90 sur les pages fidèle, JS initial < 200 ko gzip pour l'espace fidèle, images `next/image`, polices en `swap`.
- Tests e2e Playwright des parcours dorés : inscription, demande d'acte, conversation, réservation de confession, publication d'une annonce, traitement d'une demande.
- Sentry, pages d'erreur, mode hors-ligne minimal (dernière Parole en cache).
- Recette sur `stage`, puis PR `stage → main`.

---

## 3. Calendrier indicatif (aligné sur le backend)

| Semaine | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Backend | L0 | L1 | L1-L2 | L2 | L3 | L3·L7 | L4 | L5 | L6a | L6b | L6b·L8 | L9 |
| Front | F0 | F1 | F1·F2 | F2 | F3 (MSW) | F3·F4 | F5 | F6 | F7 | F8 | F8 | F9 |

## 4. Définition de « terminé » (chaque lot)

- [ ] Écran conforme à la maquette de référence (captures côte à côte dans la PR, clair et sombre)
- [ ] Tokens uniquement, aucune couleur ni police en dur ; ESLint vert
- [ ] Tests Vitest et MSW des composants et hooks ; e2e pour les parcours touchés
- [ ] `make act` vert (lint, types, tests, build)
- [ ] Accessibilité : axe sans violation sérieuse, clavier OK
- [ ] Types API régénérés si le contrat a changé
- [ ] `react-reviewer` passé ; PR avec captures et routes touchées
