/** @type {import('tailwindcss').Config} */

// Charte V1 (docs/v1/02-SPEC-FRONT-V1.md §1) : Tailwind ne consomme QUE les tokens
// --jb-* (src/styles/tokens.css). La palette par défaut de Tailwind est remplacée,
// pas étendue : une classe `bg-blue-500` ne compile même pas.
const token = (name) => `var(--jb-${name})`;

module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      paper: token('paper'),
      surface: token('surface'),
      'surface-2': token('surface-2'),
      ink: token('ink'),
      'ink-2': token('ink-2'),
      'ink-3': token('ink-3'),
      line: token('line'),
      'line-field': token('line-field'),
      'line-strong': token('line-strong'),
      primary: token('primary'),
      'primary-strong': token('primary-strong'),
      'primary-fill': token('primary-fill'),
      'primary-fill-hover': token('primary-fill-hover'),
      'on-primary': token('on-primary'),
      night: token('night'),
      'night-2': token('night-2'),
      'on-night': token('on-night'),
      'on-night-muted': token('on-night-muted'),
      tint: {
        50: token('tint-50'),
        100: token('tint-100'),
        200: token('tint-200'),
        300: token('tint-300'),
        400: token('tint-400'),
        500: token('tint-500'),
      },
      ok: token('ok'),
      'ok-bg': token('ok-bg'),
      warn: token('warn'),
      'warn-dot': token('warn-dot'),
      'warn-bg': token('warn-bg'),
      err: token('err'),
      'err-bg': token('err-bg'),
      lit: {
        green: token('lit-green'),
        violet: token('lit-violet'),
        gold: token('lit-gold'),
        'gold-text': token('lit-gold-text'),
        red: token('lit-red'),
        rose: token('lit-rose'),
        'rose-text': token('lit-rose-text'),
      },
    },
    fontFamily: {
      serif: ['var(--font-serif)', 'Georgia', 'serif'],
      sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      // DS-Fondations §02 : échelle éditoriale, en rem (base 16 px) pour suivre le réglage
      // « taille du texte » du navigateur (WCAG 1.4.4, recette A11Y-14). 12 px = 0,75 rem.
      meta: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
      xs: ['0.8125rem', { lineHeight: '1.45' }],
      sm: ['0.875rem', { lineHeight: '1.5' }],
      base: ['0.9375rem', { lineHeight: '1.5' }],
      body: ['1rem', { lineHeight: '1.6' }],
      lead: ['1.125rem', { lineHeight: '1.55' }],
      h4: ['1.25rem', { lineHeight: '1.25' }],
      h3: ['1.5rem', { lineHeight: '1.18' }],
      h2: ['2.25rem', { lineHeight: '1.08' }],
      title: ['2.5rem', { lineHeight: '1.02', letterSpacing: '-0.01em' }],
      h1: ['3.5rem', { lineHeight: '1', letterSpacing: '-0.015em' }],
      display: ['5.25rem', { lineHeight: '0.96', letterSpacing: '-0.02em' }],
    },
    borderRadius: {
      none: '0',
      DEFAULT: '2px',
      sm: '2px',
      md: '4px',
      full: '9999px',
    },
    extend: {
      maxWidth: { reading: '68ch' },
      spacing: { 13: '52px', 18: '72px', 66: '264px', 68: '272px' },
      boxShadow: {
        // DS-Composants : aucune ombre hors modale.
        modal: '0 24px 64px -16px rgb(0 0 0 / 0.28)',
      },
      borderWidth: { 3: '3px' },
    },
  },
  plugins: [],
};
