# F1 — Design system (conception)

## Tokens → Tailwind
- `src/styles/tokens.css` est une copie de `docs/v1/design/tokens.css` (4 palettes × clair/sombre, `data-palette` + classe `dark`).
- `tailwind.config.cjs` **remplace** `theme.colors` par les tokens `--jb-*` : une classe de palette brute (`bg-blue-500`) ne compile pas, et ESLint (`no-restricted-syntax`) la refuse aussi, tout comme les couleurs arbitraires `-[#…]`.
- Échelle typographique éditoriale (`meta` 12 → `display` 84), rayons 2/4 px, aucune ombre hors modale (`shadow-modal`).
- Palette par défaut : `ciel` (ADR-F11), surchargeable par `NEXT_PUBLIC_PALETTE`.

## Polices
`next/font/google` : Source Serif 4 (axe `opsz`, italique) → `--font-serif` ; Libre Franklin → `--font-sans`. Chiffres tabulaires : utilitaire `.tnum`.

## Primitives (`src/components/ui`)
Restylées d'après `maquettes/DS-Composants.dc.html` ; Radix seulement là où il apporte le comportement (Slot, Tabs, Dialog).
Button, IconButton, Field (+ Input, Textarea, Select), Choice, Switch, Tabs/TabLinks, Chip/ChipGroup, Pagination, Table, Modal, Toast, Notice, Avatar, Skeleton, SectionHeading, EmptyState, Icon (41 pictogrammes du DS).

## Signature (`src/components/signature`)
LiturgicalBanner (desktop/mobile/backoffice), PhotoSlot, StatusDot (+ `REQUEST_STATUS` du SRS §8.1), RequestTimeline, ConfessionNotice, EncryptionBadge (formulation honnête : pas de « bout en bout », ADR-014 backend), SlotPicker, AnnouncementCard, Stepper, CapabilityChips, ScheduleWeek, TreeView.

## Storybook
Storybook 10 (`@storybook/nextjs`), barre d'outils `palette` × `mode` (décorateur `data-palette` + `dark`), addon a11y en mode `error`. Stories : `src/components/**/*.stories.tsx` (seuls fichiers autorisés à déroger à la règle anti-palette).
