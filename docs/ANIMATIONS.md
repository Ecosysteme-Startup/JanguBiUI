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

## Où c'est utilisé

- **Landing** (`src/features/landing/components/`) : hero en CSS (`.jb-rise`,
  cascade de 250 à 730 ms, titre révélé ligne par ligne) + `HeroSweep` ; étoiles en
  parallaxe (12 % du défilement, thème sombre) ; téléphone central en `Tilt3D`
  (pointeur suivi dans la fenêtre) avec flottement CSS en inOut sine sur un
  élément distinct ; `CountUp` + `Stagger` pour les chiffres ; `Reveal` / `Stagger`
  sur chaque section ; `PressScale lift` sur les boutons des stores et les cartes
  « Pour qui » ; flèche des CTA qui glisse de 2 px ; fond de nav en fondu.
- **Espace connecté** : fondu de page (`app/app/template.tsx`) ; tableau de bord
  fidèle en `Stagger appear` ; onglets (`components/ui/tabs`), pastille de la
  bottom-nav et barre active de la sidebar en `layoutId` avec le ressort
  d'indicateur ; toasts en `AnimatePresence` (fondu + 8 px, 180 ms) ; dialogues
  180 ms out-cubic, zoom 0,97 ; drawer 240 ms ; squelettes (`animate-pulse`
  redéfini : 700 ms, 1 ↔ 0,55) ; lecteur audio avec `Equalizer`.
- Disponibles mais pas encore branchés : `KenBurns`, `Pulse`, `GrowBar` (pas de
  pochette, de grain de chapelet ni de barre de segment sur le web aujourd'hui ;
  destinés au lecteur plein écran C1 et aux tableaux de bord des dons A4).

## Vérifier

- Captures : `docs/animations/` (desktop 1440, mobile 390, sombre + reduced motion,
  sans JS en pleine page).
- Avec Playwright, `reducedMotion: 'reduce'` et `javaScriptEnabled: false` ne
  doivent laisser aucun élément à `opacity: 0`.
- Build local depuis un worktree dont `node_modules` est un lien symbolique :
  Turbopack refuse le lien, utiliser `next build --webpack`.
