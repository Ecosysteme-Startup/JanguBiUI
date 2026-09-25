import '@testing-library/jest-dom/vitest';

import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  navigation.pathname = '/';
});
afterAll(() => server.close());

// Le routeur de l'App Router n'existe pas sous jsdom : chemin courant pilotable par test.
vi.mock('next/navigation', async () => {
  const { navigation: nav } = await import('@/testing/navigation');
  return {
    usePathname: () => nav.pathname,
    useRouter: () => ({ replace: nav.replace, push: nav.push, back: vi.fn(), refresh: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
    notFound: vi.fn(),
    redirect: vi.fn(),
  };
});
