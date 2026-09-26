# Demandes aux fondations — lot F

1. **Filtre en pilule sur `<select>`** (PAR-Annonces « Catégorie ⌄ », PAR-Agenda « Tous les lieux ⌄ ») : pilule 36, 14/500, chevron 16, état actif b100. Composé localement dans `annonces-edition/components/filter-select.tsx` et `agenda-edition/components/agenda-screen.tsx` (PlaceFilter) ; à remplacer par une primitive `FilterSelect`.
   Traité : b1f2b52, 4c703ae — `<FilterPill activeTone="filled" allLabel="Catégorie" …>` (`@/components/ui/filter-pill`) ; branché dans annonces-list et agenda-screen, `filter-select.tsx` supprimé.
2. **`Th sort="descending"`** affiche la flèche vers le haut (`fleche-haut`) ; la maquette PAR-Annonces montre ↓ pour « Publiée le ↓ ».
   Traité : b1f2b52 — `Th sort="descending"` affiche ↓ (trait 2), `ascending` ↑.
3. **Champ de recherche compact 36 px, rayon 10, 14 px** (PAR-Annonces) : `Input` n'a pas cette taille ; contourné par `className="h-9 rounded-10 pl-10 text-14"`.
   Traité : b1f2b52, 4c703ae — `<Input controlSize="xs" icon="recherche" />` (36 px, rayon 10, 14 px) ; classes locales retirées.
4. **`Modal` taille formulaire** (PAR-Horaires, PAR-Equipe) : 600 px, titre 22/600, pied en bande surface avec une aide à gauche (« Chaque mercredi et chaque vendredi. ») et les actions à droite.
   Traité : b1f2b52, 4c703ae — `<Modal size="form">` (600 px, titre 22/600) ; pied en bande surface par `footer` + `footerHint`, ou `<ModalFooter hint={…}>` en fin de `<form>` ; branché dans Horaires (horaire, exception) et Équipe (fin de nomination).
5. **`Switch` 44 × 26** et libellé 15/500 (PAR-Annonce-Editeur, PAR-Parametres) : la primitive fait 40 × 24, libellé 400.
   Traité : b1f2b52, 4c703ae — `<Switch size="lg" />` (44 × 26, libellé 500) ; branché dans l'éditeur d'annonce et les paramètres.
6. **Icône « annuler la dernière modification »** (Lucide `Undo2`) pour la barre d'outils de l'éditeur.
   Traité : b1f2b52, 4c703ae — `<Icon name="annuler" />` (Undo2) ; bouton « Annuler la dernière modification » ajouté à la barre de l'éditeur (`undo()`).
7. **`CapabilityChips`** (signature) : encore à l'ancien style (bordure, text-xs) ; maquette PAR-Equipe : étiquette 22 px, rayon 6, surface2, 12/500. Contourné localement dans `equipe-screen.tsx`.
   Traité : b1f2b52, 4c703ae — `CapabilityChips` au style Ciel, prop `max` (+n explicité) ; `OfficeCapabilities` d'equipe-screen s'en sert.
8. **`StatusTabs`** local (`annonces-edition/components/status-tabs.tsx`, compteur en pilule) : `TabsTrigger countPill` existe désormais ; à migrer vers la primitive.
   Traité : 4c703ae — `Tabs`/`TabsTrigger countPill` (+ `TabsContent`) dans annonces-list ; `status-tabs.tsx` supprimé.
