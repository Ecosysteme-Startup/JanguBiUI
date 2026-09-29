import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import {
  PAROISSES,
  resetParoissesMocks,
} from '@/testing/mocks/handlers/paroisses';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArticlesFeed } from '../articles-feed';

// Fil « Ma paroisse » : contrat réel `GET /me/feed/`
// (apps/news ArticleListOutputSerializer, pagination LimitOffset).
const FEED = `${env.API_URL}/v1/me/feed/`;

const article = (overrides: Record<string, unknown> = {}) => ({
  id: crypto.randomUUID(),
  content_type: 'announcement',
  title: 'Annonce',
  slug: 'annonce',
  excerpt: '',
  content_format: 'markdown',
  category: null,
  author_name: 'Secrétariat',
  scope: { node_id: null, node_name: null, place_id: null, place_name: null },
  is_sunday_notice: false,
  sunday_date: null,
  cover_image_url: null,
  cover_image_alt: '',
  cover_image_decorative: true,
  published_at: '2026-09-26T18:00:00Z',
  reactions: { counts: { pray: 0, amen: 0, attend: 0 }, mine: [] },
  ...overrides,
});

const page = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

beforeEach(() => {
  vi.stubEnv('TEST', 'true');
  resetParoissesMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe('ArticlesFeed', () => {
  test('squelette pendant le chargement de me/feed/', async () => {
    server.use(
      http.get(FEED, async () => {
        await delay(Infinity);
        return HttpResponse.json(page([]));
      }),
    );
    renderApp(<ArticlesFeed />);
    // eslint-disable-next-line testing-library/no-node-access
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  test('fil « Ma paroisse » (mocks) : paroisse principale, diocèse et global, par date', async () => {
    let params: URLSearchParams | null = null;
    server.use(
      http.get(FEED, ({ request }) => {
        params = new URL(request.url).searchParams;
        return undefined;
      }),
    );
    renderApp(<ArticlesFeed />);
    expect(
      await screen.findByText('Messe des familles dimanche 4 octobre'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Lettre pastorale pour la rentrée'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Journée mondiale du migrant et du réfugié'),
    ).toBeInTheDocument();
    // Portée affichée ; les annonces des secondaires n'y sont pas.
    expect(screen.getAllByText('Saint-Dominique').length).toBeGreaterThan(0);
    expect(screen.getByText('Archidiocèse de Dakar')).toBeInTheDocument();
    expect(
      screen.queryByText('Ouverture du mois du Rosaire'),
    ).not.toBeInTheDocument();
    expect(params!.get('limit')).toBe('20');
    // Plus de filtre de portée (le contrat n'en a pas), aucun compteur de lectures.
    expect(
      screen.queryByRole('group', { name: 'Filtrer par portée' }),
    ).not.toBeInTheDocument();
  });

  test('tolère les champs facultatifs (type inconnu, portée globale, sans date)', async () => {
    server.use(
      http.get(FEED, () =>
        HttpResponse.json(
          page([
            article({
              title: 'Méditation du jour',
              content_type: 'meditation',
              published_at: null,
              category: {
                id: 3,
                name: 'Prière',
                slug: 'priere',
                icon: null,
                color: null,
                display_order: 0,
              },
            }),
          ]),
        ),
      ),
    );
    renderApp(<ArticlesFeed />);
    expect(await screen.findByText('Méditation du jour')).toBeInTheDocument();
    expect(
      screen.queryByText(/impossible de charger les actualités/i),
    ).not.toBeInTheDocument();
  });

  test('état vide', async () => {
    server.use(http.get(FEED, () => HttpResponse.json(page([]))));
    renderApp(<ArticlesFeed />);
    expect(await screen.findByText(/^aucune actualité$/i)).toBeInTheDocument();
  });

  test('erreur réseau', async () => {
    server.use(http.get(FEED, () => HttpResponse.error()));
    renderApp(<ArticlesFeed />);
    expect(
      await screen.findByText(/impossible de charger les actualités/i),
    ).toBeInTheDocument();
  });

  test('fil « Autres paroisses » : annonces des secondaires, sans notification, filtrables', async () => {
    resetParoissesMocks();
    const demandes: (string | null)[] = [];
    server.use(
      http.get(`${env.API_URL}/v1/me/feed/secondaires/`, ({ request }) => {
        demandes.push(new URL(request.url).searchParams.get('paroisse'));
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<ArticlesFeed />);

    const onglet = await screen.findByRole('tab', {
      name: 'Autres paroisses',
    });
    expect(screen.getByRole('tab', { name: 'Ma paroisse' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(onglet);

    const liste = await screen.findByRole('list', {
      name: 'Annonces des autres paroisses',
    });
    const annonces = within(liste).getAllByRole('listitem');
    expect(annonces).toHaveLength(4);
    // Triées par date, avec le nom de la paroisse.
    expect(annonces[0]).toHaveTextContent('Ouverture du mois du Rosaire');
    expect(annonces[0]).toHaveTextContent(
      'Cathédrale Notre-Dame-des-Victoires',
    );
    expect(annonces[1]).toHaveTextContent('Kermesse paroissiale');
    expect(screen.getByText(/sans notification/)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Saint-Pierre des Baobabs' }),
    );
    await waitFor(() => expect(demandes).toContain(PAROISSES.saintPierre.id));
    await waitFor(() =>
      expect(
        within(
          screen.getByRole('list', { name: 'Annonces des autres paroisses' }),
        ).getAllByRole('listitem'),
      ).toHaveLength(2),
    );
  });
});
