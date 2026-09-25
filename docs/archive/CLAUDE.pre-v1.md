# CLAUDE.md — JanguBiUI (Frontend Next.js)

Frontend de la plateforme **Jàngu Bi** — Next.js 14 App Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui.

> Voir le CLAUDE.md racine (`../CLAUDE.md`) pour les règles d'orchestration agents/skills.

---

## Commandes

```bash
# Depuis JanguBiUI/
yarn dev          # Serveur de développement (port 3000)
yarn build        # Build production — doit être clean (0 erreurs TS)
yarn test --run   # Vitest — tous les tests doivent passer (247/247)
yarn lint         # ESLint (eslint src) — doit être clean (0 erreur)
yarn lint:fix     # ESLint --fix
yarn format       # Prettier --write (le formatage n'est PAS géré par ESLint)
yarn check-types  # tsc --noEmit
```

> Note ESLint : la config (`.eslintrc.cjs`) est en eslintrc legacy sous ESLint 8.
> `eslint-config-next@16` est flat-config-only et incompatible → on ne charge PAS
> `next/core-web-vitals`. La règle **anti-palette** (`no-restricted-syntax`) interdit
> la palette Tailwind brute (`bg-blue-500`…) hors `src/features/landing` (dark forcé).

API backend : `http://localhost:8001/api/v1/`

---

## Vérification AVANT push (CI locale — OBLIGATOIRE)

> **Règle :** ne jamais pusher sur `develop` / `stage` / `main` sans avoir fait
> passer le gate CI **en local d'abord**. Le job CI GitHub (lint + typecheck +
> build) conditionne le déploiement : s'il échoue, rien ne se déploie. On attrape
> les régressions **avant** le push.

```bash
yarn lint          # ESLint — 0 erreur (inclut la règle anti-palette)
yarn check-types   # tsc --noEmit — 0 erreur
yarn test --run    # Vitest — tous les tests passent
yarn build         # build production standalone — doit être clean
```

Ces 4 commandes = ce que rejoue le job CI du frontend. Ne pusher que si **les
4 sont vertes**. `main` ne se pousse qu'après revue de staging.

> Note : `act` (simulation CI en conteneur) nécessite un accès **réseau** dans le
> conteneur pour `yarn install` ; dans un environnement sandbox sans Internet il
> échoue sur `ENETUNREACH` — utiliser alors directement les 4 commandes ci-dessus.

---

## Architecture — Bulletproof React (CRITIQUE)

```
src/
├── app/              # Next.js App Router — pages et layouts
├── components/       # Composants partagés toute l'application
│   └── ui/           # Primitives UI (Button, Input, Dialog…)
├── config/           # Configuration et exports env
│   └── paths.ts      # Toutes les routes — NE PAS hardcoder les URLs
├── features/         # Modules feature-based — cœur du codebase
├── hooks/            # Hooks partagés
├── lib/              # Bibliothèques préconfigurées (api-client, auth)
├── stores/           # Stores Zustand globaux
├── testing/          # Utilitaires de test, handlers MSW, factories
├── types/            # Types TypeScript partagés
└── utils/            # Fonctions utilitaires partagées
```

### Structure d'une feature

```
src/features/<nom>/
├── api/         # Hooks react-query + fetchers (un fichier par endpoint)
├── components/  # Composants scopés à cette feature
│   └── __tests__/
├── hooks/       # Hooks scopés à cette feature
├── stores/      # Stores Zustand locaux à cette feature
├── types/       # Types TypeScript de cette feature
└── utils/       # Utilitaires de cette feature
```

### Règles d'import (CRITIQUES — enforce par ESLint)

- **Jamais** d'import cross-feature (`features/auth` ne peut pas importer depuis `features/news`)
- Flux unidirectionnel : `shared → features → app`
- **Pas de barrel files** (`index.ts`) — casse le tree-shaking

---

## Couche API

**Un seul client Axios** dans `src/lib/api-client.ts`. Ne jamais appeler `fetch()` ou `axios` directement dans les composants.

Chaque endpoint = un fichier dans `src/features/<nom>/api/` avec :
1. **Schéma Zod** — valide et type la réponse
2. **Fetcher** — appelle `api.get/post/patch/delete`
3. **Hook react-query** — `useQuery` ou `useMutation`

```typescript
// Pattern standard query
export const useMyData = () =>
  useQuery({ queryKey: ['my-data'], queryFn: () => api.get('/my-data/') });

// Pattern standard mutation
export const useCreateThing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Input) => api.post('/things/', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['things'] }),
  });
};
```

### Corps de requête : dériver du schéma, ne jamais l'écrire à la main

Le backend expose son schéma OpenAPI ; `src/types/api.ts` en est **généré**
(`yarn generate-api`, ou `yarn generate-api:offline` si l'API n'est pas servie).
Ce fichier décrit le contrat réel — encore faut-il s'en servir.

Plusieurs pannes de production sont venues d'un client qui inventait sa propre
forme de payload alors que le bon type dormait dans ce fichier : un `message`
envoyé là où le serveur lisait `comment` (l'email partait sans motif, en 200),
un `file_id` obligatoire omis (dépôt en 400 systématique, coffre-fort jamais
alimenté). Le backend était testé, le frontend aussi ; **rien ne testait la
jonction**.

Pour toute mutation, dérive donc le corps de requête de l'opération :

```typescript
import type { RequestBody } from '@/types/api-contract';

type DepositBody = RequestBody<'v1_documents_admin_requests_deposit_create'>;

api.post<void>(url, { file_id: fileId, label } satisfies DepositBody);
```

Un champ mal nommé ou manquant devient alors une **erreur de compilation**, pas
une panne silencieuse. `src/features/documents/api/admin-actions.ts` sert de
référence.

> Si un endpoint n'apparaît pas dans `api.ts`, c'est que drf-spectacular ne sait
> pas deviner son corps de requête et l'ignore : il faut l'annoter côté backend
> (`@extend_schema(request=...)`, ou `request=None` s'il n'en prend pas).

---

## Authentification

- `useUser()` depuis `src/lib/auth.tsx` — source de vérité pour l'utilisateur connecté
- Token JWT stocké dans localStorage (patterns existants du projet)
- `clearAccessToken()` / `clearRefreshToken()` avant tout redirect logout
- Le 401 handler dans `api-client.ts` redirige vers `/auth/login` UNIQUEMENT si `!window.location.pathname.startsWith('/auth/')` (évite la boucle infinie)

---

## Autorisation — `src/lib/authorization.ts`

Fonctions existantes à NE PAS dupliquer :

```typescript
isAdmin(user)                // Tout rôle admin
isSuperAdmin(user)           // super_admin uniquement
isProvinceAdminOrAbove(user) // province_admin | super_admin
isDioceseAdminOrAbove(user)  // diocese_admin et au-dessus
isParishLevelAdmin(user)     // parish_admin | church_admin
isFidele(user)               // fidele uniquement
canCreateArticle(user)       // Peut créer un article
canPublishArticle(user)      // Peut publier un article
canProcessDocuments(user)    // Peut traiter des documents
canManageUsers(user)         // Peut gérer les utilisateurs
canManageTV(user)            // Peut gérer JanguBi TV
isClergy(user)               // archeveque | eveque | pretre | diacre | religieux
isPretre(user)               // pretre uniquement
isEvequeOrAbove(user)        // eveque | archeveque
```

> Les sélecteurs/hooks territoriaux (paroisse, diocèse, province, église) sont
> **partagés** : composants dans `src/components/org/`, hooks dans `src/lib/org/`.
> NE PAS les remettre dans une feature (import cross-feature interdit).

---

## Tests

- **Framework** : Vitest + Testing Library + MSW
- **Co-location** : `src/features/<nom>/components/__tests__/<nom>.test.tsx`
- **Jamais** mocker `fetch` ou `api` directement — toujours passer par MSW
- Helper central : `src/testing/test-utils.tsx` → `renderApp({ route })`
- État actuel : **247/247 tests passent**

```bash
# Un seul test
cd JanguBiUI && yarn test --reporter=verbose src/features/bible
```

---

## Features existantes

| Page | Status | Route |
|---|---|---|
| Auth (login, register, reset, verify) | ✅ | `/auth/*` |
| Bible | ✅ | `/app/bible` |
| Chapelet | ✅ | `/app/chapelet` |
| Liturgie du jour | ✅ | `/app/spirituel/liturgie` |
| Messagerie WebSocket | ✅ | `/app/messages/*` |
| Documents (fidèle : créer + suivre) | ✅ | `/app/documents/*` |
| Actus (lecture seule) | ✅ | `/app/actus/*` |
| JanguBi TV (lecture seule) | ✅ | `/app/tv` |
| Assistant spirituel RAG | ✅ | `/app/assistant` |
| Profil utilisateur | ✅ | `/app/profil` |
| Liturgie des Heures (offices) | ✅ | `/app/spirituel/heures` |
| Intentions de messe (fidèle + clergé) | ✅ | `/app/intentions`, `/app/clerge/intentions` |
| Transfert paroissial (clergé) | ✅ | `/app/transfert`, `/app/clerge/transferts` |
| Inter-clergé messaging | ✅ | `/app/clerge/messages` |
| Agenda / événements | ✅ | `/app/agenda` |
| Admin (users, org, TV, articles, documents, agenda) | ✅ | `/app/admin/*` |

> Toute la refonte UI « Sacred Editorial » (Phases 0→6 + clôture) est livrée sur
> la branche `feat/refonte-ui-sacred-editorial` : tokens light-first + dark réparé,
> kit design-system (`src/components/ui`), a11y, `DataTable`/`StatusBadge`/`RoleGuard`.

## Features manquantes (priorité SRS)

| Feature | Priorité |
|---|---|
| Navigation conditionnelle par rôle (affinage) | 🟡 P2 |
| Dashboard fidèle scopé à sa paroisse (données réelles) | 🔴 P1 |
| CMS Articles — 3 types distincts (Annonce/Article/Lettre) | 🔴 P2 |
| Allo-Prêtre (disponibilités ministres) | 🔴 P2 |
| CRUD org complet (backend : PATCH/DELETE sur Detail APIs) | 🟡 P3 |
| Intentions de messe — alignement workflow backend | 🟡 P3 |

---

## Agents Claude à utiliser — Frontend

| Situation | Agent / Skill |
|---|---|
| Avant toute nouvelle feature | `react-feature-architect` |
| Écrire les tests avant d'implémenter | `react-tdd-assistant` |
| Review après chaque modification React | `react-reviewer` |
| Mise en place gestion d'erreurs | `react-error-handler` |
| Référence nouvelle feature Bulletproof | skill `react-new-feature` |
| Auth pattern, cookies, useUser | skill `react-auth` |
| Tests Vitest + MSW + Playwright | skill `react-testing` |
| Design system, shadcn, Tailwind | skill `frontend-design` |
| Composition, state types, URL state | skill `frontend-patterns` |
| Swiper, animations, transitions | skill `frontend-slides` |

---

## Dette connue / suivi

- **Allo-Prêtre** (disponibilités ministres) n'existe pas encore — ni la feature
  `allo-pretre`, ni la route `/app/admin/availability`. À construire (pas à « réintégrer »).
- **CRUD org** : la page `/app/admin/org` affiche l'existant en lecture ; les
  endpoints backend `PATCH`/`DELETE` sur les Detail APIs manquent pour create/edit/delete.
- **ESLint** : config eslintrc legacy (ESLint 8) — migration flat-config + ESLint 9
  recommandée à terme (cf. note Commandes).

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composant | PascalCase | `ReadingsSwiper`, `ArticleCard` |
| Hook | `use` prefix | `useMyParishArticles` |
| Fichier API | verb-noun | `get-articles.ts`, `create-document.ts` |
| Store | noun + `Store` | `notificationsStore` |
| Test | `__tests__/name.test.tsx` | co-localisé avec la source |
