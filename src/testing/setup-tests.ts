import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

import { a11yViolations } from '@/testing/a11y';
import { resetDonsState } from '@/testing/mocks/db-dons';
import { reinitialiserPersonnalisation } from '@/testing/mocks/handlers/personnalisation';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(async () => {
  // Chaque écran rendu par un test passe aussi l'audit axe (F9) : 330 états réels couverts.
  try {
    if (document.body.children.length > 0 && process.env.A11Y !== '0') {
      const violations = await a11yViolations();
      if (violations.length > 0) throw new Error(`Accessibilité (axe) :\n${violations.join('\n')}`);
    }
  } finally {
    cleanup();
    server.resetHandlers();
    resetDonsState();
    reinitialiserPersonnalisation();
    navigation.pathname = '/';
    navigation.search = '';
  }
});
afterAll(() => server.close());

// Le routeur de l'App Router n'existe pas sous jsdom : chemin courant pilotable par test.
vi.mock('next/navigation', async () => {
  const { navigation: nav } = await import('@/testing/navigation');
  return {
    usePathname: () => nav.pathname,
    useRouter: () => ({ replace: nav.replace, push: nav.push, back: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(nav.search),
    notFound: vi.fn(),
    redirect: vi.fn(),
  };
});
