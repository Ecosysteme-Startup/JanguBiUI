# 04 — Suites données à la recette performance (branche `fix/v1-recette-ux`)

Mesures reproductibles : build de production (`yarn build && next start`), Chromium Playwright.
JS : `encodedDataLength` CDP, cache désactivé. CLS : mobile 390×844, CPU ×4, session Auth.js
forgée localement, API simulée avec les fixtures MSW (délais échelonnés de 250 à 950 ms).
Avant = `49c1857`, après = tête de la branche.

## MAJEUR 1 — CLS de l'accueil fidèle et de « Mes demandes »

| Écran | Avant | Après |
|---|---|---|
| `/app` | 0,213 | **0,014** |
| `/app/demandes` | 0,026 | **0,008** |

(La recette mesurait 0,41 et 0,28 avec les données réelles ; même cause.) Chaque bloc a un
squelette au gabarit du contenu chargé (`SkeletonLine` prend la hauteur de ligne de la classe
typographique) ; la semaine paroissiale attend ses trois sources avant de s'afficher ; la phrase
d'en-tête de « Mes demandes » a sa place réservée. Reste hors de ce lot : le bandeau liturgique
(`liturgical-banner.tsx`, chantier accessibilité/responsive).

## MAJEUR 2 — « Chaque endpoint appelé deux fois »

Conclusion : **pas de second GET émis par l'application.** Un test d'intégration
(`src/app/app/__tests__/requetes-uniques.test.tsx`) rend le shell fidèle et l'accueil sous
`StrictMode` et vérifie qu'aucun GET n'est dupliqué. Le motif mesuré (un lot immédiat, puis un
second 150 à 500 ms plus tard, « jamais 3× ») est le **pré-vol CORS** : l'API est sur une autre
origine (`:8001`) et chaque requête porte `Authorization`, donc le navigateur envoie `OPTIONS`
puis `GET` ; avec « cache désactivé », le cache de pré-vol (`Access-Control-Max-Age: 86400`) est
ignoré à chaque chargement. `reactStrictMode` ne double pas les requêtes (TanStack Query
déduplique la requête en vol). En production, l'API reste sur un autre sous-domaine : le
pré-vol existe, mais une fois par URL et par 2 h (plafond Chromium).

La revue des clés a trouvé deux **vraies collisions**, corrigées : `['rosary','today']` (accueil
et chapelet, deux schémas : le chapelet relisait une version tronquée et plantait) et
`['public','nodes','paroisse', q]` (actes, inscription, profil). Elles passent par
`src/hooks/use-rosary-today.ts` et `src/hooks/use-parish-search.ts`.

## MAJEUR 3 — JS des pages publiques

| Page | JS du premier affichage, avant | après |
|---|---|---|
| `/` | 309,6 Ko | **222,4 Ko** (−28 %) |
| `/parole` | 307,9 Ko | 230,9 Ko |
| `/paroisses` | 299,5 Ko | 222,6 Ko |

Répartition avant (source maps) : React DOM ~60 Ko gzip, runtime Next ~70, **Sentry ~70**
(core, browser, tracing), zod + TanStack Query ~20, tailwind-merge ~10, DOMPurify ~10.
Changements : Sentry chargé à la demande (`src/lib/sentry-client.ts`, après `load` ou à la
première erreur, erreurs précoces conservées) ; DOMPurify sorti de `utils/readings.ts`.
Les ~18 Ko « chargés ensuite » avant (formulaire de contact, react-hook-form) sont le
préchargement de `/pour-les-paroisses` par Next, pas le premier affichage.

Le budget « landing » de 150 Ko reste hors d'atteinte sans retirer React/Next (~130 Ko à eux
seuls). Pistes suivantes : ne plus embarquer les schémas zod côté client des blocs hydratés
depuis le serveur (données déjà validées au rendu), désactiver le tracing Sentry (−~25 Ko du
chunk différé) si l'échantillonnage à 20 % n'est pas exploité.
