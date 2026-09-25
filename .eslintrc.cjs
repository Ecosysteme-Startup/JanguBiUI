const fs = require('fs');
const path = require('path');

/**
 * Zones interdisant les imports entre features, **dérivées du disque** plutôt
 * qu'écrites à la main.
 *
 * La liste précédente était celle du gabarit Bulletproof d'origine : `auth`,
 * `comments`, `discussions`, `teams`, `users` — dont trois n'ont jamais existé
 * ici, tandis que les 21 features réelles n'étaient couvertes par AUCUNE zone.
 * La règle passait donc au vert sur des violations bien réelles : `features/home`
 * importait cinq autres features sans que rien ne le signale.
 *
 * En énumérant le dossier, toute feature ajoutée est protégée le jour de sa
 * création, sans que personne n'ait à penser à modifier cette configuration —
 * c'est précisément l'oubli qui a laissé le défaut s'installer.
 */
function crossFeatureZones() {
  const featuresDir = path.join(__dirname, 'src', 'features');
  let features = [];
  try {
    features = fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    // Dossier absent (checkout partiel, outillage) : mieux vaut une config qui
    // charge sans zones qu'un lint qui refuse de démarrer.
    return [];
  }

  return features.map((name) => ({
    target: `./src/features/${name}`,
    from: './src/features',
    except: [`./${name}`],
  }));
}

module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: [
    'node_modules/*',
    'public/mockServiceWorker.js',
    'generators/*',
    '**/__tests__/**',
    'src/testing/**',
  ],
  // NOTE: `next/core-web-vitals` (eslint-config-next@16) is a flat-config-only
  // package and crashes ESLint 8's eslintrc loader. We load the underlying
  // @next/eslint-plugin-next directly (eslintrc-compatible) in the overrides.
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      settings: {
        react: { version: 'detect' },
        'import/resolver': {
          typescript: {},
        },
      },
      env: {
        browser: true,
        node: true,
        es6: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended',
        'plugin:testing-library/react',
        'plugin:jest-dom/recommended',
        'plugin:vitest/legacy-recommended',
      ],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              // Imports entre features interdits — zones dérivées du disque
              // (voir crossFeatureZones ci-dessus).
              ...crossFeatureZones(),

              // enforce unidirectional codebase:

              // e.g. src/app can import from src/features but not the other way around
              {
                target: './src/features',
                from: './src/app',
              },

              // e.g src/features and src/app can import from these shared modules but not the other way around
              {
                target: [
                  './src/components',
                  './src/hooks',
                  './src/lib',
                  './src/types',
                  './src/utils',
                ],
                from: ['./src/features', './src/app'],
              },
            ],
          },
        ],
        'import/no-cycle': 'error',
        'linebreak-style': ['error', 'unix'],
        'react/prop-types': 'off',
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
            ],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'import/default': 'off',
        'import/no-named-as-default-member': 'off',
        'import/no-named-as-default': 'off',
        'react/react-in-jsx-scope': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        // Le préfixe `_` marque un identifiant volontairement non consommé.
        // Cas principal : les gardes de contrat front↔back
        // (`type _XMatchesContract = Expect<Matches<…>>` dans les couches
        // `api/`). Ces alias N'ONT pas d'usage — c'est leur seule évaluation
        // par le compilateur qui fait échouer le build quand le serveur change
        // de forme. Les signaler comme « défini mais jamais utilisé » pousserait
        // à les supprimer, donc à retirer précisément la protection.
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^_',
            argsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/explicit-function-return-type': ['off'],
        '@typescript-eslint/explicit-module-boundary-types': ['off'],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/no-explicit-any': ['off'],
        // Charte V1 (CLAUDE.md §3) : tokens --jb-* uniquement. Interdit la palette
        // Tailwind brute et les couleurs arbitraires (hex, rgb) dans les classes.
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "Literal[value=/(text|bg|border|ring|from|to|via|fill|stroke|divide|placeholder|decoration|shadow|outline|caret|accent)-(gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(-(50|[1-9]00|950))?\\b/]",
            message: 'Palette Tailwind brute interdite : utiliser les tokens --jb-* (bg-paper, text-ink, text-primary…).',
          },
          {
            selector: "Literal[value=/-\\[(#|rgb|hsl)/]",
            message: 'Couleur arbitraire interdite : utiliser les tokens --jb-*.',
          },
        ],
        // Formatage géré par Prettier CLI (`yarn format`), pas par ESLint :
        // l'intégration plugin:prettier produisait des milliers de faux
        // positifs de drift. eslint-config-prettier (via le preset) désactive
        // toujours les règles de style en conflit avec Prettier.
        'prettier/prettier': 'off',
      },
    },
    {
      files: ['**/*.stories.tsx'],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
    {
      plugins: ['check-file'],
      files: ['src/**/*'],
      rules: {
        'check-file/filename-naming-convention': [
          'error',
          {
            '**/*.{ts,tsx}': 'KEBAB_CASE',
          },
          {
            ignoreMiddleExtensions: true,
          },
        ],
        'check-file/folder-naming-convention': [
          'error',
          {
            '!(src/app)/**/*': 'KEBAB_CASE',
            '!(**/__tests__)/**/*': 'KEBAB_CASE',
          },
        ],
      },
    },
  ],
};
