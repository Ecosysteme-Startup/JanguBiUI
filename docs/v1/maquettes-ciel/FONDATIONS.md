# Fondations « Ciel produit » — jetons, classes, primitives, coquilles

Référence pour refaire les écrans sur la maquette `docs/v1/maquettes-ciel/` (design system :
`WEB-Design-System.dc.html`, sombre : `Sombre-WEB-Design-System.dc.html`). Tout est en place dans
`src/styles/tokens.css` (copie : `docs/v1/design/tokens.css`), `tailwind.config.cjs`, `src/utils/cn.ts`,
`src/components/ui/*`, `src/components/layouts/*`.

**Règle d'or** : aucune couleur en dur, aucune taille `text-[..px]`. Une valeur de maquette = une classe
ci-dessous. Si une valeur manque, la déposer dans `demandes-fondations/<lot>.md`.

---

## 1. Jetons de couleur (`--jb-*`) et classes Tailwind

Le sombre est le remappage exact des maquettes `Sombre-WEB-*`, propriété par propriété (un même
hex clair peut donner deux valeurs sombres selon qu'il sert de texte ou de fond : d'où les paires
`primary` / `primary-fill`, `tint-200` / `line-active`, `err` / `err-fill`). **Toujours choisir le jeton
selon l'usage**, pas selon le hex clair.

| Jeton / classe | Clair | Sombre | Usage |
|---|---|---|---|
| `paper` | #FFFFFF | #0B1118 | fond de page, cartes, champs `lg`/`sm` |
| `surface` | #F7FAFD | #111A24 | barre latérale, pied de page, survol de rangée, champs `md`, en-tête de table |
| `surface-2` | #EDF3F9 | #18232F | bouton secondaire, piste segmentée, squelette, désactivé, étiquette |
| `line` | #DDE5EE | #243142 | bordures de carte, séparateurs, bouton contour |
| `line-field` | #8391A4 | #5F7085 | bordure de champ, case, radio, interrupteur éteint |
| `line-active` | #B3D8F0 | #26618F | survol de carte (`hover:border-line-active`), filet actif, étape franchie |
| `line-strong` | #0E1A2B | #C7D2DE | filet d'encre (rare) |
| `ink` | #0E1A2B | #E8EEF5 | texte, icônes |
| `ink-2` | #3A4859 | #BAC6D3 | texte secondaire, liens de pied de page |
| `ink-3` | #586677 | #92A2B4 | méta, aides, placeholders, icônes de nav |
| `ink-4` | #8391A4 | #92A2B4 | texte désactivé |
| `primary` | #0A6BA3 | #7CC3EE | **texte/filet** primaire : liens, onglet actif, icône active |
| `primary-strong` | #085887 | #A8D8F5 | survol de lien, icône sur `tint-100` |
| `primary-fill` | #0A6BA3 | #0A6BA3 | **aplat** : bouton primaire, compteur non lu, jour choisi, piste de progression |
| `primary-fill-hover` | #085887 | #085E90 | survol de l'aplat |
| `on-primary` | #FFFFFF | #F5F9FC | texte sur `primary-fill` |
| `tint-50` (b50) | #EEF6FC | #0F2233 | nav active, badge info, alerte info, sélection de rangée |
| `tint-100` (b100) | #D9EBF7 | #13304A | avatar, compteur neutre, pilule cumulable active |
| `tint-200` (b200, aplat) | #B3D8F0 | #1B4466 | barre claire de graphique, créneau pris |
| `tint-300` (b300) | #7FC0E8 | #26618F | illustration |
| `tint-400` (b400) | #3FA3DD | #3FA3DD | points |
| `tint-500` (b500) | #1A8FCC | #5AB3E4 | accent |
| `tint-800` (b800) | #06466C | #7CC3EE | texte sur b50 / b100 (nav active, badges, avatar) |
| `tint-900` (b900) | #052F49 | #A8D8F5 | texte d'alerte info, pilule cumulable |
| `inverse` | #0E1A2B | #3A4757 | aplat d'encre : pilule de filtre active, toast, infobulle |
| `on-inverse` | #FFFFFF | #F5F9FC | texte sur `inverse` |
| `on-inverse-muted` | #B3D8F0 | #B3D8F0 | compteur de pilule active, icône de toast, lien « Suivre » d'un toast |
| `ok` / `ok-bg` / `ok-dot` | #1F6B5C / #E4F2EE / #1F6B5C | #7CCBB6 / #13302A / #3E9E88 | succès (texte / fond / point) |
| `warn` / `warn-bg` / `warn-dot` | #8A5A0B / #FBF1DF / #B7801F | #E6B865 / #342710 / #D49B36 | attention, délai en retard |
| `err` / `err-bg` | #A12A22 / #FBE8E5 | #F2958B / #3B1815 | erreur (texte / fond), bouton destructif |
| `err-line` / `err-fill` | #A12A22 / #A12A22 | #E0776C / #B8392F | bordure de champ en erreur / point ou aplat d'erreur |
| `lit-green` `lit-red` `lit-violet` | #2E6B3F #A3262A #5B3A7E | #4F9B63 #C4463F #8B66B6 | pastilles liturgiques (jamais en aplat) |
| `lit-gold` / `lit-white` | #9A7A2C / #FEFEFE | #C9A55A / #FEFEFE | « Blanc » : classe `.lit-dot-white` (cercle blanc cerclé d'or) |
| `scrim` (`bg-scrim`) | rgba(14,26,43,.40) | rgba(0,0,0,.62) | voile des dialogues et tiroirs |
| `night`, `night-2`, `on-night*`, `lit-rose*`, `lit-gold-text` | — | — | anciens écrans ; ne plus employer |

Ombres : `shadow-card` (0 1px 2px .06 / .18 en sombre), `shadow-menu` (0 8px 24px .10 / .30) —
menus, toasts, dialogues. `shadow-modal` = alias de `shadow-menu`.

## 2. Typographie

- **Libre Franklin** (`font-sans`, défaut) : toute l'interface, 400/500/600 (700 rare).
- **Source Serif 4** (`font-serif`) : uniquement le texte de la Parole, les citations bibliques et le logotype.
- Titres : 600, une seule couleur, jamais d'italique ni de mot coloré, jamais « 01 — ».
- Échelle : le nom de la classe est la taille en px (valeur en rem, interligne de la maquette) :

| Classe | Taille/interligne | Usage (maquette) |
|---|---|---|
| `text-11` | 11/16 | initiales d'avatar 24 |
| `text-12` | 12/16 | badges, compteurs, Kbd, « Paroisse suivie » |
| `text-13` | 13/18 | méta, aides, erreurs de champ, légendes, en-tête de table |
| `text-14` | 14/20 | secondaire, rangées de table, menus, alertes, libellés de champ |
| `text-15` | 15/22 | boutons md, nav latérale, onglets md, texte de dialogue |
| `text-16` | 16/24 | corps, champs, boutons lg/xl, onglets lg |
| `text-17` | 17/24 | titre de carte |
| `text-18` | 18/28 | titre de dialogue, chapô public, citation biblique (serif italique) |
| `text-20` | 20/28 | sous-section, titre d'encart, texte de la Parole (serif, `leading-8`) |
| `text-22` | 22/28 | logotype d'en-tête |
| `text-24` | 24/32 | section, titre de lecture |
| `text-28` | 28/36 | logotype de connexion |
| `text-32` | 32/40 | **titre de page app** |
| `text-40` | 40/48 | **titre de page publique** |
| `text-48`, `text-56` | 48/56, 56/64 | accueil public |

Ajuster l'interligne quand la maquette diffère : `leading-[26px]`, `leading-5`… Chiffres :
`tnum` (heures, dates, références). Les anciens noms (`text-meta`, `text-body`, `text-h2`…) sont
rabattus sur cette échelle mais **à ne plus employer**.

## 3. Rayons, espacements, largeurs

- Rayons : `rounded-3` (pastille de légende), `rounded-6` (case), `rounded-8` (petit, rangée de menu),
  `rounded-9` (segment), `rounded-10` (nav, bouton sm, icône), `rounded-12` (champ, bouton, alerte, menu),
  `rounded-14` (tuile de jour), `rounded-16` (carte, dialogue), `rounded-full` (pilule).
  `rounded` seul = 10 px.
- Rythme 8 : 4, 8, 12, 16, 24, 32, 48, 96 (`gap-1`…`gap-24`). Hauteurs utiles : `h-8` 32, `h-9` 36,
  `h-10` 40, `h-11` 44, `h-12` 48, `h-13` 52, `h-15` 60, `h-16` 64, `h-18` 72.
- Largeurs : `max-w-content` (1120, contenu app), `max-w-public` (1200), `max-w-parole` (680, colonne de
  la Parole), `.jb-container` (1200 centré + gouttière 16 px : pages publiques et inscription).

## 4. Icônes

`<Icon name="…" size={20} />` : Lucide, trait 1,75 (`ICON_STROKE`), `currentColor`, décorative sauf
`label`. Noms français stables (`accueil`, `parole`, `bible`, `paroisse`, `diocese`, `annonce`,
`calendrier`, `calendrier-horloge`, `document`, `message`, `cloche`, `recherche`, `reglages`,
`utilisateurs`, `utilisateur-ok`, `structure`, `aujourdhui`, `tableau-de-bord`, `historique`,
`plus-vertical`, `plus-horizontal`, `copier`, `partager`, `imprimer`, `taille-texte`, `ecouter`,
`lecture`, `itineraire`, `epingle`, `signet`, `trombone`, `erreur`, `succes`, `alerte`, `info`, `aide`,
`chargement`, `cadenas`, `oeil`, `chevrons-haut-bas`, `fleche-*`, `chevron-*`…, liste complète :
`ICON_NAMES`) ; `chapelet` et `confession` sont dessinés maison. Tailles des maquettes : 16, 18, 20, 22.

## 5. Primitives (`src/components/ui/`, importer le fichier, pas de barrel)

| Composant | Props clés | Rendu maquette |
|---|---|---|
| `Button` (`button.tsx`) | `variant` : `primary` \| `secondary` \| `outline` \| `ghost` \| `danger` (anciens : `tertiary`→ghost, `night`→outline) ; `size` : `xl` 52 \| `lg` 48 \| `md` 40 (défaut) \| `sm` 32 ; `block`, `loading`, `asChild` | 15/600 (16 en lg/xl, 14 en sm), rayon 12 (10 en sm), cible 44 via `hit` ; `buttonVariants()` pour un lien |
| `IconButton` | `icon`, `label` (obligatoire), `bordered`, `size` md 40 / sm 32, `dot` | nu rayon 10 survol surface2 ; bordé rayon 12 ; `iconButtonClasses()`, `UnreadDot` |
| `Field` (`field.tsx`) | `id`, `label`, `optional` (« (facultatif) »), `required` (lecteur d'écran), `labelAside`, `hint`, `error`, `success`, `counter` | libellé 14/500, aide/erreur 13 avec icône |
| `Input` | `controlSize` : `lg` 52 fond paper (public, défaut) \| `md` 48 fond surface (fidèle) \| `sm` 44 fond paper (back-office) ; `icon`, `trailing`, `valid` | rayon 12, bordure line-field, focus b600 2 px, erreur 2 px |
| `Kbd` (`input.tsx`) | — | « Ctrl K », « Échap » |
| `Select`, `Textarea` | `controlSize` | select natif + chevrons ; textarea 92 min |
| `Choice` | `type` checkbox/radio, `label`, `description`, `variant` `plain` \| `card` | case 20 rayon 6 ; radio anneau 6 ; carte : b600 2 px sur b50 |
| `Switch` | `checked`, `onCheckedChange`, `label`, `description` | 40 × 24 |
| `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `TabLinks` | `size` md (15, écart 24, back-office) \| lg (16, écart 32, Parole) ; `count` | soulignement b600 2 px, 44 px |
| `SegmentedControl` (radiogroup), `SegmentedLinks` (navigation) | `size` xs 32 \| sm 36/14 \| md 34/14 \| lg 36/15 ; `block` (largeurs égales) ; `counts` / `items[].count` | piste surface2 rayon 12, segment choisi paper + ombre carte |
| `Chip`, `ChipGroup` | `pressed`, `count`, `tone` `ink` (exclusif) \| `tint` (cumulable, coche) | pilule 36, 14 |
| `Badge`, `Tag`, `CountBadge`, `DelayBadge` (`badge.tsx`) | `Badge tone` neutral/info/warn/ok/err/muted + `dot`/`icon` ; `CountBadge tone` neutral/unread + `label` ; `DelayBadge days late` | pilule 24 12/600 ; compteur 22 |
| `LiturgicalPill`, `LiturgicalDot` (`badge.tsx`) | `color` : vert/rouge/violet/blanc/rose ; `size` 6/8/10 | pastille 26 fond paper |
| `StatusDot` (`signature/status-dot.tsx`) | `status` (7 statuts d'acte) ou `tone` + `label` | badge de statut (point ; « Retirée » : coche) |
| `Card`, `cardClasses()`, `CardHeader` (`card.tsx`) | `as`, `interactive` (survol b200), `tone` paper/surface, `padding` none/sm 16/md 20/lg 24 ; `CardHeader size` md 20 \| aside 18/26 \| sm 17, `action`, `description` | rayon 16, bordure line, ombre carte |
| `Notice` | `tone` info/ok/warn/err, `title`, `children`, `role`, `action` | aplat rayon 12, 14/20 |
| `EmptyState` | `icon` (défaut `boite`), `title`, `children`, `action`, `align` center/start, `tone` | pastille 48, 16/600, une action |
| `Skeleton`, `SkeletonLine`, `LoadingBlock`, `Progress` (`skeleton.tsx`) | — | surface2 ; piste 6 px |
| `Modal`, `ConfirmDialog` | `size` md 480 \| lg 720, `footer` ; `tone` danger | rayon 16, voile scrim, titre 18/600, actions à droite |
| `Toaster`, `toast.ok/err/info` | — | aplat d'encre (erreur : fond paper), 5 s |
| `Table`, `Th`, `Tr`, `Td`, `TableSelectionBar` | `framed`, `Th sort`, `Tr selected` | en-tête 44 surface 13/500, rangées 60, sélection b50 |
| `Pagination` | `offset`, `limit`, `total`, `onChange`, `noun` (« Demandes 1 à 6 sur 17 ») | cases 36 rayon 10, courante b50/b800 |
| `PageHeader` | `title`, `description`, `eyebrow` (+ `eyebrowTone` primary), `actions`, `size` app 32 \| public 40, `compact` (phrase à 4 px) | pas de numéro |
| `SectionHeading`, `Meta` | `size` lg 24 \| md 20, `aside` | |
| `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuSeparator`, `MenuLabel` (`menu.tsx`) | `MenuItem icon shortcut tone="danger" asChild` | rayon 12, rangées 36, ombre menu |
| `Tooltip` | `content` | fond encre 13/18, 300 ms |
| `Breadcrumbs` | `items: {label, href?}[]`, `separator` chevron \| slash | 14, courante 600 |
| `Avatar` | `name`, `size` 24–48 | initiales b800 sur b100 |
| `ConfessionNotice` (`signature/`) | `variant` card \| pinned, `audience` fidele \| pretre, `bookingHref`, `description`, `actionLabel` | voir lot D |
| `TreeView` (`signature/`) | `TreeNode.icon`, `meta`, `hint` | rangées 36/32 rayon 8, retrait 20 |

## 6. Coquilles (`src/components/layouts/`)

| Coquille | Où | Composition |
|---|---|---|
| `PublicShell` | `app/(public)/layout.tsx`, 404 | `PublicHeader` 72 px (logotype, La Parole du jour · Paroisses · Pour les paroisses · Aide, page courante sur surface ; « Se connecter » contour, « Créer un compte » primaire ; menu sous 1024) ; **`<main>` pleine largeur sans padding** : la page pose `jb-container` et ses marges ; `PublicFooter` (surface, 4 colonnes, mentions, bascule d'affichage). |
| `FideleShell` | `app/app/layout.tsx` | `AppFrame` + `FideleSidebar` : logotype, `QuickSearch` (Ctrl K), 5 rubriques (Bible/Chapelet actives sous « La Parole », confession sous « Parler à un prêtre »), carte « Paroisse suivie », carte utilisateur + `UserMenu` (profil, affichage clair/sombre, déconnexion). Barre supérieure : date du jour. Sous 1024 : tiroir « Menu » + `BottomNav`. |
| `BackofficeShell` | `espace/[nodeId]`, `plateforme` | `AppFrame` + `BackofficeSidebar` : `NodeContextSwitcher` (232 × 56), onglets de niveau si plusieurs, rubriques par capacités (`config/nav.ts`, groupes séparés d'un filet), identité + office + `UserMenu`, « Revenir à mon espace fidèle ». Barre supérieure : « Nœud · Rattachement ». |
| `AuthShell` | parcours d'inscription (`/bienvenue`) | en-tête 72 (logotype + `headerAction`, défaut « Déjà un compte ? Se connecter ») ; `<main class="jb-container pt-8 pb-12">` ; `AuthFooter` 64 px. `aside` optionnel (panneau surface 624 px). |
| `CenteredShell` | erreurs hors coquille (`ErrorScreen`) | fond surface, logotype 40, carte 440 (WEB-Connexion). |

`AppFrame` : colonne 264 (surface, filet droit, collante), barre 64 (`px-10`, filet bas),
`<main id="contenu">` = `max-w-content px-10 pt-8 pb-12` (mobile `px-4 pt-6 pb-24`).

**Emplacements pour les pages** (`shell-slots.tsx`) :

```tsx
import { ShellLayout, TopbarContent } from '@/components/layouts/shell-slots';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

<TopbarContent
  start={<Breadcrumbs items={[{ label: 'Mes demandes', href: paths.app.demandes.list.getHref() }, { label: 'JB-2026-00412' }]} />}
  end={<NextLink href={…} className="text-15 font-semibold">Mes rendez-vous</NextLink>}
/>
<ShellLayout fullBleed />            {/* messagerie : ni padding ni largeur max, hauteur 100dvh − 64 */}
<ShellLayout fullBleed hideTopbar /> {/* FID-Conversation : sans barre supérieure (≥ lg) */}
```

Sans `start`, la barre garde son texte par défaut. `TopbarText` donne le style 14 ink3.

## 7. Vérification visuelle

Harnais `e2e/visuel/` (voir son README) : pour chaque écran, capture de l'app en clair et en sombre
(1440 × 900, pleine page) à côté de la maquette, avec carte des différences.

```bash
export KC_DEMO_PASSWORD=…   # clé KC_DEMO_PASSWORD de ../JanguBi/.env, jamais versionnée
npx tsx e2e/visuel/capture.ts WEB-FID-Parole            # registre e2e/visuel/ecrans.ts
npx tsx e2e/visuel/capture.ts --route /app/x --compte fidele --maquette WEB-FID-…
# → e2e/visuel/resultats/<maquette>/comparaison-{clair,sombre}.png (lire avec Read)
```

Méthode : 1) lire le HTML de la maquette (`*.dc.html`, valeurs px exactes) ; 2) coder avec les classes
ci-dessus ; 3) capturer ; 4) comparer la planche (composition, tailles, couleurs, rayons, espacements)
en clair **et** en sombre ; 5) itérer. Les données de démo diffèrent des textes de maquette : le
taux n'est qu'un indicateur.

## 8. Écarts assumés des coquilles

- Barre latérale **collante** (hauteur de la fenêtre) : la carte « Paroisse suivie » reste visible en bas
  de l'écran, au lieu du bas de la page comme sur l'artboard statique.
- « Réglages du compte » (⋮) ouvre un menu (profil, affichage sombre, déconnexion) au lieu d'un simple
  lien : c'est le seul accès à la déconnexion et au thème dans la maquette. Idem dans le back-office
  (bouton ⋮ ajouté à la carte d'identité).
- Carte « Paroisse suivie » : troisième ligne « Horaires, annonces et agenda » (la prochaine messe
  demande les horaires, donnée de feature).
- Compteurs de la barre latérale (« Mes demandes 1 », « Messagerie 3 ») : `SidebarLink` accepte `badge`,
  mais la coquille ne les alimente pas encore (données de features).
- Bascule clair/sombre dans le pied de page public (absente de la maquette, nécessaire).
- « Aide » renvoie au contact de « Pour les paroisses » (pas de page d'aide).
- Recherche Ctrl K : filtre les rubriques de l'espace (pas de recherche plein texte côté API).
- Back-office : « Journal d'audit » ajouté en fin de liste quand la capacité est détenue.
