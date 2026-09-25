/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react(), viteTsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/testing/setup-tests.ts',
    // Parcours à plusieurs étapes (userEvent) : 5 s ne suffisent pas quand toute la suite tourne en parallèle.
    testTimeout: 15_000,
    hookTimeout: 30_000,
    // Le nettoyage du DOM est fait dans setup-tests.ts, APRÈS l'audit axe de chaque test.
    env: { RTL_SKIP_AUTO_CLEANUP: 'true' },
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      include: ['src/**'],
    },
  },
});
