# CLAUDE.md — JanguBiUI (frontend Next.js), refonte V1

Frontend de **Jàngu Bi** : Next.js 16 (App Router), TanStack Query, Zod, react-hook-form, Tailwind, primitives Radix, Vitest + MSW, Playwright, Storybook.

> **Source de vérité de la V1 : `docs/v1/`.** Lire `docs/v1/00-LIRE-D-ABORD.md` au début de chaque session.
> Contrat de données : `../JanguBi/docs/v1/02-SRS-BACKEND-V1.md`. Les anciennes règles (rôles `UserRole`, `authorization.ts`, thème indigo/or, jetons en localStorage) sont **abandonnées**.

---

## 1. Périmètre V1

- **Espaces** : public · fidèle (desktop et mobile) · back-office par nœud (paroisse, diocèse) · plateforme.
- **Briques** : Parole · Ma paroisse · Demandes d'actes · Parler à un prêtre (+ rendez-vous de confession) · tableaux de bord.
- **Features gelées** (ADR-F07) : `dons`, `intentions`, `transfert-paroissial`, `tv`, `assistant`, `reflexion-pastorale`, `clergy-accounts`, `clergy-declaration`, `analytics`, chapelet communautaire, Offices des Heures. Ne pas les modifier ni les réactiver.

## 2. Maquettes = spécification

- Chaque écran a sa maquette de référence dans `docs/v1/maquettes/` (index : `maquettes/INDEX.md` ; carte des routes : `docs/v1/02-SPEC-FRONT-V1.md` §2).
- **Ouvrir la maquette avant de coder l'écran.** Reproduire la composition, la hiérarchie, les textes et les états. Ne rien réinventer.
- Les fichiers `.dc.html` sont de la référence, jamais du code à importer. Ils sont exclus du lint, de tsc et du build.

## 3. Charte (non négociable)

- **Tokens `--jb-*` uniquement** (`src/styles/tokens.css`, généré depuis `docs/v1/design/tokens.css`). Aucune couleur en dur, aucune classe de palette Tailwind brute (règle ESLint anti-palette).
- 4 palettes (`lumiere` par défaut, `ciel`, `atlantique`, `cathedrale`) × clair/sombre, via `data-palette` et la classe `dark`.
- **Polices** : Source Serif 4 (titres, Parole) et Libre Franklin (interface), via `next/font`. Aucune autre.
- **Interdits** : dégradés de fond, cartes à bordure gauche colorée, emoji, tuiles d'action identiques en grille, rangées de « stat cards », petites capitales espacées, Inter, Geist, Fraunces, Instrument Serif.
- Typographie française : `frenchTypo()` (espaces insécables, « »), dates en français (`dayjs` locale `fr`).
- Accessibilité WCAG 2.1 AA : vrais `<button>`, `<a>` et `<label>`, focus visible, cibles ≥ 44 px, `aria-label` sur les boutons icône.

## 4. Architecture — Bulletproof React (CRITIQUE)

```
src/app/          routes App Router (public, /app, /espace/[nodeId], /plateforme)
src/components/   partagé : ui/ (primitives), layouts/ (shells), signature/ (LiturgicalBanner, PhotoSlot…)
src/config/       env.ts, paths.ts (TOUTES les routes — ne jamais coder une URL en dur)
src/features/     un dossier par feature : api/, components/, hooks/, types/, utils/
src/lib/          api-client.ts, auth (Auth.js), can.ts (capacités), ws.ts, react-query.ts
src/testing/      MSW (handlers conformes au contrat), factories, renderApp
```

- **Jamais** d'import d'une feature vers une autre. Flux : shared → features → app. **Pas de barrel files.**
- Un fichier par endpoint : schéma Zod, fetcher (`api.get/post…`), hook `useQuery`/`useMutation`.
- **Corps de requête dérivés du contrat** : `RequestBody<'operationId'>` (`src/types/api-contract`). `yarn generate-api` après chaque changement du `schema.yml` backend.
- Zustand réservé à l'état d'interface (nœud courant, préférences) ; jamais de données serveur.

## 5. Authentification et autorisation

- **Keycloak via Auth.js v5** (ADR-F02) : session en cookie httpOnly, refresh automatique. **Aucun jeton dans `localStorage`.**
- `api-client` ajoute le Bearer depuis la session ; un 401 déclenche un refresh, puis une redirection vers la connexion.
- `ws.ts` : jeton frais à chaque connexion ; reprise plafonnée, puis état « hors ligne ».
- **Autorisation d'affichage** : `useCan(capacite, nodeId?)`, `useNodes(capacite)`, `<RequireCapability>` alimentés par `GET /me/capacites/`. **Aucune fonction par rôle.** Le backend reste l'autorité.
- Tant que F3 n'est pas livré, l'ancienne authentification reste en place : ne pas l'étendre.

## 6. Règles métier visibles dans l'interface

- La demande d'acte va à la **paroisse du sacrement** ; l'acte est un original à retirer : **jamais de PDF d'acte**.
- **Pas de confession par message** : `ConfessionNotice` toujours visible dans la messagerie ; la réservation de confession n'a **aucun champ de contenu**.
- Messagerie réservée aux majeurs (message explicatif si refus).
- Notes internes et contenu des messages : jamais affichés hors de leur destinataire.
- Tableaux de bord au-dessus de la paroisse : agrégats uniquement.

## 7. Vérification AVANT push — CI locale OBLIGATOIRE (ADR-F09)

> **Aucun push ni PR vers `develop`, `stage` ou `main` sans `make act` vert.** Un push vert déclenche le build Docker et le déploiement.

```bash
make act          # act push --job lint-and-typecheck : lint + types + tests + build
make ci-docker    # build local de l'image de prod, SANS push
make hooks        # hook pre-push qui lance make act vers develop/stage/main
```

- **Jamais via act** : `build-docker` (push DockerHub) et `trigger-deploy`.
- Plan B : `yarn lint && yarn check-types && yarn test --run && yarn build`, à mentionner dans la PR.
- Claude Code travaille sur `feat/v1-fX-…`, ouvre une PR et **ne merge jamais** lui-même.

## 8. Tests

- Vitest + Testing Library + MSW, co-localisés (`__tests__/`). Ne jamais mocker `fetch` ou `api` : toujours MSW.
- `renderApp({ route, user, capacites })` pour rendre une page avec session et capacités simulées.
- Playwright pour les parcours dorés ; axe pour l'accessibilité ; Storybook pour chaque composant du design system (clair, sombre, 4 palettes).

## 9. Agents et skills

| Situation | Agent / skill |
|---|---|
| Nouvelle feature ou écran | `react-feature-architect` (livrable dans `docs/v1/conception/`) |
| Tests | `react-tdd-assistant`, skill `react-testing` |
| Revue | `react-reviewer` |
| Auth, session | skill `react-auth` |
| Design system | skills `frontend-design`, `frontend-patterns` |
| Erreurs | `react-error-handler` |

Prompts prêts à l'emploi : `docs/v1/05-PROMPTS-CLAUDE-CODE.md`.

## 10. Commandes

```bash
yarn dev | build | lint | lint:fix | format | check-types | test --run | storybook
yarn generate-api            # types depuis le schéma OpenAPI du backend (django sur :8001)
yarn generate-api:offline    # idem, via docker compose du backend
```
