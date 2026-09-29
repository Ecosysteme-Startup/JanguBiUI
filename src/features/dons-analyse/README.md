# dons-analyse — tableaux de bord des dons (web)

Écrans : paroisse et diocèse `/espace/[nodeId]/dons/analyse`, plateforme
`/plateforme/paiements/activite`. Spec : `JanguBIMobileApp/docs/design/ECRANS-TABLEAU-DE-BORD-DONS.md`,
`etude-tableau-de-bord-dons/03-dataviz.md`, décisions validées du 27/09 (`docs/PLAN-SUITE-V2.md` §1).

## Contrat d'API

Source de vérité : backend `docs/API-DONS-ANALYSE.md` (lot A2) et `docs/TEMPS-REEL.md` §3.
Les schémas Zod de `api/` le reprennent champ pour champ ; les mocks
(`src/testing/mocks/handlers/dons-analyse.ts`) sont les exemples du contrat (§2.5, §2.6, §3.1).

- `GET /api/v1/staff/dons/analyse/?niveau=paroisse|diocese&noeud=<uuid>&periode=semaine|mois|trimestre|annee&date=…`
  (`date` : `2026-W39`, `2026-09`, `2026-T3`, `2026` ; absente pour la période en cours).
  Une seule forme de réponse (`AnalyseDons`) ; les blocs qui ne s'appliquent pas au niveau valent
  `null` (`paroisses` en paroisse ; `tresorerie`, `paiements`, `campagnes`, `par_fonds`, `par_lieu`
  au diocèse). Pas de semaine au-dessus de la paroisse.
- `GET /api/v1/me/capacites/` : le `noeud` vient de là (`dons.voir_fonds` sur la paroisse même,
  non hérité ; `dons.voir_agregats` sur un diocèse ou un doyenné). Sans nœud : « vue non ouverte ».
- `GET /api/v1/platform/dons/activite/?periode=&date=` : aucun montant ; schéma `strict()`, un
  champ inattendu fait échouer l'analyse.
- Flux SSE `GET /api/v1/staff/dons/flux/?noeud=<uuid>` (`hooks/use-flux-dons.ts`) :
  `@microsoft/fetch-event-source` avec `Authorization: Bearer`, reconnexion automatique (délai
  `retry:` du serveur, fin de flux à 30 min comprise), `last-event-id` repassé à la réouverture,
  rafraîchissement du jeton sur 401, flux fermé quand l'onglet est masqué. Chaque
  `dons.operation` / `dons.synthese_invalidee` invalide `['dons-analyse', niveau]`, regroupé
  (un rechargement par seconde au plus).

## Règles appliquées côté écran
- Ordre alphabétique des paroisses (`utils/ordre.ts`), seule la colonne Paroisse se trie ;
  aucun tri par montant, aucune barre comparant des paroisses, pas de vert/rouge de performance.
- « À traiter » trié par échéance (la plus proche en premier), échéance affichée ; à échéance
  égale, ordre du serveur.
- Au diocèse, le client réapplique l'arrondi au millier (`arrondirAgregats`), sauf la quête
  impérée (montants exacts, argent de la curie).
- En-tête : phrase de synthèse + un chiffre-titre + barre de flux par type de fonds.
- Palette données fixe en variables CSS `--dv-*` (`src/styles/globals.css`), pastilles et
  marques seulement, jamais en couleur de texte ; toute figure a sa vue tableau.

## Écarts avec l'ancien contrat supposé
Retirés faute de champ dans le contrat : filtres fonds / canal / lieu / doyenné, cumul mensuel
des campagnes (courbe), date de reversement, délai médian en paroisse, comptes marchand et de
liaison au diocèse, séries quotidiennes de délais et de notifications, retours iOS.

## Mocks
Comptes de démonstration du serveur de mocks (`yarn run-mock-server`) :
`cecile.coly@saint-dominique.sn` (paroisse), `bernard.coly@archidiocese-dakar.sn` (diocèse),
`moustoifa.ben@numerisen.sn` (plateforme).
