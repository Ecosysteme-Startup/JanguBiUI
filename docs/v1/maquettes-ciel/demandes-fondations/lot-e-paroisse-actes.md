# Demandes aux fondations — lot E (espace paroisse, actes, confessions)

Contournements actuels : composition locale dans la feature, sans copie de primitive.

1. **`Breadcrumbs` : icône de retour avant le premier élément** — WEB-PAR-Demande-Detail montre
   « ‹ Demandes d'actes / JB-2026-00405 » (chevron gauche 16 avant le lien). Une prop `back` (ou
   `leadingIcon`) ; aujourd'hui le fil est rendu sans chevron (`separator="slash"`).
   Traité : 5fdf235 — `<Breadcrumbs back separator="slash" items={…} />`.
2. **Case à cocher nue** (sans libellé visible) pour les tableaux — WEB-PAR-Demandes : case 18 px
   rayon 5 dans une cible de 44 px. Contournement : `Choice` avec un libellé `sr-only` (case 20 px rayon 6).
   Traité : 5fdf235 — `<Checkbox label="Sélectionner JB-…" checked onChange />` (`@/components/ui/checkbox`), 18 px rayon 5, cible 44, `indeterminate` pour l'en-tête.
3. **`Pagination` : libellé « 1 à 12 sur 17 demandes »** — la maquette met le nom après la plage ;
   la primitive donne « Demandes 1 à 12 sur 17 ». Une prop `format` ou `nounAfter`. La maquette de
   table n'a pas non plus les libellés « Précédent / Suivant » (chevrons seuls, `aria-label`).
   Traité : 5fdf235 — `<Pagination noun="demandes" nounPosition="after" compact />`.
4. **Pilule de filtre-sélecteur** (`FilterPill`) — « Type d'acte ⌄ », « Suivie par ⌄ » : sélecteur
   natif 36 px rayon 999 ; actif en `tint-50` / `line-active` / `tint-800` avec croix de retrait.
   Composé localement dans `features/actes-traitement/components/filter-pill.tsx`
   (`[field-sizing:content]` pour la largeur). À promouvoir en primitive si d'autres lots en ont besoin.
   Traité : 5fdf235 — promue en `@/components/ui/filter-pill` (mêmes props + `onClear` pour la croix) ; supprimer la copie locale de la feature.
5. **Rayon 4 px** — pastilles de légende 16 × 12 de PAR-Confessions (« Réservé / Libre / Fermé ») :
   `rounded-[4px]` en attendant ; et 5 px pour la case de table (point 2).
   Traité : 5fdf235 — `rounded-4` et `rounded-5`.
6. **Statut d'acte en badge** — la table `STATUS_TONE` (soumise neutre, en vérification info,
   complément warn, prête ok, retirée muted, rejetée err) existe dans deux features (actes-traitement,
   tableaux-de-bord). Un `RequestStatusBadge` dans `components/signature/` éviterait le doublon.
   Traité : 5fdf235 — `<RequestStatusBadge status={s} />` (ou `<StatusDot status={s} />`, ton : `REQUEST_STATUS[s].tone`) dans `@/components/signature/status-dot` ; retirer les tables `STATUS_TONE` locales.
