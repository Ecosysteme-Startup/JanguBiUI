# dons-analyse — tableaux de bord des dons (web)

Écrans : paroisse `/app/dons/analyse`, diocèse `/app/diocese/dons`, plateforme
`/app/plateforme/paiements`. Spec : `JanguBIMobileApp/docs/design/ECRANS-TABLEAU-DE-BORD-DONS.md`,
`etude-tableau-de-bord-dons/03-dataviz.md`, décisions validées du 27/09 (`docs/PLAN-SUITE-V2.md` §1).

## Contrat d'API supposé (à aligner avec le lot backend A2)

Écrit côté web faute de `API-DONS-ANALYSE.md` au moment du lot ; les schémas Zod de `api/` font foi.

### `GET /api/v1/staff/dons/analyse/`
Paramètres : `portee=paroisse|diocese`, `granularite=semaine|mois|trimestre|annee`,
`date=AAAA-MM`, filtres facultatifs `fonds`, `canal`, `lieu`, `doyenne`, `node` (UUID ; facultatif
si le compte n'a qu'un nœud pour la capacité).

- `portee=paroisse` — capacité `dons.voir_fonds` sur la paroisse elle-même. Montants exacts.
  `collecte`, `par_fonds[]` (`type` ∈ quete_dominicale, quete_imperee, campagne,
  contribution_annuelle, autres), `par_semaine[]` (`valeurs` par type), `par_canal[]` /
  `par_moyen[]` / `par_lieu[]` (ordre canonique fixe, `niveau` 0/1, `non_renseigne`),
  `paiements`, `tresorerie`, `campagnes[]` (cumul mensuel, rythme, projection),
  `a_traiter[]` (`type`, `titre`, **`echeance` ISO**, `detail`), `notes`. Aucun nom de donateur.
- `portee=diocese` — capacité `dons.voir_agregats`. **Arrondi au millier** des montants de
  collecte (le client réapplique l'arrondi), **sans** seuil k = 5 ni règle de dominance.
  Quête impérée et comptes de trésorerie (`compte_marchand`, `compte_liaison`) au franc près.
  `paroisses[]` avec `statut`, `collecte`, `part_en_ligne`, `quetes_a_valider`, `evolution`
  (stable/hausse/baisse, texte neutre). `par_mois[]` + `premier_mois` (moins de 3 mois →
  « tendance indisponible »).

### `GET /api/v1/platform/dons/activite/`
Capacité `plateforme.admin`. Paramètres `granularite=semaine|mois`, `date`, `paroisse`, `moyen`,
`source`. **Aucun montant** : nombres, taux, délais (`paiements`, `par_jour`, `delai`,
`notifications`, `charge` 7 × 24, `sources`, `retours_ios`, `paroisses`, `incidents`). Le
schéma Zod est `strict()` : un champ inattendu (un montant) fait échouer l'analyse.

## Règles appliquées côté écran
- Ordre alphabétique des paroisses (`utils/ordre.ts`), seule la colonne Paroisse se trie ;
  aucun tri par montant, aucune barre comparant des paroisses, pas de vert/rouge de performance.
- « À traiter » trié par échéance (la plus proche en premier), échéance affichée.
- En-tête : phrase de synthèse + un chiffre-titre + barre de flux par fonds.
- Palette données fixe en variables CSS `--dv-*` (`src/styles/globals.css`), pastilles et
  marques seulement, jamais en couleur de texte ; toute figure a sa vue tableau.

## Mocks
`src/testing/mocks/handlers/dons-analyse.ts` (jeu de septembre). Comptes de démonstration du
serveur de mocks (`yarn run-mock-server`) : `cecile.coly@saint-dominique.sn` (paroisse),
`bernard.coly@archidiocese-dakar.sn` (diocèse), `moustoifa.ben@numerisen.sn` (plateforme).
