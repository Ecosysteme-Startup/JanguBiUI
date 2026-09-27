/**
 * Langage de mouvement de Jàngu Bi — miroir exact de l'app mobile (Reanimated).
 * Voir docs/ANIMATIONS.md. Règle d'or : on n'anime que `transform` et `opacity`.
 *
 * Les durées sont en SECONDES (unité de `motion`) ; les équivalents en ms sont
 * rappelés en commentaire pour la correspondance avec le mobile.
 */

type Bezier = [number, number, number, number];

export const easings = {
  /** Easing.out(Easing.cubic) — apparitions, barres, toasts. */
  outCubic: [0.33, 1, 0.68, 1] as Bezier,
  /** Easing.inOut(Easing.quad) — égaliseur, balayage du hero. */
  inOutQuad: [0.45, 0, 0.55, 1] as Bezier,
  /** Easing.inOut(Easing.sin) — Ken Burns, pulsation, flottement. */
  inOutSine: [0.37, 0, 0.63, 1] as Bezier,
} as const;

export const durations = {
  /** Apparition (fade + montée de 8 px) : 450 ms. */
  reveal: 0.45,
  /** Délai d'apparition du hero : 250 ms. */
  heroDelay: 0.25,
  /** Barre de segment : 420 ms, délai 600 + i × 220 ms. */
  bar: 0.42,
  barDelay: 0.6,
  barStep: 0.22,
  /** Pression : 90 ms à l'appui, 160 ms au retour. */
  pressIn: 0.09,
  pressOut: 0.16,
  /** Toast et transition de page : 180 ms. */
  toast: 0.18,
  page: 0.18,
  /** Feuille (drawer) : 240 ms. */
  sheet: 0.24,
  /** Squelette : 700 ms par demi-cycle. */
  skeleton: 0.7,
  /** Égaliseur en pause : retombe à 0.2 en 220 ms. */
  eqPause: 0.22,
  /** Ken Burns : 20 s aller-retour (10 s par sens). */
  kenBurnsHalf: 10,
  /** Balayage lumineux : traverse en 14 s. */
  sweep: 14,
  /** Pulsation du grain actif : 1 300 ms aller-retour. */
  pulseHalf: 0.65,
  /** Compteurs de la landing. */
  countUp: 1.5,
} as const;

/** Décalage entre deux enfants d'un <Stagger> (doux, pas de cascade voyante). */
export const staggerStep = 0.07;

/** Montée des apparitions (px). */
export const revealOffset = 8;

export const springs = {
  /** withSpring de la barre d'onglets mobile. */
  indicator: { type: 'spring', damping: 18, mass: 0.7, stiffness: 190 },
} as const;

/** Inclinaison 3D au pointeur (options de `useSpring`) : ressort doux, sans rebond visible. */
export const tiltSpring = { damping: 22, mass: 0.8, stiffness: 120 };

/** Classe CSS équivalente (pour les transitions Tailwind). */
export const cssEaseOutCubic = 'cubic-bezier(0.33, 1, 0.68, 1)';
