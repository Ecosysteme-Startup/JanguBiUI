import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';

import FideleLayout from '@/app/app/layout';
import FideleHomePage from '@/app/app/page';
import { ChapeletView } from '@/features/chapelet/components/chapelet-view';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { FakeWebSocket } from '@/testing/fake-web-socket';
import { paroleHandlers } from '@/testing/mocks/handlers/parole';
import { server } from '@/testing/mocks/server';
import { navigation } from '@/testing/navigation';
import { createTestQueryClient, renderApp } from '@/testing/test-utils';

/**
 * Recette perf (04, MAJEUR 2) : « chaque endpoint appelé deux fois ». On vérifie ici que
 * l'application n'émet qu'UNE requête par ressource, même sous `StrictMode` (double montage
 * des effets en dev) et alors que le shell et la page consomment les mêmes données
 * (`/me/`, `/liturgy/today/`). Le doublon mesuré dans Chrome était le pré-vol CORS
 * (`OPTIONS`, API sur un autre port + en-tête Authorization), pas un second GET.
 */
describe('Espace fidèle : une seule requête par ressource', () => {
  beforeEach(() => {
    resetF5bState();
    // Le shell ouvre la socket ws/notifications/ de l'onglet (RealtimeBridge) : WebSocket simulé,
    // retiré en fin de fichier (le démontage suit les afterEach du fichier).
    FakeWebSocket.reset();
    vi.stubGlobal('WebSocket', FakeWebSocket);
  });
  afterAll(() => vi.unstubAllGlobals());

  it('accueil + shell sous StrictMode : aucun GET dupliqué', async () => {
    navigation.pathname = '/app';
    const requests: string[] = [];
    const record = ({ request }: { request: Request }) => {
      if (request.method === 'GET') {
        const url = new URL(request.url);
        requests.push(`${url.pathname}${url.search}`);
      }
    };
    server.events.on('request:start', record);

    renderApp(
      <StrictMode>
        <FideleLayout>
          <FideleHomePage />
        </FideleLayout>
      </StrictMode>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: /bonjour/i })).toBeInTheDocument();
    expect(await screen.findByText('Mystères lumineux')).toBeInTheDocument();
    await waitFor(() => expect(requests.length).toBeGreaterThan(3));
    server.events.removeListener('request:start', record);

    const duplicates = requests.filter((path, index) => requests.indexOf(path) !== index);
    expect(duplicates).toEqual([]);
    expect(requests.filter((path) => path === '/api/v1/me/')).toHaveLength(1);
  });

  it('le chapelet relit le cache de l’accueil sans perdre les prières d’ouverture (même clé, même schéma)', async () => {
    // Fixture complète du chapelet (celle de l'accueil n'a pas de mystères détaillés).
    server.use(...paroleHandlers);
    const queryClient = createTestQueryClient();
    const { unmount } = render(
      <QueryClientProvider client={queryClient}>
        <FideleHomePage />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(queryClient.getQueryData(['rosary', 'today'])).toBeDefined());
    unmount();

    render(
      <QueryClientProvider client={queryClient}>
        <ChapeletView />
      </QueryClientProvider>,
    );
    // Avant : l'accueil mettait en cache une version tronquée (sans `standalone_prayers`) et le
    // chapelet guidé plantait en la relisant.
    expect(await screen.findByRole('heading', { level: 2, name: 'Le baptême de Jésus au Jourdain' })).toBeInTheDocument();
    expect(screen.getByText('Dizaine 1 sur 5')).toBeInTheDocument();
  });
});
