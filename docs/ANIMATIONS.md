# Animations — langage de mouvement web (JanguBiUI)

Le web parle le **même langage de mouvement** que l'app mobile (Reanimated). But :
un site vivant mais sobre — un sanctuaire, pas une vitrine technique.
Bibliothèque : `motion` (Framer Motion), importée depuis `motion/react`.
Pas de three.js : la « 3D » se fait en transformations CSS 3D (perspective) et en
parallaxe légère.

## Règles

1. **On n'anime que `transform` et `opacity`.** Jamais `width`, `height`, `top`,
   `padding`… (les barres « largeur 0 → valeur » du mobile deviennent `scaleX`).
2. **Reduced motion** : `prefers-reduced-motion: reduce` affiche l'état final
   immédiatement.
   - JS : `useMotionOK()` dans chaque composant + `<MotionConfig reducedMotion="user">`
     dans `src/app/provider.tsx`.
   - CSS : le bloc `@media (prefers-reduced-motion: reduce)` de `globals.css`
     coupe `.jb-rise`, le flottement, les étoiles, `animate-pulse`, etc.
3. **Jamais de contenu caché dans le HTML serveur.** Les apparitions au défilement ne
   masquent un bloc qu'après le montage, et seulement s'il est sous la ligne de
   flottaison (donc invisible : pas de flash). Sans JS, tout est lisible. Le hero,
   au-dessus de la ligne de flottaison, est animé en CSS pur (`.jb-rise`), qui joue
   aussi sans JS.
4. **Pas de `will-change` permanent** : le navigateur promeut les calques pendant
   l'animation uniquement.
5. **Pas de CLS** : les animations ne changent pas la mise en page (la nav de la
   landing garde un padding fixe et n'anime que l'opacité de son calque de fond).
6. Discrétion : un seul mouvement d'entrée par bloc, montée de 8 px, cascade de
   70 ms. Aucune boucle qui attire l'œil hors du hero et des indicateurs d'état.

## Jetons — `src/lib/motion/tokens.ts`

| Jeton | Valeur | Référence mobile |
|---|---|---|
| `easings.outCubic` | `[0.33, 1, 0.68, 1]` | `Easing.out(Easing.cubic)` |
| `easings.inOutQuad` | `[0.45, 0, 0.55, 1]` | égaliseur, balayage |
| `easings.inOutSine` | `[0.37, 0, 0.63, 1]` | Ken Burns, pulsation, flottement |
| `durations.reveal` / `revealOffset` | 450 ms / 8 px | apparition |
| `durations.heroDelay` | 250 ms | délai du hero |
| `durations.bar`, `barDelay`, `barStep` | 420 ms, 600 ms, 220 ms | barres de segments |
| `durations.pressIn` / `pressOut` | 90 ms / 160 ms (échelle 0,97) | pression |
| `durations.toast`, `page` | 180 ms | toast (fondu + 8 px), transition de page |
| `durations.sheet` | 240 ms | feuille (drawer) |
| `durations.skeleton` | 700 ms, opacité 1 ↔ 0,55 | squelette |
| `durations.eqPause` | 220 ms → 0,2 | égaliseur en pause |
| `durations.kenBurnsHalf` | 10 s (20 s aller-retour) | Ken Burns |
| `durations.sweep` | 14 s | balayage lumineux |
| `durations.pulseHalf` | 650 ms (1 300 ms aller-retour) | grain du chapelet |
| `springs.indicator` | damping 18, mass 0,7, stiffness 190 | barre d'onglets |
| `tiltSpring` | damping 22, mass 0,8, stiffness 120 | inclinaison 3D (web) |
| `staggerStep` | 70 ms | cascade (web) |
| `playerMotion.iconMorph` | 160 ms, inOut sine | lecture ⇄ pause (icone.morph) |
| `playerMotion.backdrop` | 240 ms, out-cubic | fond du lecteur (fond.apparition) |
| `playerMotion.coverCrossfade` | 280 ms, inOut sine | changement de piste (pochette.fondu) |
| `playerMotion.controlsDelay` / `controlsStep` / `controlsDuration` | 200 ms / 40 ms / 240 ms | décalage titre, onde, commandes (commandes.decalage) |
| `playerMotion.waveStep` | 1 s, linéaire | curseur de l'onde entre deux relevés (onde.pas) |
| `playerMotion.reduced` | 120 ms, linéaire | seul fondu gardé en mouvement réduit (mouvement.reduit) |
| `playerMotion.coverPausedScale` | 0,94 | pochette en pause (ressort `springs.indicator`) |

Équivalents CSS : `cubic-bezier(0.33, 1, 0.68, 1)` (out-cubic) et
`cubic-bezier(0.37, 0, 0.63, 1)` (inOut sine) dans Tailwind et `globals.css`.

## Composants — `src/lib/motion/`

| Fichier | Composant | Rôle |
|---|---|---|
| `use-motion-ok.ts` | `useMotionOK()` | `false` si reduced motion |
| `use-reveal-phase.ts` | `useRevealPhase(ref, appear?)` | phases `static` / `hidden` / `shown` (règle 3) |
| `use-in-view-once.ts` | `useInViewOnce(ref, {margin, amount})` | IntersectionObserver unique, sans plantage si IO absent |
| `reveal.tsx` | `<Reveal delay appear>` | apparition au défilement (marge −10 %, une fois) |
| `reveal.tsx` | `<Stagger step delay appear>` + `<StaggerItem>` | cascade douce des enfants |
| `press-scale.tsx` | `<PressScale lift>`, `pressProps(ok, lift)` | pression 0,97 ; `lift` = −2 px au survol |
| `count-up.tsx` | `<CountUp to format>` | compteur ; HTML serveur = valeur finale |
| `equalizer.tsx` | `<Equalizer playing>` | 4 barres 3 × 16, cycles 460/620/520/700 ms |
| `ken-burns.tsx` | `<KenBurns>` | pochettes : 1,18 → 1,26, translation 14 / 8 px |
| `hero-sweep.tsx` | `<HeroSweep>` | bande blanche 160 px, 16°, opacité 0,08, 14 s |
| `pulse.tsx` | `<Pulse>` | halo : opacité 0,2 → 0,55, échelle 1,2 → 1,6 |
| `tilt-3d.tsx` | `<Tilt3D max track>` | perspective 1 000 px, ≤ 6°, souris uniquement |
| `grow-bar.tsx` | `<GrowBar value index>` | barre de segment en `scaleX` |
| `page-transition.tsx` | `<PageTransition>` | fondu 180 ms, monté dans `app/app/template.tsx` |

`appear` : à réserver au contenu **monté côté client** (tableaux de bord chargés
après `useUser`) ; le masquage a lieu avant la première peinture.

## Où c'est utilisé (front V1 « Ciel produit », depuis le 30/09/2026)

L'ancienne landing (`src/features/landing`) a été remplacée par l'accueil Ciel lors de la fusion
avec develop ; le mouvement a été reporté sur les nouveaux composants.

- **Accueil public** (`src/features/public-home`, `public-parole`, `public-annuaire`) : haut de page
  en CSS (`.jb-rise`, cascade 200 → 560 ms via `--jb-delay`) ; aperçu (dessin + cartes Parole et
  messes) en `Tilt3D` suivant la souris (≤ 4°, cartes décalées en `translateZ`) ; carte des messes
  qui flotte (`animate-jb-float`, 6 px, inOut sine) ; `Reveal` / `Stagger` sur la Parole du jour,
  l'annuaire, les quatre services (texte puis aperçu à 70 ms), l'application, l'offre et la FAQ ;
  `CountUp` sur le nombre de paroisses ; flèches qui glissent de 2 px au survol ; réponse de FAQ
  qui monte à l'ouverture.
- **Autres pages publiques** : `jb-cascade` sur la Parole du jour, l'annuaire et la fiche
  paroisse ; « Pour les paroisses » en `.jb-rise` puis `Reveal` par section.
- **Transitions de page** : `PageTransition` (fondu 180 ms) dans les `template.tsx` de `(public)`,
  `/app`, `/espace/[nodeId]` et `/plateforme`.
- **Primitives** : dialogues, modales, recherche rapide (`animate-jb-pop-in/out`, 180 ms, 0,97) ;
  voiles (`animate-jb-fade-in/out`) ; tiroir de navigation (`animate-jb-drawer-in/out`, 240 ms) ;
  menu mobile public (`animate-jb-drop-in/out`) ; menus et infobulles (pop depuis l'origine Radix) ;
  toasts en `AnimatePresence` (fondu + 8 px, 180 ms, `layout`) ; onglets Radix : soulignement
  partagé (`layoutId`, `springs.indicator`) ; barres latérales : fond de la rubrique courante qui
  glisse (`layoutId`, un `LayoutGroup` par barre) ; boutons et bottom-nav : pression 0,97 ; cartes
  interactives : élévation 2 px au survol ; squelettes : `animate-pulse` au rythme mobile.
- **Tableaux de bord** (paroisse, diocèse, plateforme) et accueil fidèle : `jb-cascade` (chaque bloc
  monte de 8 px, 70 ms après le précédent) ; barres de proportion en `animate-jb-grow`
  (`scale` depuis la gauche : jauges des dons, collectes, créneaux de confession, places).
- **Lecteur audio global** (`src/components/player/`, voir `docs/LECTEUR-AUDIO.md`) : inchangé.

Les images clés de Tailwind n'animent que `opacity` et les propriétés individuelles `scale` /
`translate`, qui se composent avec les `transform` de positionnement des primitives.

## Vérifier

- Captures : `docs/animations/` (desktop 1440, mobile 390, sombre + reduced motion,
  sans JS en pleine page).
- Avec Playwright, `reducedMotion: 'reduce'` et `javaScriptEnabled: false` ne
  doivent laisser aucun élément à `opacity: 0`.
- Build local depuis un worktree dont `node_modules` est un lien symbolique :
  Turbopack refuse le lien, utiliser `next build --webpack`.
