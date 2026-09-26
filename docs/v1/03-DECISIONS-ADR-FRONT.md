# Jàngu Bi — Décisions d'architecture frontend (ADR-F)

> Complète `../../JanguBi/docs/v1/03-DECISIONS-ADR.md` (ADR backend), qui s'applique aussi au front : périmètre, gel, capacités, Keycloak, règles de l'Église.

## ADR-F01 — Refonte sur place, maquettes comme spécification
- **Statut** : Verrouillée (24/09/2026)
- **Décision** : conserver la base Next.js, TanStack Query, Zod, Radix, Vitest/MSW, Playwright. Refaire le design system, les shells, l'authentification et les écrans V1 à partir des maquettes validées (`docs/v1/maquettes/`).

## ADR-F02 — Authentification : Auth.js v5 (Keycloak), session en cookie httpOnly
- **Statut** : Verrouillée, sous réserve d'une étude de compatibilité avec Next 16 (une demi-journée, en F3)
- **Décision** : Auth.js v5 avec le fournisseur Keycloak (PKCE), rafraîchissement du jeton dans le callback `jwt`, jeton d'accès exposé au client uniquement via la session pour les appels API et le WebSocket. **Plus aucun jeton dans `localStorage`.**
- **Repli** : si Auth.js ne tient pas avec Next 16, `openid-client` avec des route handlers (`/auth/login`, `/auth/callback`, `/auth/refresh`, `/auth/logout`) et `iron-session`.

## ADR-F03 — Autorisation par capacités, jamais par rôle
- **Statut** : Verrouillée
- **Décision** : `useCan(capacite, nodeId?)` alimenté par `GET /me/capacites/`. `src/lib/authorization.ts` et `src/config/roles.ts` (fonctions par rôle) sont supprimés. La navigation du back-office est calculée à partir des capacités.

## ADR-F04 — Thèmes : 4 palettes × clair/sombre par variables CSS
- **Statut** : Verrouillée. Palette par défaut en production : **à trancher** par la direction (défaut technique : `lumiere`).
- **Décision** : `design/tokens.css` généré depuis les palettes validées. Sélection par `data-palette` sur `<html>` et la classe `dark`. Tailwind ne consomme que ces variables.

## ADR-F05 — Polices : Source Serif 4 + Libre Franklin via `next/font`
- **Statut** : Verrouillée
- **Pourquoi** : sortir des signatures « IA » (Instrument Serif, mono en capitales) ; Libre Franklin est la version libre de la Franklin Gothic du New York Times, la référence de lecture citée par le client.
- **Conséquence** : suppression d'Inter et de Fraunces ; polices auto-hébergées par `next/font` (aucune requête vers Google au runtime).

## ADR-F06 — Contrat d'abord, MSW en attendant l'API
- **Statut** : Verrouillée
- **Décision** : chaque lot front démarre avec des handlers MSW conformes au SRS backend §7, puis bascule sur les types générés dès que le lot backend publie son `schema.yml`. Toute divergence est tranchée dans le SRS backend, pas dans le front.

## ADR-F07 — Gel des features hors V1
- **Statut** : Verrouillée
- **Décision** : `dons`, `intentions`, `transfert-paroissial`, `tv`, `assistant`, `reflexion-pastorale`, `clergy-accounts`, `analytics`, chapelet communautaire et Offices des Heures : routes retirées, pages qui renvoient `notFound()`, code conservé.
- **Amendement (26/09/2026)** : la déclaration d'état de vie (`clergy-declaration`) est **dégelée**. Quand la chancellerie demande un complément, la personne ne pouvait pas le fournir sans interface. Elle est reconstruite dans la feature `profil` (section « Mon état de vie » de `/app/profil`) sur `GET/POST /me/declaration/` et l'API fichiers. La déclaration n'ouvre aucun droit tant qu'elle n'est pas vérifiée. Les autres features gelées le restent.

## ADR-F08 — React 19
- **Statut** : À trancher en F0
- **Contexte** : Next 16.2 est installé avec React 18.3. Next recommande React 19 pour l'App Router.
- **Proposition** : monter en React 19 en F0, avant la refonte des écrans, pour éviter une seconde migration.

## ADR-F09 — CI locale obligatoire, tests ajoutés au job de la CI
- **Statut** : Verrouillée
- **Décision** : `make act` avant tout push ou PR vers `develop`, `stage` ou `main`. Le job `lint-and-typecheck` gagne l'étape `yarn test --run`, qui manque aujourd'hui. Les jobs `build-docker` et `trigger-deploy` ne sont jamais lancés via `act`.

## ADR-F10 — Reconstruction des espaces V1 plutôt que retouche de l'existant
- **Statut** : Verrouillée (25/09/2026)
- **Contexte** : le backend V1 est livré (ADR-015, ADR-016 backend) : Keycloak seule authentification, routes `auth/`, `users/`, `org/`, dons, intentions, transferts, TV, assistant, déclaration de clergé historique **supprimées**, nouveau contrat (`schema.yml`). Les 611 fichiers du front reposent sur l'ancien contrat, les rôles et le JWT maison.
- **Décision** : on conserve l'outillage (Next 16, TanStack Query, Zod, react-hook-form, Radix, Tailwind, Vitest + MSW, Playwright) et on **reconstruit** `src/app`, `src/features`, `src/components`, `src/lib` et `src/config` d'après les maquettes et le contrat V1. Les features gelées (ADR-F07) sont **supprimées** plutôt que gelées : leur API n'existe plus côté serveur, l'historique Git les conserve.
- **Conséquences** : le lot F0 retire l'ancien code ; les lots F1 à F8 le remplacent écran par écran. Les types de l'API sont générés depuis `../JanguBi/schema.yml` (fichier, sans serveur).

## ADR-F11 — Palette par défaut : Ciel
- **Statut** : Verrouillée (25/09/2026) — tranche ADR-F04
- **Contexte** : le canvas de maquettes validé (lien partagé le 25/09/2026) est rendu en palette Ciel (bleu #0A6BA3 sur fond blanc, nuancier « Ciel »).
- **Décision** : `NEXT_PUBLIC_PALETTE` vaut `ciel` par défaut ; les 3 autres palettes restent disponibles. Les maquettes du dépôt (`docs/v1/maquettes/`) sont remplacées par celles du canvas.
