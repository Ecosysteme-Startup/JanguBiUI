# Demandes aux fondations — lot G (espace diocèse et plateforme)

Contournements actuels : composition locale dans la feature, sans copie de primitive.

1. **Rayon 3 px** (`rounded-3` ou équivalent) — pastilles carrées 10 px des légendes de barres (DIO-Tableau-de-bord « 1 active / 4 en préparation », WEB-DIO-Tableau-de-bord). Actuellement `rounded-sm` (6 px) : la pastille paraît ronde.
2. **Titres de carte 18/26** — `text-18` a une interligne de 28 ; les maquettes DIO/PLA utilisent 18/26 pour les titres d'encarts latéraux (« Prochaines nominations », « Fidèles sur Jàngu Bi », « Offices sur ce nœud »). Un `CardHeader size="sm"` en 18/26, ou une taille 18/26 dans l'échelle.
3. **`PageHeader` : description à 4 px du titre** — les maquettes back-office (DIO-*, PLA-*) posent la phrase à `margin-top: 4px` ; le primitive met `mt-2` (8 px).
4. **`TreeView` (src/components/signature/tree-view.tsx) aux couleurs Ciel** — WEB-DIO-Structure : rangées 36 px (32 px pour les feuilles), rayon 8, retrait 20 px par niveau, sélection `bg-tint-50 text-tint-800` 600, survol `bg-surface`, texte 14 ; icône de type avant le libellé (province : carte, diocèse : bâtiment, doyenné : couches, paroisse : église, CEB : personnes) via une prop `icon?: IconName` sur `TreeNode` ; compteur 13 ink3 à droite (prop `meta` déjà là) ; chevron 16 ink3. Aujourd'hui : rangées sans rayon, survol `surface-2`, pas d'icône.
