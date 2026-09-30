# CLAUDE.md — JanguBiUI (frontend Next.js), refonte V1

Frontend de **Jàngu Bi** : Next.js 16 (App Router), TanStack Query, Zod, react-hook-form, Tailwind, primitives Radix, Vitest + MSW, Playwright, Storybook.

> **Source de vérité de la V1 : `docs/v1/`.** Lire `docs/v1/00-LIRE-D-ABORD.md` au début de chaque session.
> Contrat de données : `../JanguBi/docs/v1/02-SRS-BACKEND-V1.md`. Les anciennes règles (rôles `UserRole`, `authorization.ts`, thème indigo/or, jetons en localStorage) sont **abandonnées**.

---

## 1. Périmètre V1

- **Espaces** : public · fidèle (desktop et mobile) · back-office par nœud (paroisse, diocèse) · plateforme.
- **Briques** : Parole · Ma paroisse · Demandes d'actes · Parler à un prêtre (+ rendez-vous de confession) · Dons et quêtes · tableaux de bord.
- **Dons et quêtes** (ADR-F12, 27/09/2026) : feature `dons` dégelée et reconstruite sur le contrat V1 (collecte par paroisse autorisée, paiement chez l'agrégateur, confirmation serveur, jamais d'appel au don dans actes, messagerie ou confession).
- **Features gelées** (ADR-F07) : `transfert-paroissial`, `tv`, `assistant`, `reflexion-pastorale`, `analytics`, chapelet communautaire, Offices des Heures, messagerie entre clercs. Ne pas les modifier ni les réactiver. La déclaration d'état de vie (`clergy-declaration`) est dégelée le 26/09/2026 : section « Mon état de vie » de la feature `profil` (ADR-F07 amendée).
- **Fusion avec la V1 de `main` (29/09/2026)** : modules branchés sur les vraies routes V1 et portés sur cette architecture — sonothèque et lecteur audio global (`sonotheque`, `src/lib/player`, `src/components/player`), `intentions` et `clergy-accounts` (dégelées), `recherche`, `dons-analyse`, `admin-comptes` (comptes synchronisés avec Keycloak), `paroissiens`, paroisses multiples (`src/lib/paroisses`), « Pour vous aujourd'hui » et personnalisation (`src/lib/personnalisation`), présence dans la messagerie. Livraison en recette : `.github/workflows/livraison-recette.yml` (push `stage`) et `Dockerfile`.

## 2. Maquettes = spécification (« Ciel produit »)

- **La maquette de référence est `docs/v1/maquettes-ciel/`** : écrans `WEB-*.dc.html` (clair) et `Sombre-WEB-*.dc.html` (sombre), design system `WEB-Design-System.dc.html`, sommaire `Main.dc.html`, captures `captures/*.png` (régénérer : `python3 scripts/maquettes-statiques.py && node scripts/maquettes-captures.mjs [filtre]`).
- **Chaque écran reproduit sa maquette au pixel près, en clair ET en sombre** : composition, hiérarchie, textes, états. Lire le HTML de la maquette (valeurs px exactes) avant de coder.
- Jetons, classes, primitives et coquilles : **`docs/v1/maquettes-ciel/FONDATIONS.md`**. Besoin d'une primitive ou d'un emplacement de coquille : `docs/v1/maquettes-ciel/demandes-fondations/<lot>.md`.
- Vérification : harnais `e2e/visuel/` (README) — capture de l'app à côté de la maquette, clair et sombre.
- L'ancienne maquette `docs/v1/maquettes/` (palette « lumière », revue éditoriale) est **archivée** : ne plus s'y référer.
- Les fichiers `.dc.html` sont de la référence, jamais du code à importer. Ils sont exclus du lint, de tsc et du build.

## 3. Charte « Ciel produit » (non négociable)

- **Jetons `--jb-*` uniquement** (`src/styles/tokens.css`, copie `docs/v1/design/tokens.css`) via les classes Tailwind qui les exposent. Aucune couleur en dur, aucune classe de palette Tailwind brute, aucune taille `text-[..px]` (règles ESLint et tests).
- **Une seule palette** (Ciel), clair et sombre par la classe `dark` (next-themes). Plus de `data-palette` ni de `NEXT_PUBLIC_PALETTE`.
- **Polices** : Libre Franklin pour toute l'interface ; Source Serif 4 **réservé** au texte de la Parole, aux citations bibliques et au logotype. Via `next/font`. Aucune autre.
- Échelle typo en px de la maquette (`text-12`…`text-56`), titres 600 d'une seule couleur ; rayons 6/8/10/12/16/999 ; ombres `shadow-card` et `shadow-menu` ; icônes Lucide trait 1,75 via `<Icon>`.
- **Interdits** (« Ce qu'on ne fait plus », WEB-Design-System) : titre avec un mot en italique coloré, numérotation « 01 — », bandeau-ticker en haut de page, rangée de « stat cards », filets et rayons 2 px partout, légende « PHOTO · Fig. 1 » ; et toujours : dégradés, cartes à bordure gauche colorée, emoji, petites capitales espacées, Inter, Geist, Fraunces, Instrument Serif.
- Typographie française : `frenchTypo()` (espaces insécables, « »), dates en français (`dayjs` locale `fr`).
- Accessibilité WCAG 2.1 AA : vrais `<button>`, `<a>` et `<label>`, focus visible, cibles ≥ 44 px (`hit`), `aria-label` sur les boutons icône, contrastes vérifiés (`tokens-contrast.test.ts`).
- Textes : jamais « chiffrée de bout en bout » ; dire « Messages chiffrés, aucun administrateur n'y a accès ».

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

> **Aucun push ni PR vers `develop`, `stage` ou `main` sans `make act` vert.** Un push sur `stage` livre en recette.

```bash
make act          # act push --job lint-and-typecheck : lint + types + tests + build
make ci-docker    # build local de l'image de prod, SANS push
make hooks        # hook pre-push qui lance make act vers develop/stage/main
```

- **Jamais via act** : `livraison-recette.yml` (push DockerHub et livraison en recette, sur push `stage` seulement).
- Plan B : `yarn lint && yarn check-types && yarn test --run && yarn build`, à mentionner dans la PR.
- Claude Code travaille sur `feat/v1-fX-…`, ouvre une PR et **ne merge jamais** lui-même.

## 8. Tests

- Vitest + Testing Library + MSW, co-localisés (`__tests__/`). Ne jamais mocker `fetch` ou `api` : toujours MSW.
- `renderApp({ route, user, capacites })` pour rendre une page avec session et capacités simulées.
- Playwright pour les parcours dorés ; axe pour l'accessibilité ; Storybook pour chaque composant du design system (clair et sombre) ; `e2e/visuel/` pour la conformité aux maquettes.

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
