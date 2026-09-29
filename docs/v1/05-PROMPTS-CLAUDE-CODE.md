# JanguBiUI — Prompts Claude Code (frontend V1)

> Un prompt par lot, à coller dans Claude Code lancé depuis `JanguBiUI/`. Claude Code **s'arrête et demande validation** aux points ⏸.

---

## Prompt 0 — Amorçage de session

```
Contexte : frontend Jàngu Bi, refonte V1. Lis : docs/v1/00-LIRE-D-ABORD.md, docs/v1/01-PLAN-FRONT-V1.md,
docs/v1/02-SPEC-FRONT-V1.md, docs/v1/03-DECISIONS-ADR-FRONT.md, docs/v1/04-CI-LOCALE-ET-GIT.md,
et pour le contrat de données ../JanguBi/docs/v1/02-SRS-BACKEND-V1.md (§6 capacités, §7 API, §8 cycles de vie).

Règles non négociables :
- Chaque écran reproduit sa maquette de référence (docs/v1/maquettes/<Fichier>.dc.html, voir maquettes/INDEX.md) :
  composition, hiérarchie, textes, états. Tu ouvres la maquette avant de coder l'écran.
- Tokens --jb-* uniquement (design/tokens.css) ; aucune couleur, police ou classe de palette Tailwind brute.
- Polices : Source Serif 4 et Libre Franklin via next/font. Rien d'autre.
- Bulletproof React : pas d'import entre features, pas de barrel files, un fichier par endpoint (Zod + fetcher + hook).
- Corps de requête dérivés du contrat (RequestBody<'operationId'>) ; MSW conforme au SRS tant que l'API n'existe pas.
- Autorisation d'affichage via useCan(capacite, nodeId) ; plus aucune fonction par rôle.
- Aucun jeton dans localStorage.
- TDD : react-feature-architect → react-tdd-assistant → implémentation → react-reviewer.
- Aucun push vers develop/stage/main sans `make act` vert ; jamais les jobs build-docker/trigger-deploy via act.
  Tu travailles sur feat/v1-fX-…, tu ouvres une PR, tu ne merges pas.

Résume en 10 lignes le lot <FX>, liste les fichiers et routes touchés, puis attends mon « go ».
```

---

## F0 — Préparation

```
Lot F0 (plan §2 F0).
1. Hygiène git : état de develop, stage, main, fix/audit-beta ; plan de fusion et d'archivage. ⏸ avant toute action git.
2. Baseline : yarn lint, check-types, test --run, build, e2e smoke ; rapport dans docs/v1/rapports/F0-baseline.md ; corrige
   le trivial, documente le reste.
3. React 19 (ADR-F08) : évalue la montée (react, react-dom, @types/react, dépendances Radix/TipTap/Storybook). ⏸ avant de monter.
4. Gel (ADR-F07) : retire les routes gelées de paths.ts et de nav-config, pages → notFound(), test 404 par route gelée ;
   ne supprime aucun code de feature.
5. CI : étape `yarn test --run` dans nextjs.yml, paths-ignore, PR brouillon ignorées, .actrc, .secrets.example,
   scripts/git-hooks/pre-push, cible make hooks. Vérifie `make act`.
6. Exclure docs/v1/maquettes/ du lint, de tsc et du build.
Livrable : PR « chore(v1): préparation F0 ».
```

---

## F1 — Design system

```
Lot F1 (plan §2 F1, spec §1 et §4, ADR-F04, ADR-F05).
Étape 1 — react-feature-architect : docs/v1/conception/F1-design-system.md (mapping tokens → Tailwind, stratégie de
restylage des primitives Radix, liste des composants signature et de leurs variantes, plan Storybook). ⏸
Étape 2 — Tokens : copie design/tokens.css vers src/styles/tokens.css, branche Tailwind sur les variables, provider de thème
(next-themes + data-palette, défaut NEXT_PUBLIC_PALETTE=lumiere), suppression de l'ancien thème.
Étape 3 — Polices via next/font (Source Serif 4 avec opsz, Libre Franklin), utilitaire frenchTypo(), chiffres tabulaires.
Étape 4 — Primitives restylées d'après maquettes/DS-Composants.dc.html, tests Testing Library (états, clavier, a11y).
Étape 5 — Composants signature (spec §4) avec stories en clair/sombre et pour les 4 palettes ; addon a11y sans violation.
Étape 6 — Suppression de quick-action-tile, stat-card, metric-strip, role-badge après remplacement de leurs usages.
ESLint anti-palette étendue à tout src/. react-reviewer, make act, PR.
```

---

## F2 — Shells et navigation

```
Lot F2 (plan §2 F2, spec §2).
Réécris src/config/paths.ts selon la carte des routes. Implémente les 4 shells d'après les maquettes : public (Main),
fidèle desktop (FID-Accueil), mobile (MOB-Accueil, MOB-Menu), back-office (PAR-Tableau-de-bord, DIO-*, PLA-*) avec
NodeContextSwitcher et navigation calculée par capacités (useCan branché sur un mock MSW de /me/capacites/ en attendant F3).
Retour systématique, fil d'Ariane, footer, bascule clair/sombre. Tests de navigation et e2e smoke. react-reviewer, make act, PR.
```

---

## F3 — Authentification Keycloak

```
Lot F3 (plan §2 F3, ADR-F02, ADR-F03 ; backend L3).
1. Étude (1/2 j) : Auth.js v5 + Keycloak avec Next 16 (App Router, middleware, refresh). ⏸ je valide ou on passe au repli
   openid-client + iron-session.
2. Implémentation : session cookie httpOnly, refresh, déconnexion globale ; api-client avec Bearer depuis la session ;
   gestion 401 (refresh puis redirection) ; ws.ts avec jeton frais à chaque connexion et reprise plafonnée.
3. useCan / useNodes / <RequireCapability> depuis GET /me/capacites/ ; suppression de src/lib/authorization.ts et config/roles.ts.
4. Onboarding /bienvenue : paroisse suivie + consentement (maquette PUB-Inscription-Paroisse).
5. Thème Keycloak : infra/keycloak/themes/jangubi (dans le repo backend) d'après PUB-Connexion et PUB-Inscription-Compte. ⏸ avant
   de toucher au repo backend.
Tests : MSW + e2e connexion contre le Keycloak local (tag @keycloak, hors CI). react-reviewer + skill react-auth, make act, PR.
```

---

## F4 → F8 — Écrans (un prompt par lot, même gabarit)

```
Lot <FX> : <nom du lot> (plan §2 <FX>, spec §2 routes <liste>).
Pour chaque route du lot, dans cet ordre :
1. Ouvre la maquette de référence (docs/v1/maquettes/<Fichier>.dc.html) et liste : blocs, textes, états (vide, chargement,
   erreur, succès), interactions, liens vers d'autres écrans.
2. Vérifie les endpoints dans ../JanguBi/docs/v1/02-SRS-BACKEND-V1.md §7 et dans src/types/api.ts. S'ils n'existent pas
   encore, écris des handlers MSW conformes au SRS.
3. react-feature-architect pour la feature, react-tdd-assistant pour les tests (composants, hooks, formulaires, états),
   puis implémentation avec les composants du design system uniquement.
4. Capture d'écran à côté de la maquette (clair et sombre) pour la PR.
Règles propres au lot :
- F6 (actes) : cycle de vie SRS §8.1, notes internes jamais affichées côté fidèle, aucune génération de PDF d'acte.
- F7 (prêtre) : ConfessionNotice toujours visible, aucun champ de contenu dans la réservation, refus < 18 ans expliqué ;
  E2E seulement après l'ADR backend L6b.
- F8 (back-office) : navigation et actions masquées selon useCan ; tableaux de bord sans donnée nominative au-dessus de la paroisse.
make act, react-reviewer, PR par sous-ensemble cohérent de routes.
```

---

## F9 — Qualité et recette

```
Lot F9 (plan §2 F9, spec §5).
axe sur toutes les routes (Playwright + @axe-core/playwright), Lighthouse mobile (rapport dans docs/v1/rapports/F9-lighthouse.md),
budget JS, e2e des parcours dorés (inscription, demande d'acte, conversation, réservation de confession, publication d'annonce,
traitement de demande), scrubbing Sentry (aucune donnée religieuse), en-têtes de sécurité et CSP, pages 404/403/500.
make act, PR develop → stage, recette, PR stage → main. ⏸ à chaque étape.
```
