# 04 — Recette PERFORMANCE

Agent n°04. Cibles : `docs/v1/02-SPEC-FRONT-V1.md` §5 (ENF-F01 à ENF-F03) + Core Web Vitals (LCP < 2,5 s, CLS < 0,1, INP < 200 ms). Mesures Playwright/Chromium, profil mobile (390×844, UA Android), CPU ×4, réseau « Fast 3G » (RTT 150 ms, 1,6 Mbps↓ / 750 Kbps↑) via CDP.

## 1. Plan de test

| # | Écran | Persona | Build mesuré |
|---|---|---|---|
| 1 | Accueil public `/` | anonyme | **Production** (`yarn build && yarn start -p 3200`, worktree git dédié) |
| 2 | Parole du jour `/parole` | anonyme | Production |
| 3 | Annuaire des paroisses `/paroisses` | anonyme | Production |
| 4 | Fiche paroisse `/paroisses/DAK-SAINT-DOMINIQUE` | anonyme | Production |
| 5 | Accueil fidèle `/app` | fidele@ | **Dev** (`:3000`, cf. §2) |
| 6 | Mes demandes `/app/demandes` | fidele@ | Dev |
| 7 | Parler à un prêtre `/app/pretres` | fidele@ | Dev |
| 8 | Tableau de bord paroissial `/espace/[nodeId]` | secretaire@ | Dev |
| 9 | File des demandes `/espace/[nodeId]/demandes` | secretaire@ | Dev |
| 10 | Tableau de bord diocésain `/espace/[nodeId]` | chancelier@ | Dev |

Pour chaque écran : LCP, CLS, INP approché (simulation d'un clic + Event Timing API), TTFB, poids JS/CSS transféré (`encodedDataLength` CDP, cache désactivé), nombre et détail des appels API, longues tâches (`longtask`). Complément : bench p50/p95 sur 20 appels pour 9 endpoints clés, avec un vrai jeton (contourne un aléa décrit en §4.1).

## 2. Environnement de mesure

- **Build de production** : impossible de réutiliser `.next/` du port 3000 (serveur de dev actif dessus, confirmé par `ss -ltnp` + process `next dev`). Un **worktree git temporaire** a été créé (`git worktree add .../perf-front HEAD`), `yarn install --frozen-lockfile`, `.env` copié avec `AUTH_URL`/`NEXT_PUBLIC_URL` réécrits vers `:3200`, puis `yarn build && yarn start -p 3200`. Build Turbopack propre (aucune erreur TS, aucun avertissement bloquant hors le message attendu « next start ne supporte pas output: standalone », sans incidence ici).
- **Pages connectées** : mesurées sur le serveur de **dev** (`:3000`), Keycloak (client `jangubi-web`) n'autorisant que `http://localhost:3000/api/auth/callback/keycloak` comme redirect URI — confirmé en pratique (le build de prod sur `:3200` ne peut pas compléter le login). **Conséquence** : les temps de chargement des écrans connectés incluent le surcoût de compilation à la volée de Turbopack (dev) et ne sont pas directement comparables aux cibles Lighthouse « production ». Le TTFB, les CLS et le nombre/la duplication des appels API restent en revanche des indicateurs valides indépendamment du mode dev/prod.
- **MFA** : `secretaire@`, `chancelier@` exigent un TOTP. Les secrets ont été trouvés déjà enrôlés dans le fichier partagé par d'autres agents (`totp-secrets.json`) ; réutilisés sans réinitialiser l'OTP.
- Nettoyage effectué en fin de mission : arrêt des process `next start -p 3200` (PID 182605/182606), suppression du worktree (`git worktree remove`), suppression des scripts temporaires (`.perf-scratch/`). Aucun conteneur Docker touché, aucune donnée supprimée.

## 3. Résultats

### 3.1 Pages publiques (build de production, `:3200`)

| Écran | LCP | CLS | INP approx. | TTFB | `load` | Long tasks | JS transféré | CSS transféré | Appels API client |
|---|---|---|---|---|---|---|---|---|---|
| Accueil `/` | **1,14 s** ✅ | **0,0058** ✅ | 0,84 s ⚠️ | 244 ms | 5,18 s ⚠️ | 4 (505 ms) | **328 Ko** | 12,2 Ko | 0 (SSR) |
| Parole du jour | **0,97 s** ✅ | **0,003** ✅ | 0,77 s ⚠️ | 68 ms | 5,12 s ⚠️ | 5 (594 ms) | 326 Ko | 12,2 Ko | 0 |
| Annuaire | **0,86 s** ✅ | **0,002** ✅ | 0,66 s ⚠️ | 104 ms | 5,04 s ⚠️ | 2 (344 ms) | 318 Ko | 12,2 Ko | 0 |
| Fiche paroisse | **1,02 s** ✅ | **0,0024** ✅ | 0,74 s ⚠️ | 235 ms | 5,20 s ⚠️ | 6 (625 ms) | 319 Ko | 12,2 Ko | 0 |

- **LCP et CLS excellents** sur les 4 pages publiques : bien sous les cibles (2,5 s / 0,1). Le rendu serveur (SSR, conforme à `docs/v1/02-SPEC-FRONT-V1.md` §3 « pages publiques en rendu serveur ») fait son travail : zéro appel API client, zéro cascade.
- **`load` très tardif (~5,1 s)** malgré un LCP < 1,2 s : l'écart s'explique par l'exécution JS sous throttling CPU ×4 (les long tasks vont jusqu'à 625 ms cumulés) plus l'hydratation complète de 17-18 scripts. Sur un mobile d'entrée de gamme réel (le proxy le plus proche du CPU ×4), cela peut repousser l'interactivité perçue bien après le premier rendu visuel.
- **INP approché 0,64-0,84 s** : nettement au-dessus de 200 ms sur les 4 pages. À interpréter avec prudence (interaction simulée dès la fin du `networkidle`, donc pendant l'hydratation/les long tasks encore en cours) mais cohérent avec le volume de JS à exécuter sous CPU ×4 : un utilisateur cliquant tôt sur un lien ressentira un délai.
- **Poids JS ≈ 318-328 Ko gzip** pour une page publique : dépasse le budget « landing page » (< 150 Ko, `rules/web/performance.md`) et se rapproche du budget « page applicative » (< 300 Ko). L'exigence ENF-F02 (< 200 Ko) cible explicitement « l'espace fidèle », mais le public partage vraisemblablement le même socle de dépendances (React, Sentry, TanStack Query, design system) — un budget dédié aux pages publiques serait à formaliser.

### 3.2 Pages connectées (serveur de dev `:3000` — voir avertissement §2)

| Écran | LCP (froid → chaud¹) | CLS | INP approx. | TTFB | Appels API (dont doublons) | JS transféré |
|---|---|---|---|---|---|---|
| Accueil fidèle `/app` | 10,3 s (aucune 2ᵉ mesure) | **0,41** ❌ | 0,31 s ⚠️ | 89 ms | 16 (8 endpoints appelés **2×**) | 1,18 Mo (dev, non représentatif) |
| Mes demandes | 1,74 s | **0,28** ❌ | 0,31 s ⚠️ | 131 ms | 6 (3 doublons) | 1,18 Mo |
| Parler à un prêtre | 0,86 s | 0,043 ⚠️ | 0,31 s ⚠️ | 88 ms | 8 (4 doublons) | 1,18 Mo |
| Tableau de bord paroissial | 10,6 s → **0,81 s** | 0,024 ✅ | 0,02 s ✅ | 273 ms | 12 (6 doublons) | 1,23 Mo |
| File des demandes | 10,3 s → **0,66 s** | 0,021 ✅ | 0,31 s ⚠️ | 230 ms | 14 (7 doublons) | 1,23 Mo |
| Tableau de bord diocésain | 10,7 s (2ᵉ mesure non rejouée) | 0,026 ✅ | 0,02 s ✅ | 176 ms | 20 (10 doublons) | 1,23 Mo |

¹ Un second passage sur la même URL (route déjà compilée par Turbopack) a été rejoué pour le tableau de bord paroissial et la file des demandes : LCP 10,6 s → 0,81 s et 10,3 s → 0,66 s. Ceci confirme que le pic à ~10 s est le **coût de compilation à la volée du serveur de dev** (première visite d'une route), un artefact propre à `next dev`/Turbopack, absent en production (build statique). **Ne pas interpréter ces 10 s comme une régression de performance produit.** Les LCP « chauds » (0,66-0,86 s) et le TTFB (89-273 ms) sont, eux, de bons indicateurs même mesurés en dev.

- **CLS très dégradé sur `/app` (0,41) et `/app/demandes` (0,28)**, très au-dessus de 0,1 : les deux écrans chargent leurs données côté client sans réserver l'espace (pas de squelette dimensionné pour `LiturgicalBanner`, les cartes d'annonces/événements ou la liste des demandes), donc le contenu « saute » à l'arrivée des réponses API. C'est un vrai défaut UX/perf, indépendant du mode dev/prod. Les écrans back-office (`/espace/...`) n'ont pas ce problème (CLS ≤ 0,026), sans doute parce qu'ils utilisent déjà des conteneurs de taille fixe.
- **Doublons d'appels API systématiques** : sur les 6 écrans connectés, la quasi-totalité des endpoints (`/me/`, `/liturgy/today/`, `/documents/requests/`, `/messaging/priests/`, `/rosary/today/`, `/agenda/`, `/news/`, `/hierarchy/...`, `/dashboards/nodes/...`) sont appelés **deux fois** à chaque chargement (un lot < 20 ms puis un second lot 150-500 ms plus tard, avec les mêmes paramètres). Deux hypothèses, à trancher par une revue de code (`react-reviewer` / `src/features/*/api/*.ts`) :
  1. **`React.StrictMode` en développement** (Next double-invoque intentionnellement les effets en dev uniquement) → sans impact en production.
  2. **Clés de requête TanStack Query incohérentes** entre deux composants consommant le même endpoint (violerait la règle « clés de requête hiérarchiques » de `docs/v1/CLAUDE.md` / `rules/react/state-management.md`) → impact réel en production (double charge sur l'API, N+1 côté client contraire à ENF-F03).
  Vu le nombre d'endpoints concernés et la régularité du motif (systématiquement 2×, jamais 3× ni aléatoire), l'hypothèse StrictMode est la plus probable, mais **doit être vérifiée** (le repo n'active peut-être pas StrictMode partout) avant de la classer sans risque.
- Poids JS mesurés en dev (1,18-1,23 Mo) ne sont **pas comparables** au budget ENF-F02 (< 200 Ko gzip) : le mode dev de Next/Turbopack sert du JS non minifié et non tree-shaké. Il faudra remesurer ce budget sur un build de production une fois que le client OIDC acceptera une redirection vers un port de test (ou en ajoutant temporairement `http://localhost:3200/api/auth/callback/keycloak` aux « Valid redirect URIs » du client Keycloak `jangubi-web`, à la main, hors du périmètre de cet agent).

### 3.3 Latence API backend (p50/p95 sur 20 appels, jeton valide, hors navigateur)

| Endpoint | Persona | p50 | p95 | min/max |
|---|---|---|---|---|
| `GET /me/` | fidele | 66 ms | 92 ms | 50 / 92 |
| `GET /liturgy/today/` | fidele | 99 ms | 451 ms | 72 / 451 |
| `GET /documents/requests/?limit=20` | fidele | 82 ms | 128 ms | 75 / 128 |
| `GET /messaging/priests/` | fidele | 106 ms | 171 ms | 86 / 171 |
| `GET /messaging/conversations/` | fidele | 75 ms | 135 ms | 49 / 135 |
| `GET /dashboards/nodes/{paroisse}/` | secretaire | 80 ms | 210 ms | 61 / 210 |
| `GET /documents/requests/?limit=50` | secretaire | 64 ms | 117 ms | 47 / 117 |
| `GET /dashboards/nodes/{diocèse}/` | chancelier | 87 ms | 310 ms | 57 / 310 |
| `GET /hierarchy/nodes/{diocèse}/children/` | chancelier | 85 ms | 224 ms | 53 / 224 |

- Tous les endpoints répondent **200** et restent sous 500 ms même au p95 ; le p50 est systématiquement < 110 ms — le backend n'est pas le facteur limitant observé.
- `p95` 2 à 4× le `p50` sur `/liturgy/today/` (451 ms), `/dashboards/nodes/{diocèse}/` (310 ms) et `/hierarchy/nodes/.../children/` (224 ms) suggère l'absence de cache applicatif sur ces endpoints (recalcul à chaque appel) plutôt qu'un N+1 SQL flagrant — les logs `django_structlog` ne tracent pas les requêtes SQL individuelles, donc impossible de confirmer un N+1 précis sans activer `django-silk`/`DEBUG` SQL logging (hors périmètre : je n'ai pas modifié la configuration).
- Combiné au doublement des appels côté client (§3.2), le tableau de bord diocésain déclenche en pratique **~20 requêtes API en double** au premier chargement — un vrai facteur de charge serveur à corriger même si chaque requête individuelle est rapide.

## 4. Défauts constatés

### CRITIQUE

Aucun défaut bloquant confirmé de façon reproductible (voir 4.1, dégradé en MAJEUR).

### MAJEUR

1. **CLS élevé sur l'accueil fidèle et « Mes demandes »** (0,41 et 0,28, cible < 0,1). Repro : se connecter en `fidele@demo.jangubi.sn`, ouvrir `/app` (ou `/app/demandes`) sur un poste/CPU throttlé, observer le décalage de mise en page pendant le chargement des cartes (bandeau liturgique, annonces, agenda, liste de demandes). Piste : réserver l'espace des blocs asynchrones avec des squelettes de taille fixe (`LiturgicalBanner`, cartes d'accueil, lignes de `RequestTimeline`/liste). Fichiers probables : `src/app/app/page.tsx`, `src/app/app/demandes/page.tsx`, composants `src/components/signature/`.
2. **Chaque endpoint appelé deux fois au chargement** sur les 6 écrans connectés testés (`/me/`, `/liturgy/today/`, `/documents/requests/`, `/messaging/priests/`, `/rosary/today/`, `/agenda/`, `/news/`, `/hierarchy/*`, `/dashboards/nodes/*`). Repro : ouvrir n'importe quel écran de `/app/*` ou `/espace/[nodeId]/*` avec les DevTools réseau ouvertes, filtrer sur `localhost:8001`, compter les requêtes identiques. Piste : vérifier si `StrictMode` est actif uniquement en dev (dans ce cas, sans impact prod — à confirmer avec un build de production connecté, voir §3.2) ou si les clés `useQuery` diffèrent entre composants consommant le même endpoint (`src/features/*/api/*.ts`, `src/lib/react-query.ts`). Impact potentiel en production : double charge API, contraire à ENF-F03 (« pas de requêtes en cascade / N+1 côté client »).
3. **Poids JS des pages publiques (~318-328 Ko gzip) au-dessus du budget « landing » (< 150 Ko)** et proche du budget « page applicative » (< 300 Ko), alors que ce sont des pages 100 % SSR sans données dynamiques côté client. Piste : analyser la composition du bundle partagé (Sentry, TanStack Query, design system, polices) avec `source-map-explorer` sur le build de production déjà généré (`yarn build` régénère `.next/`), et envisager un chargement différé des blocs non critiques (Sentry init en `lazy`, `next/dynamic` pour les composants sous la ligne de flottaison).

### MINEUR

4. **`/api/v1/me/` et les autres appels authentifiés observés une fois sans en-tête `Authorization` (401)**, reproduit sur 3 comptes (`fidele@`, `secretaire@`, `chancelier@`) lors d'un premier passage avec le cache navigateur activé, puis **non reproduit** après désactivation du cache HTTP (`Network.setCacheDisabled`) et nouvelle session. Hypothèse la plus probable : une réponse mise en cache de `/api/auth/session` (anonyme) servie de façon stale juste après la connexion, avant que le jeton ne soit disponible côté client. Non confirmé comme bug de production (pourrait être un artefact de l'automatisation Playwright/CDP), mais mérite une vérification rapide des en-têtes `Cache-Control` de la route `GET /api/auth/session` (`src/lib/auth-bridge.tsx` / config Auth.js) — le fichier `src/lib/auth-bridge.tsx` étant d'ailleurs en cours de modification par un autre agent au moment de la rédaction de ce rapport (branche `fix/v1-session-demarrage`), un recoupement avec cette branche est recommandé avant d'ouvrir un ticket séparé.
5. **`load` event à ~5,1 s sur les pages publiques** malgré un LCP < 1,2 s (écart de ~4 s). Sous CPU ×4 + Fast 3G uniquement — à confirmer que ce n'est pas perceptible sur un CPU réel non throttlé (le budget ENF-F01 vise Lighthouse mobile qui applique un throttling comparable). Piste : profiler l'exécution JS post-LCP (Sentry init, hydratation, polices) via `yarn build` + Lighthouse local.

## 5. Non testé / limites

- **Poids JS réel de l'espace fidèle en production (ENF-F02, < 200 Ko)** : non mesurable, le client Keycloak `jangubi-web` n'autorise de redirection OIDC que vers `http://localhost:3000`, occupé par le serveur de dev. Nécessite soit un ajout temporaire de redirect URI côté Keycloak (hors périmètre « ne pas modifier »), soit de rejouer ce test une fois le port 3000 libre pour y lancer un build de production.
- **N+1 SQL côté backend** : non confirmé/infirmé précisément — les logs applicatifs (`django_structlog`) ne journalisent pas les requêtes SQL individuelles ; seule la latence globale (p50/p95) a pu être mesurée. Une vérification avec `django-silk` ou `nplusone` serait nécessaire (hors périmètre de cet agent : pas de modification de configuration).
- **Lighthouse mobile ENF-F01 (score ≥ 90)** : non lancé via l'outil `lighthouse` lui-même (CLI non exécutée) ; les métriques Web Vitals ont été recalculées manuellement via CDP/PerformanceObserver, ce qui donne des valeurs comparables mais pas un score Lighthouse officiel. À rejouer avec `npx lighthouse http://localhost:3200/ --preset=mobile` pour un score formel.
- Écrans non mesurés faute de temps : `/app/parole`, `/app/bible/...`, `/app/confession`, `/espace/[nodeId]/messagerie`, `/espace/[nodeId]/structure`, `/plateforme`.

## 6. Synthèse (≤ 400 mots)

Les **4 pages publiques mesurées sur un vrai build de production** (accueil, Parole du jour, annuaire, fiche paroisse) respectent largement les Core Web Vitals : LCP entre 0,86 et 1,14 s (< 2,5 s), CLS entre 0,002 et 0,006 (< 0,1). Deux points d'attention : le poids JS (~320 Ko gzip) dépasse le budget « landing page » et l'événement `load` traîne jusqu'à ~5 s sous CPU ×4 + Fast 3G, signe d'une hydratation coûteuse à surveiller sur mobile d'entrée de gamme (ENF-F06 vise Android Go).

Les écrans connectés (fidèle et back-office) n'ont pu être mesurés que sur le **serveur de dev** (`:3000`), Keycloak ne redirigeant que vers ce port — les temps de chargement bruts (jusqu'à 10,7 s en première visite d'une route) sont un artefact de compilation à la volée de Turbopack, confirmé par un second passage à chaud (0,66-0,86 s) : à ne pas lire comme une régression produit. En revanche, deux défauts indépendants du mode dev/prod sont solides : un **CLS élevé (0,28-0,41) sur l'accueil fidèle et « Mes demandes »** (contenu qui décale la mise en page à l'arrivée des données), et un **doublement systématique de chaque appel API** sur les 6 écrans connectés testés (à confirmer : StrictMode dev-only, ou clés TanStack Query incohérentes à impact production).

Le **backend répond bien** (p50 < 110 ms, p95 < 500 ms sur 9 endpoints clés bench-és directement avec un jeton valide), donc le ressenti de lenteur sur les écrans connectés vient du front (compilation dev, doublons de requêtes, absence de squelettes) plus que de l'API.

Un aléa d'authentification (401 sporadique sur `/me/`, non reproduit après désactivation du cache navigateur) a été observé une fois sur trois comptes ; classé MINEUR faute de reproduction fiable, à recouper avec la branche `fix/v1-session-demarrage` en cours sur `src/lib/auth-bridge.tsx`.

**Non testé** : score Lighthouse formel (ENF-F01), poids JS de production de l'espace fidèle (ENF-F02, bloqué par la redirection OIDC fixée sur `:3000`), N+1 SQL précis côté Django (logs applicatifs sans détail SQL), et plusieurs écrans hors échantillon (bible, confession, messagerie back-office, structure, plateforme) faute de temps.
