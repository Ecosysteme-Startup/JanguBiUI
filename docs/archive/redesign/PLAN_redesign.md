# PLAN_redesign.md — Refonte UI/UX JanguBiUI

> **Statut : PLAN — lecture seule, aucun code modifié.** Ce document est un livrable
> de revue. Rien n'est implémenté. On **garde les design tokens** existants
> (palette Sacred Editorial, Playfair/Inter, mesure de lecture 68ch, ombres douces) :
> la refonte porte sur la **composition, la navigation, la cohérence et le responsive**,
> pas sur la palette.
>
> Maquettes avant/après associées : `docs/redesign/mockups/` (4 écrans clés).
> Périmètre audité : `src/app`, `src/features`, `src/components` (Next.js 14 App Router).
>
> Toutes les affirmations sont sourcées `fichier:ligne`. Le code lu fait foi.

---

## 0. Synthèse exécutive

L'app est fonctionnellement riche (~40 routes, 21 features) et le design system
« Sacred Editorial » est en place et de bonne qualité (tokens, `Card`, `Button`,
`DataTable`, `PageHeader`, a11y partielle). **Les problèmes sont structurels et de
cohérence, pas esthétiques** :

1. **Le shell applicatif est recollé page par page** (`<AppShell>` importé dans chaque
   `page.tsx`), avec un drapeau `hideNav` qui **supprime la navigation** sur 4 routes
   clés (article, document détail, document/new, liturgie). → Expérience de navigation
   incohérente, routes « hors-shell ».
2. **Deux systèmes de boutons coexistent** : le composant `<Button>` partagé **et**
   ~75 `<button>` bruts re-stylés à la main (CTA pleine largeur `rounded-xl bg-primary…`
   dupliqué dans 12+ fichiers).
3. **La lecture d'article** existe mais reste sous-dimensionnée : titre dupliqué,
   typo trop petite, pas de fil d'Ariane, pas de contenu lié.
4. **L'agenda n'a pas de page détail** : les cartes ne sont pas cliquables, aucune
   route `/app/agenda/[id]`.
5. **Responsive** : grilles `grid-cols-4`/`grid-cols-3` sans repli mobile sur les
   dashboards, lignes de formulaire `flex gap-3` sans `flex-wrap`, une table admin
   en scroll horizontal, tailles de texte interactives < 12px.
6. **Placements à réserver** (à ne pas construire ici) : éditeur rich-text + preview
   (remplace le `<textarea>` de `article-form.tsx`) et dashboards analytiques par rôle
   (les APIs `get-*-dashboard` existent déjà mais ne sont pas exposées sur les hubs).

Le plan est **phasé et non big-bang** : 7 chantiers indépendants, chacun revue-able seul,
ordonnés par dépendance. La Phase 1 (shell + nav) est le keystone qui débloque les autres.

---

## 1. Inventaire des écrans

Légende **Shell** : `Shell` = `<AppShell>` complet · `hideNav` = nav supprimée ·
`AdminLayout` = `AdminPageLayout` · `seg-layout` = layout de segment ·
`standalone` = hors shell (pré-auth/onboarding).

### 1.1 Routes fidèle / commun

| Route | Fichier principal | Shell | Largeur contenu | En-tête | Problèmes saillants |
|---|---|---|---|---|---|
| `/app` (home) | `app/app/page.tsx` → `home/home-router.tsx` | Shell | varie selon rôle | varie | Routeur de dashboard par rôle (fidèle/prêtre/évêque/admin) |
| `/app/actus` | `news/articles-feed.tsx` | Shell | `2xl→3xl→5xl` | PageHeader | Filtres = `<button>` bruts ; `ArticleCard` mort (feed utilise `MediaCard`) ; scroll filtres sans indice |
| `/app/actus/[id]` | `news/article-detail.tsx` | **hideNav** | `2xl→3xl→5xl` mais prose `max-w-reading` | sticky custom | **Titre dupliqué** (barre + h1), `text-xl` faible, **pas de fil d'Ariane**, **pas de contenu lié**, nav supprimée |
| `/app/bible` | `bible/bible-content.tsx` | Shell | `max-w-3xl` fixe | PageHeader | `h-[400px]`/`h-[500px]` ScrollArea (piège de scroll), `style maxWidth:720px` inline, onglets serrés <360px, pas d'état d'erreur |
| `/app/chapelet` | `chapelet/chapelet-content.tsx` | Shell | `max-w-3xl` | PageHeader | `return null` si données absentes (écran blanc), `h-screen` loader chevauche bottom-nav |
| `/app/chapelet/communautaire` | `app/app/chapelet/communautaire/page.tsx` | Shell | `max-w-2xl` | PageHeader | Affiche `initiator_email` (PII), lien retour < 44px |
| `/app/spirituel` | `spirituel/spirituel-content.tsx` | Shell | `2xl→3xl→5xl` | PageHeader | `truncate` coupe descriptions sans tooltip |
| `/app/spirituel/liturgie` | `app/app/spirituel/liturgie/page.tsx` | **hideNav** | `max-w-lg` (le + étroit) | sticky custom | **Incohérent** avec `/heures` (qui garde la nav) ; en-tête maison ; prose vs sœur |
| `/app/spirituel/heures` | `app/app/spirituel/heures/page.tsx` | Shell | `2xl→3xl→5xl` | PageHeader | `office-selector` = 7 `<button>` sans `type`, prose `max-w-none` plein écran (mesure de lecture ignorée) |
| `/app/assistant` | `assistant/assistant-chat.tsx` | Shell | `max-w-2xl` | sticky custom | `h-dvh` + `pb-20` dupliqué → ~160px de vide bas mobile ; textarea non auto-resize ; pas de metadata |
| `/app/tv` | `tv/tv-content.tsx` | Shell | `max-w-6xl` (unique) | PageHeader | Pas d'état d'erreur ; badge live = `bg-destructive` (rouge=erreur) ; largeur unique dans l'app |
| `/app/documents` | `documents/documents-list.tsx` | Shell | `2xl→3xl→5xl` | PageHeader | Double conteneur (double padding), tabs sans rôles ARIA, pas de pagination, CTA vide = `<Link>` brut |
| `/app/documents/new` | `documents/new-document-form.tsx` | **hideNav** | `2xl→3xl→5xl` | sticky custom | Assistant 6 étapes ; **7 `<button>` bruts** ; lignes nom `flex gap-3` sans wrap ; back `size-8` (32px) ; barre de progression sans ARIA |
| `/app/documents/[id]` | `documents/document-detail.tsx` | **hideNav** | `2xl→3xl→5xl` | sticky custom | Back 32px ; erreur = `<p>` brut (pas de retry) ; pas d'historique des compléments |
| `/app/intentions` | `app/app/intentions/page.tsx` | Shell | `2xl→3xl→5xl` | PageHeader | Liste masquée quand form ouvert ; `pretre_email` (PII) ; `new Date(proposed_date)` non gardé ; pas d'annulation |
| `/app/dons` | `app/app/dons/page.tsx` | Shell | `2xl→3xl` (étroit) | PageHeader | `isError` non géré ; loader = `<p>Chargement…</p>` ; cartes campagne = `<button>` bruts ; `<select>`/`<input>` ~36px (< 44px) |
| `/app/transfert` | `transfert-paroissial/transfer-request-form.tsx` | Shell | `max-w-2xl` (pas de `lg:`) | PageHeader + action | Largeur figée 2xl ; pas d'annulation d'une demande `pending` ; lien retour discret |
| `/app/profil` | `profil/profil-content.tsx` | Shell | `2xl→3xl→5xl` | **aucun PageHeader** (header gradient maison) | **6 `<button>` bruts** ; suppression de compte inline (pas de modale) ; nom `flex gap-3` ; pas de toggle mot de passe |
| `/onboarding` | `app/onboarding/page.tsx` | standalone | `max-w-md` | — | `return null` flash ; `<Button>` sans `isLoading` (spinner manquant) ; pas d'état d'erreur ; pas de safe-area |
| `/accept-invitation` | `app/accept-invitation/*` | standalone | `max-w-md` | — | Spinner remplace le label (a11y) ; pas d'expiration affichée ; `min-h-screen` au lieu de `dvh` |
| `/app/messages` `/new` `/[id]` | `seg-layout` (`messages/layout.tsx`) | seg Shell | 2 colonnes `md:w-80` + flex-1 | sticky custom | `h-[calc(100dvh-0px)]` (placeholder), `sticky top-[57px]` codé en dur, `ConversationList` monté 2× mobile, send = `<button>` brut |

### 1.2 Routes clergé

| Route | Fichier | Shell | Largeur | Problèmes |
|---|---|---|---|---|
| `/app/clerge` | `app/app/clerge/page.tsx` | Shell+PageHeader | `2xl→3xl→5xl` | Garde `useEffect`+`return null` (pas `RoleGuard`) → flash blanc ; pas de back ; pas de badges de comptage |
| `/app/clerge/intentions` | `app/app/clerge/intentions/page.tsx` | Shell+PageHeader | `2xl→3xl→5xl` | Pas de pagination ; sous-form date `w-auto` s'effondre mobile ; pas de filtre statut |
| `/app/clerge/messages` | `app/app/clerge/messages/page.tsx` | Shell+PageHeader | full (pas de `max-w`) | Tabs ARIA OK mais non issus du primitive `Tabs` ; `max-w-2xl` seulement desktop ; pas de badge non-lus |
| `/app/clerge/transferts` | `transfert-paroissial/admin-transfer-list.tsx` | Shell+PageHeader | `max-w-3xl` (incohérent) | Noms paroisses `truncate` × 2 ; pas de filtre statut ; pas de back |

### 1.3 Routes admin (la plupart via `AdminPageLayout`)

| Route | Fichier | Shell | Problèmes |
|---|---|---|---|
| `/app/admin` | `app/app/admin/page.tsx` | AdminLayout | Tuiles `text-[11px]` ; **aucun comptage live** (gros manque) ; pas d'indication des restrictions par rôle |
| `/app/admin/users` | `app/app/admin/users/page.tsx` | AdminLayout + DataTable | Pas de recherche ; avatar `hidden md:flex` laisse un gap ; pas de lien vers invitations |
| `/app/admin/users/validation` | `users/pending-clergy-list.tsx` | AdminLayout | Cul-de-sac (pas de back) ; pas de date de soumission |
| `/app/admin/users/invite` | `clergy-accounts/invitation-form.tsx` | AdminLayout | `<Spinner>` au lieu de `isLoading` ; pas de back ; option `""` invalide d'emblée |
| `/app/admin/users/invitations` | `clergy-accounts/invitation-list.tsx` | AdminLayout + DataTable | 2 boutons header écrasent le titre <375px ; pas de filtre statut |
| `/app/admin/org` | `app/app/admin/org/page.tsx` + `components/org/*` | AdminLayout + DataTable | `<input search>` brut (pas `Input`) ; boutons diocèse `<button>` ad-hoc ; pas d'indice « lecture seule » |
| `/app/admin/articles` | `news/admin-article-list.tsx` | **Shell brut** (pas AdminLayout) | **`<table>` brut en scroll horizontal mobile** (6 colonnes ~700px) ; filtres `<button>` bruts ; `<Link><Button>` imbriqués (HTML invalide) ; pas de pagination |
| `/app/admin/articles/new` `/[id]/edit` | `news/article-form.tsx` | Shell brut | `<input>/<select>/<textarea>` bruts ; **content = `<textarea rows=12>`** (pas de rich-text) ; expand/collapse sans transition |
| `/app/admin/documents` | `documents/admin-document-list.tsx` | Shell brut | 7 pills filtre `<button>` (3-4 rangées mobile) ; toolbar `AdminPageLayout` inutilisé ; pas de pagination |
| `/app/admin/tv` | `app/app/admin/tv/page.tsx` | AdminLayout + DataTable | Forms inline poussent la liste ; URL YouTube affichée sur carte mobile ; double `justify-end` badges |
| `/app/admin/agenda` | `agenda/event-form.tsx` | AdminLayout | `datetime-local` côte à côte ~160px mobile ; submit = `<button>` brut ; `inputClass` codé en dur ; empty = `<p>` |

### 1.4 Composants partagés clés (état)

| Composant | Fichier | État |
|---|---|---|
| `Button` | `components/ui/button/button.tsx` | Icône **toujours à gauche** (`mr-2`), enfants en `<span mx-2>` (double marge bizarre), pas d'`iconRight`, `size=default` = `h-9` (36px < 44px) |
| `Card` | `components/ui/card/card.tsx` | Bon (variants default/elevated/interactive/flat) mais **adopté dans 6 fichiers seulement** vs **65 divs `rounded-xl border bg-card` ad-hoc** |
| `PageHeader` | `components/layouts/page-header.tsx` | Utilisé ~46× ; mais **7 en-têtes sticky maison** le contournent (z-index/bg/blur divergents) ; pas de variante « back » |
| `DataTable` | `components/ui/data-table.tsx` | **Excellent** (table desktop → cartes mobile, `hideOnMobile`) ; ignoré par `AdminArticleList` |
| `AdminPageLayout` | `components/layouts/admin-page-layout.tsx` | Bon (Shell+PageHeader+RoleGuard+largeur) ; **adopté par 7/11 routes admin** seulement |
| `ContentLayout` | `components/layouts/content-layout.tsx` | **Code mort** (0 import) — `max-w-7xl` legacy |
| `ReadingSurface` | `components/ui/reading-surface.tsx` | Surface canonique 68ch ; **utilisée 1 seul endroit** (reading-view) |

---

## 2. Problèmes globaux (par point dur)

### Point 1 — App-shell & navigation
- **Cause racine** : `src/app/app/layout.tsx:23` ne fait que `return <>{children}</>`. Le shell
  n'est donc **pas** appliqué par le layout : chaque page importe `<AppShell>` (29 fichiers).
- 4 routes utilisent **`hideNav`** et perdent toute navigation : `actus/[id]:13`,
  `documents/[id]:15`, `documents/new:6`, `spirituel/liturgie:183`.
- 3 patterns d'en-tête concurrents : `PageHeader` (z-40, `bg-background-surface/90`),
  sticky maison détail (z-10, `bg-background/95`), sticky chat (z-40, autre bg).
- Nav fidèle : **9 items en sidebar** vs **6 en bottom-nav** → 3 cachés derrière « Plus »
  (`nav-config.ts:87,134,149`). Asymétrie desktop/mobile.
- **Aucun fil d'Ariane** nulle part ; pas de barre supérieure globale desktop (notifications/
  profil/thème sont en pied de sidebar).

### Point 2 — Lecture d'article
- Titre rendu **2×** : barre sticky `article-detail.tsx:84` + `<h1>` `:116`.
- `<h1 text-xl>` (`:116`) faible pour de l'éditorial ; corps en `prose prose-sm` (`:137`).
- Retour = `router.back()` only (`:64,78`) — pas de fil d'Ariane, comportement imprévisible.
- **Pas de contenu lié** (articles de la même paroisse/catégorie).
- Conteneur `lg:max-w-5xl` plus large que le corps `max-w-reading` → padding fantôme.

### Point 3 — Cohérence des composants / bouton unique
- ~**75 `<button>` bruts** re-stylés (concentrations : `new-document-form` 7,
  `profil-content` 6, `bible-books-tab` 5, `chat-window` 4, `event-card` 4…).
- **Système CTA parallèle** `flex w-full … rounded-xl bg-primary py-3 text-sm font-semibold`
  dupliqué dans 12+ fichiers (perd `isLoading`, `icon`, focus ring, `active:scale`).
- `<Button>` : icône uniquement à gauche, espacement `mr-2`/`mx-2` incohérent vs `gap-1.5`/
  `gap-2` ailleurs ; pas d'icône à droite ; taille par défaut < 44px.
- Primitives form (`Input`/`Select`/`Textarea`) contournées dans `article-form`,
  `event-form`, `invitation-form`, `org`, `profil`.

### Point 4 — Agenda
- **Aucune route détail** : pas de `/app/agenda/[id]`, pas de `paths.app.agenda.event`
  (`config/paths.ts:52`).
- `EventCard` (`agenda/event-card.tsx`) **n'est pas cliquable** : description `line-clamp-2`,
  inscription/suppression inline. Pas de page titre/description/date/lieu/inscription dédiée.
- **Dépendance backend** : l'API agenda n'expose que `get-events` (liste) — pas de
  `get-event(id)`. Détail = nouvel endpoint `GET /events/{id}/` **ou** lecture depuis le
  cache de liste (fallback).

### Point 5 — Responsive
- **Grilles sans repli mobile** : `pretre-dashboard.tsx:303` `grid-cols-4`,
  `eveque-dashboard.tsx:101` `grid-cols-3` → écrasement à 320–375px.
- **Lignes form `flex gap-3` sans `flex-wrap`** : `new-document-form` (étapes 2-3),
  `profil-content:207`, `event-form` datetime → champs ~130-160px sur petit mobile.
- **Table en overflow** : `admin-article-list.tsx:84` (la seule table non-`DataTable`).
- **Hauteurs fixes** : `bible-books-tab` `h-[400px]`/`h-[500px]` ; `style maxWidth:720px` inline.
- **Texte interactif < 12px** : bottom-nav `text-[10px]` (`:76,110`), confirm-delete
  `event-card:126` `text-[10px]`, labels dashboard `text-[11px]`.
- **Mesure de lecture ignorée** : `office-view.tsx` (5×) et `liturgie/page.tsx` (2×) en
  `prose max-w-none` plein écran.
- Outil existant : `qa-overflow.mjs` ne teste **que** `/app/documents` à 390px.

### Point 6 — Placements à réserver (NE PAS construire)
- **(a) Éditeur rich-text + preview** : remplace le `<textarea rows=12>` de
  `article-form.tsx:247` (routes `admin/articles/new` + `[id]/edit`). Le pipeline de rendu
  existe déjà (`article-detail.tsx:137` : `DOMPurify.sanitize` + `prose … max-w-reading`)
  et le composant `md-preview` est disponible → l'aperçu doit réutiliser **exactement** ce
  pipeline.
- **(b) Dashboards analytiques par rôle** : les APIs et sections existent déjà mais ne sont
  pas branchées sur les hubs — `dashboard/get-fidele-dashboard.ts`, `get-parish-dashboard.ts`,
  `get-diocese-dashboard.ts` + `fidele-summary-section`, `parish-stats-section`,
  `diocese-stats-section`. Points d'insertion : hub `/app/admin` (bandeau de stats au-dessus
  des tuiles), hub `/app/clerge` (badges de comptage sur tuiles), homes par rôle.

### Cross-cutting (états & a11y)
- États **erreur/vide/chargement incohérents** : `ErrorState`/`EmptyState`/`Skeleton`
  existent mais `dons`, `document-detail`, `chat-window`, `chapelet-content` les contournent.
- **Cibles tactiles < 44px** : back `size-8`, `<select>`/`<input>` `py-2`, liens texte nus.
- **Garde d'auth divergente** : `useEffect`+`return null` (clergé, articles, documents admin)
  vs `RoleGuard` (AdminPageLayout) → flash blanc sur les premières.

---

## 3. Plan phasé (non big-bang)

> Chaque phase est un **chantier indépendant, revue-able seul**. L'ordre suit les
> dépendances. Effort : **S** ≈ 1-2 j · **M** ≈ 3-5 j · **L** ≈ 1-2 sem (1 dev front).
> Risque évalué sur le rayon de blast + régressions visuelles.

---

### Phase 1 — Shell applicatif unifié & refonte navigation *(keystone)*

**Objectif.** Toutes les routes gardent la nav. Supprimer `hideNav` et le wrapping
`<AppShell>` page-par-page. Repenser l'IA de navigation (la nav actuelle ne plaît pas) :
sidebar desktop + barre supérieure (fil d'Ariane + notifications + profil) + bottom-nav
mobile cohérente + en-tête « détail » partagé (back).

**Sous-étapes (chacune revue-able).**
- **1A — Primitives de layout** (S/M) : `ContentContainer` (recette de largeur unique),
  `Breadcrumb`, `PageHeader` + variante `PageHeaderBack` (fusionne les 7 en-têtes maison),
  nouvelle IA nav (`nav-config.ts` : aligner sidebar ↔ bottom-nav, clarifier « Plus »).
  En Storybook, sans toucher les routes.
- **1B — Layout unique** (M) : `app/app/layout.tsx` enveloppe **tout** dans le shell ;
  migration des pages **cluster par cluster** (spirituel → fidèle workflow → clergé → admin),
  retrait de `<AppShell>` + `hideNav` par lot. Chaque lot = 1 PR revue-able.
- **1C — Barre supérieure + fil d'Ariane** (S) : barre contextuelle desktop, app-bar mobile
  (titre + back quand imbriqué + cloche), branchée sur `Breadcrumb`.

**Fichiers.** `app/app/layout.tsx` · `components/layouts/{app-shell,bottom-nav,page-header}.tsx`
· `config/nav-config.ts` · `components/layouts/admin-page-layout.tsx` ·
`app/app/messages/layout.tsx` · les 4 routes `hideNav` · les 29 `page.tsx` important `AppShell`
· nouveau `components/layouts/{content-container,breadcrumb,page-header-back}.tsx`.

**Effort : L.** **Risque : ÉLEVÉ** (touche toutes les routes ; `force-dynamic`, gardes, double-shell
transitoire). Mitigation : migration par lot, QA visuelle (`qa-shots.mjs`), tests vitest.
**Dépendances : aucune** (à faire en premier).
**Critères de revue.** Aucune route sans nav ; un seul en-tête ; fil d'Ariane sur routes
imbriquées ; sidebar ↔ bottom-nav cohérentes ; 247 tests verts ; build clean.

---

### Phase 2 — Consolidation design system *(bouton unique + Card + container)*

**Objectif.** Un seul composant bouton. Supprimer les systèmes parallèles.

**Scope.**
- Étendre `<Button>` : `iconPosition: 'left' | 'right'`, espacement par `gap-2` (retirer
  `mr-2`/`mx-2`), `size` atteignant 44px (mobile), option pleine largeur arrondie (`rounded-xl`)
  pour remplacer le CTA ad-hoc.
- Migrer les ~75 `<button>` bruts + le CTA parallèle (12+ fichiers) vers `<Button>`,
  **cluster par cluster**.
- Adopter `<Card>` à la place des 65 divs ad-hoc (priorité dashboards + reflexion-composer).
- `ContentContainer` (de 1A) appliqué partout ; **supprimer le code mort `ContentLayout`**.
- Unifier les primitives form (`Input`/`Select`/`Textarea`) dans `article-form`,
  `event-form`, `invitation-form`, `org`.

**Fichiers.** `components/ui/button/button.tsx` (+ stories/tests) · `components/ui/card/*` ·
`components/layouts/content-layout.tsx` (suppression) · ~30 fichiers feature (migration par lot).

**Effort : M/L** (mécanique mais volumineux). **Risque : MOYEN** (régressions visuelles ponctuelles).
**Dépendances : Phase 1** (API `Button`/`Container` figées d'abord).
**Critères.** 0 CTA ad-hoc restant (grep `rounded-xl bg-primary py-3`) ; tap targets ≥ 44px ;
`ContentLayout` supprimé ; stories à jour.

---

### Phase 3 — Expérience de lecture d'article *(point 2)*

**Objectif.** Lecture éditoriale : hiérarchie, fil d'Ariane, contenu lié.

**Scope.**
- Supprimer le titre dupliqué ; `<h1>` serif plus grand (`text-2xl md:text-3xl`),
  corps `prose` ≥ base, contraint à `max-w-reading`, conteneur aligné dessus.
- Fil d'Ariane « Actus › {catégorie} › {titre} » + back partagé (Phase 1C).
- Bloc méta auteur/date/portée/vues redessiné ; image de couverture éditoriale.
- **Section « À lire aussi »** (même paroisse/catégorie). *Dépendance backend* : endpoint
  ou paramètre « related » (sinon filtrer côté client depuis le feed).

**Fichiers.** `news/components/article-detail.tsx` · `news/api/get-article.ts`
(+ éventuel `get-related-articles.ts`) · réutilise `Breadcrumb`/`PageHeaderBack`.

**Effort : S/M.** **Risque : FAIBLE.** **Dépendances : Phase 1 (fil d'Ariane), Phase 2 (Button).**
**Critères.** Titre unique ; fil d'Ariane fonctionnel ; mesure de lecture respectée ;
section liée présente (même vide gracieusement) ; nav conservée.

---

### Phase 4 — Page détail d'événement (Agenda) *(point 4)*

**Objectif.** Cartes agenda cliquables → page détail accessible au fidèle.

**Scope.**
- Nouvelle route `/app/agenda/[id]` + `paths.app.agenda.event`.
- `EventCard` devient un `<Link>` (corps cliquable) **tout en gardant** l'inscription rapide
  inline (ne pas régresser).
- `EventDetail` : titre, description complète (pas de `line-clamp`), date/heure, lieu (carte/
  adresse), type, jauge d'inscrits, **inscription/désinscription** ; fil d'Ariane « Agenda › {titre} ».
- **Dépendance backend** : `GET /events/{id}/` (sinon fallback : hydratation depuis le cache
  react-query de la liste + skeleton).

**Fichiers.** nouveau `app/app/agenda/[id]/page.tsx` · `agenda/components/event-detail.tsx` ·
`agenda/api/get-event.ts` (nouveau) · `agenda/components/event-card.tsx` (rendre cliquable) ·
`config/paths.ts`.

**Effort : M.** **Risque : MOYEN** (dépendance endpoint ; ne pas casser l'inscription inline).
**Dépendances : Phase 1, Phase 2.**
**Critères.** Carte → détail ; inscription fonctionne depuis carte ET détail ; accessible fidèle ;
responsive ; états vide/erreur/chargement.

---

### Phase 5 — Durcissement responsive *(point 5)*

**Objectif.** Mobile/tablette/desktop sans débordement ni texte sous-dimensionné.

**Scope.**
- Grilles : `grid-cols-4` → `grid-cols-2 sm:grid-cols-4` ; `grid-cols-3` → `grid-cols-2 sm:grid-cols-3`
  (dashboards prêtre/évêque).
- Lignes form : `flex gap-3` → `grid grid-cols-1 sm:grid-cols-2` (documents, profil, event-form).
- `admin-article-list` → `DataTable` (`hideOnMobile` sur catégorie/date).
- Retirer hauteurs fixes (`bible-books-tab` `h-[…px]`, `style maxWidth:720px` → tokens).
- Texte interactif/nav ≥ `text-xs` (bottom-nav, confirm-delete, labels dashboard).
- `prose max-w-none` → `max-w-reading`/`ReadingSurface` (liturgie, heures).
- Étendre `qa-overflow.mjs` à agenda/bible/dashboards/article (390px **et** 320px).

**Fichiers.** `home/{pretre,eveque}-dashboard.tsx` · `documents/new-document-form.tsx` ·
`profil/profil-content.tsx` · `agenda/event-form.tsx` · `news/admin-article-list.tsx` ·
`bible/bible-books-tab.tsx` · `bottom-nav.tsx` · `spirituel/liturgie-heures/office-view.tsx` ·
`spirituel/liturgie/page.tsx` · `qa-overflow.mjs`.

**Effort : M.** **Risque : MOYEN** (large mais localisé). **Dépendances : Phase 1, 2.**
**Critères.** 0 overflow à 320/390px sur routes cibles ; tap targets ≥ 44px ; texte ≥ 12px ;
mesure de lecture appliquée au long-form.

---

### Phase 6 — Placements *(point 6 — réserver, NE PAS construire)*

**Objectif.** Définir précisément **où** s'insèrent les 2 gros chantiers futurs, avec slots
non-fonctionnels (squelettes), sans build complet.

**Scope.**
- **6A — Éditeur rich-text + preview** : réserver la zone « Contenu » de `article-form.tsx`
  (remplace `<textarea rows=12>` `:247`). Layout cible : éditeur (gauche/haut) + aperçu live
  (droite/bas) réutilisant `DOMPurify` + `prose … max-w-reading` (= pipeline `article-detail`).
  Choix de lib (Tiptap/Lexical/MDX) à trancher en chantier dédié. Ici : seulement le slot + le
  contrat d'API (HTML sanitizé en sortie) + un toggle Édition/Aperçu placeholder.
- **6B — Dashboards analytiques par rôle** : réserver un slot `AnalyticsStrip` en haut de
  `/app/admin` (bandeau de stats), badges de comptage sur tuiles `/app/clerge`, et brancher les
  sections existantes (`*-stats-section`) aux homes par rôle. Squelettes alimentés par les APIs
  `get-*-dashboard` **déjà existantes**.

**Fichiers (slots).** `news/components/article-form.tsx` · `app/app/admin/page.tsx` ·
`app/app/clerge/page.tsx` · `features/dashboard/components/*` (réutilisation) ·
nouveau `features/dashboard/components/analytics-strip.tsx` (squelette).

**Effort : S** (placement). **Risque : FAIBLE.** **Dépendances : Phase 1, 2.**
**Critères.** Slots visibles (placeholders) aux bons endroits ; contrats d'API documentés ;
aucun build d'éditeur/charts engagé (chantiers séparés référencés).

---

### Phase 7 — Cohérence des états & polish a11y

**Objectif.** Uniformiser erreur/vide/chargement et finir l'accessibilité.

**Scope.**
- Adopter `ErrorState`(+retry)/`EmptyState`/`Skeleton` partout (dons, document-detail,
  chat-window, chapelet-content, tv, bible-today).
- Consolider les gardes : `ClergePageLayout` miroir d'`AdminPageLayout` (supprime le flash
  `return null` clergé) ; finir l'adoption `AdminPageLayout` (articles/documents).
- ARIA : `role=tablist/tab` (documents tabs), `role=progressbar` (assistant docs),
  focus-visible sur tuiles, `aria-pressed` sur sélecteurs ; masquage PII (emails →
  nom/initiales) sur intentions/chapelet communautaire.

**Fichiers.** features ci-dessus · nouveau `components/layouts/clerge-page-layout.tsx` ·
`app/app/admin/{articles,documents}/*`.

**Effort : M.** **Risque : FAIBLE/MOYEN.** **Dépendances : Phase 1, 2.**
**Critères.** Tous les écrans data ont les 3 états ; pas de flash blanc clergé ; pas de PII brute ;
audit axe/lighthouse a11y sans régression.

---

## 4. Graphe de dépendances & ordonnancement

```
Phase 1 (shell + nav)  ──┬──► Phase 2 (design system)
                         │         │
                         │         ├──► Phase 3 (article)
                         │         ├──► Phase 4 (agenda détail)
                         │         ├──► Phase 5 (responsive)
                         │         ├──► Phase 6 (placements)
                         │         └──► Phase 7 (états/a11y)
                         └──► (fil d'Ariane utilisé par 3 & 4)
```

- **Critique en premier** : Phase 1 puis Phase 2 (débloquent tout).
- **Parallélisables après P1+P2** : 3, 4, 5, 6, 7 sont indépendantes entre elles
  (peuvent être assignées à des PR distinctes).
- **Dépendances backend à confirmer** : article « related » (P3), `GET /events/{id}` (P4).

## 5. Ce qu'on NE touche pas
- La **palette / les tokens** (`globals.css`, `tailwind.config.cjs`) — conservés tels quels.
- L'architecture Bulletproof React (features, imports unidirectionnels, pas de barrel).
- Le pipeline API (axios unique, react-query, Zod) et l'auth.
- La landing (`features/landing/*`, dark forcé) — hors périmètre app.

## 6. Risques transverses
- **Phase 1 = rayon de blast maximal.** Migrer par lot, garder le build vert à chaque lot.
- **Régressions visuelles** : capturer une baseline `qa-shots.mjs` avant Phase 1, comparer après.
- **`force-dynamic`** sur `app/app/layout.tsx` à préserver lors du passage au layout unique.
- **Tap targets** : `<Button size=default>`=36px ; tout passage au composant doit forcer 44px mobile.
```
