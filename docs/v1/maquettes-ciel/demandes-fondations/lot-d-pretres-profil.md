# Demandes aux fondations — lot D (prêtres, messagerie, confession, profil)

## 1. Barre du haut (64 px) : contenu fourni par la page
Écrans : FID-Pretres, FID-Confession-RDV, FID-Profil, PAR-Messagerie.
- À gauche : un fil d'Ariane (`Parler à un prêtre > Prêtres joignables`, `Parler à un prêtre > Rendez-vous de confession`) ou un texte (FID-Profil : la date du jour ; PAR-Messagerie : `Saint-Dominique · Archidiocèse de Dakar`).
- À droite, avant la cloche : une action propre à la page (FID-Confession-RDV : lien « Mes rendez-vous », 15 px, 600, couleur primary).
Besoin : un moyen pour la page de remplir ces deux emplacements (slot / composant `<TopbarContent breadcrumb=… actions=…>` / portail), sinon je ne peux pas placer ces éléments dans la barre du shell.
Traité : 0f93800 — `<TopbarContent start={<Breadcrumbs items={…} />} end={<NextLink className="text-15 font-semibold">Mes rendez-vous</NextLink>} />` (`@/components/layouts/shell-slots`) ; texte simple : `start={<TopbarText>…</TopbarText>}` (`app-frame`).

## 2. Mode « plein cadre » pour les messageries (colonnes sur toute la hauteur)
- FID-Conversation (`/app/pretres/conversations/[id]`) : PAS de barre du haut ; la zone de contenu est une grille `360px | 1fr` qui occupe toute la hauteur de la fenêtre (100dvh), sans padding ni max-width ; chaque colonne a son propre défilement (la liste, le fil).
- PAR-Messagerie (`/espace/[nodeId]/messagerie`) : barre du haut présente, puis contenu `372px | 1fr` sur la hauteur restante (100dvh − 64 px), sans padding ni max-width.
Besoin : une variante du `<main>` (ex. prop/segment `fullBleed`, ou classe utilitaire documentée) qui retire le padding et le max-width et donne une hauteur fixe au contenu. En attendant, je compense localement (marges négatives) dans mes pages.
Traité : 0f93800 — `<ShellLayout fullBleed />` (PAR-Messagerie : hauteur 100dvh − 64, sans padding ni max-w) et `<ShellLayout fullBleed hideTopbar />` (FID-Conversation, ≥ lg). Retirer les marges négatives locales.

## 3. `ConfessionNotice` (src/components/signature/confession-notice.tsx) : deux rendus Ciel
Règle métier : bandeau toujours visible, je ne peux pas le recopier dans ma feature.
- `variant="card"` (FID-Pretres, défaut) : `role="note"`, rayon 16, `bg-tint-50`, bordure `line-active` (#B3D8F0), padding 16/20, texte `tint-900` 15/22, icône `info` 20 px `primary` ; une seule ligne « **La confession ne se fait pas par message.** {description} » ; action = lien texte 15/600 `primary` à droite, `white-space: nowrap`.
- `variant="pinned"` (FID-Conversation, PAR-Messagerie) : bande pleine largeur sous l'en-tête du fil, sans rayon, `bg-tint-50`, `border-b tint-100`, padding 12px 24px (32 à gauche côté fidèle), icône `epingle` 18 px `primary`, texte 14/20 `tint-900` : fidèle = titre en bloc (600) puis description ; prêtre = titre en ligne puis description. Action = bouton contour 36 px, rayon 10, fond `paper`, bordure `line-active`, texte 14/600 (`tint-800` côté fidèle, `ink` côté prêtre).
- Textes : fidèle « Prenez rendez-vous pour une confession en présentiel. » ; prêtre « Si quelqu'un l'évoque, proposez un rendez-vous de confession en présentiel. N'écrivez rien qui relève du for interne. » + « Voir les créneaux de samedi » (je passe ces textes en props, comme aujourd'hui).
- Merci de garder les props actuelles (`bookingHref`, `description`, `actionLabel`, `className`).
Traité : 0f93800 — `variant="card" | "pinned"`, `audience="fidele" | "pretre"` ; props `bookingHref`, `description`, `actionLabel`, `className` conservées.

## 4. `SegmentedLinks` / `SegmentedControl` : taille 36 px en 14 px
FID-Pretres (piste 320 px, 2 colonnes égales), FID-Conversation (segments 32 px), PAR-Messagerie (segments 36 px avec compteur « Sans réponse 3 » : compteur 14/500 `ink-3`). Aujourd'hui `md` = 34 px et `lg` = 36 px mais en 15 px. Besoin : une taille « 36 px / 14 px » (et idéalement 32 px), et un `items[].count` optionnel pour le compteur. En attendant j'utilise `md`.
Traité : 0f93800 — `size="sm"` (36/14) ou `size="xs"` (32/14), `block` (colonnes égales), compteur `items[].count` (SegmentedLinks) ou `counts={{ valeur: 3 }}` (SegmentedControl).


---
**État au 26/09 (lot D)** : demandes 1 à 4 livrées par les fondations (`TopbarContent`, `ShellLayout fullBleed/hideTopbar`, `ConfessionNotice variant/audience`, `SegmentedControl size xs/sm + counts + block`) et intégrées. Merci. Restent ouvertes :

## 5. `ShellLayout fullBleed` sous 1024 px (barre du bas)
FID-Conversation et PAR-Messagerie à 375 px : le `<main>` plein cadre garde un espace vide d'environ 140 px entre la saisie et la `BottomNav` (padding bas mobile conservé + hauteur non déduite de la barre du bas). Besoin : en `fullBleed`, sous lg, hauteur = 100dvh − barre du haut − `BottomNav`, sans `pb-24`, pour que la saisie repose juste au-dessus de la barre du bas.
Traité : 5fdf235 — en `ShellLayout fullBleed`, sous lg, le <main> fait 100dvh − 64 − 56 − zone sûre (espace fidèle) et n'a aucun padding : retirer les compensations locales (la page ne doit pas ajouter de `pb-*`).

## 6. `SlotPicker` (src/components/signature/slot-picker.tsx) au style Ciel (FID-Confession-RDV)
Grille 3 colonnes, gap 8, cases 56 px rayon 12, texte centré ; heure 15/600 au format `16:20` (Libre Franklin, pas de serif), sous-libellé 12/16 ; libre = fond `paper` bordure `line` (« Libre », `ink-2`) ; choisi = aplat `primary-fill` texte `on-primary`, sous-libellé « Choisi » `tint-100` ; complet = fond `surface`, heure barrée `ink-3`, « Complet ». Garder `slots[].priest` comme sous-libellé optionnel (je passe « A. Ndiaye » quand « Tous » est choisi, « Libre » sinon).
Traité : 5fdf235 — `SlotPicker` : 3 colonnes, cases 56 rayon 12, « 16:20 » 15/600 (lu « 16 h 20 »), sous-libellé = `slot.priest` (chaîne vide → « Libre »), choisi « Choisi » en b100, complet sur surface barré.

## 7. (suite du 5) Hauteur du `<main>` plein cadre sous lg : classe invalide
Mesure à 375 × 812 sur `/app/pretres/conversations/<id>` : le `<main>` porte `h-[calc(100dvh-64px-56px-env(safe-area-inset-bottom))]` mais sa hauteur calculée vient de `flex-1` (748 px, pas 692) et un enfant en `h-full` ne reçoit que la hauteur de son contenu (566 px) : la déclaration `height` est rejetée par le navigateur (probablement `env()` dans l'arbitraire Tailwind sans espaces autour des `-`). Résultat : ~140 px vides entre la saisie et la barre du bas (FID-Conversation, PAR-Messagerie). Proposition : `h-[calc(100dvh_-_120px_-_env(safe-area-inset-bottom,0px))]` ou une classe CSS dédiée dans globals.css. Mes pages utilisent `h-full` et suivront sans modification.
Traité : 9059617 — classes CSS `jb-fullbleed*` (globals.css) et plus de `flex-1` en plein cadre : `<main>` = 692 px mesurés à 375 × 812 sur une conversation ; `h-full` dans la page suffit.
