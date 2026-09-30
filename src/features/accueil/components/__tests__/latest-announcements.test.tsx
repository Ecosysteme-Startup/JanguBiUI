import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { getMeFeed } from '@/features/accueil/api/get-me-feed';
import { LatestAnnouncements } from '@/features/accueil/components/latest-announcements';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetF5bState } from '@/testing/mocks/db-f5b';
import { f5bHandlers } from '@/testing/mocks/handlers/f5b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f5bHandlers));
beforeEach(() => resetF5bState());

describe('Accueil fidèle : « Dernières annonces » sur le fil /me/feed/', () => {
  it('affiche les trois premières entrées du fil, épinglées en tête, avec leur provenance', async () => {
    renderApp(<LatestAnnouncements />);

    const section = screen.getByRole('region', { name: 'Dernières annonces' });
    const rows = await within(section).findAllByRole('listitem');
    expect(rows).toHaveLength(3);

    // Épinglées d’abord : la lettre du diocèse, puis la quête de la paroisse.
    expect(within(rows[0]).getByText('Épinglée')).toBeInTheDocument();
    expect(within(rows[0]).getByText(/archidiocèse de dakar · diocèse/i)).toBeInTheDocument();
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/app/paroisse/annonces/1a000000-0000-4000-8000-000000000010');
    expect(within(rows[1]).getByText('Épinglée')).toBeInTheDocument();
    expect(within(rows[1]).getByText(/saint-dominique · quête/i)).toBeInTheDocument();
    expect(within(rows[2]).queryByText('Épinglée')).not.toBeInTheDocument();
    expect(within(section).getByRole('link', { name: 'Toutes les annonces' })).toHaveAttribute('href', '/app/paroisse#annonces');
  });

  it('nomme « Jàngu Bi » la provenance d’un contenu global', async () => {
    const page = await getMeFeed({ limit: 5 });
    const global = page.results.find((a) => a.scope?.node_id === null);
    expect(global?.title).toMatch(/parole du jour à écouter/i);

    server.use(
      http.get(apiUrl('/me/feed/'), () =>
        HttpResponse.json({ limit: 3, offset: 0, count: 1, next: null, previous: null, results: [global] }),
      ),
    );
    renderApp(<LatestAnnouncements />);
    const section = screen.getByRole('region', { name: 'Dernières annonces' });
    expect(await within(section).findByText(/^jàngu bi · jàngu bi/i)).toBeInTheDocument();
  });

  it('remet les épinglées en tête même si le serveur les renvoie plus bas', async () => {
    server.use(
      http.get(apiUrl('/me/feed/'), () =>
        HttpResponse.json({
          limit: 3,
          offset: 0,
          count: 2,
          next: null,
          previous: null,
          results: [
            { id: 'a', title: 'Récente', excerpt: '', category: null, scope: { node_id: null, node_name: null }, is_pinned: false, published_at: null },
            { id: 'b', title: 'Épinglée plus ancienne', excerpt: '', category: null, scope: { node_id: null, node_name: null }, is_pinned: true, published_at: null },
          ],
        }),
      ),
    );
    const page = await getMeFeed();
    expect(page.results.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it('dit que le fil est vide', async () => {
    server.use(http.get(apiUrl('/me/feed/'), () => HttpResponse.json({ limit: 3, offset: 0, count: 0, next: null, previous: null, results: [] })));
    renderApp(<LatestAnnouncements />);
    expect(await screen.findByText('Aucune annonce publiée pour le moment.')).toBeInTheDocument();
  });
});
