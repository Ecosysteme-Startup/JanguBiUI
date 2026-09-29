import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import type { Grant } from '@/lib/capacites';
import { mockState } from '@/testing/mocks/db';

export const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });

type RenderAppOptions = Omit<RenderOptions, 'wrapper'> & { capacites?: Grant[] };

/** Rend un composant avec les providers globaux et des capacités simulées (via MSW). */
export const renderApp = (ui: ReactElement, { capacites = [], ...options }: RenderAppOptions = {}) => {
  mockState.grants = capacites;
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
};
