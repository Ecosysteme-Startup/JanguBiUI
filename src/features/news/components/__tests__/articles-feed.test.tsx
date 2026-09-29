import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createArticle, createUser } from '@/testing/data-generators';
import {
  PAROISSES,
  resetParoissesMocks,
} from '@/testing/mocks/handlers/paroisses';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArticlesFeed } from '../articles-feed';

const FEED = `${env.API_URL}/v1/news/feed/`;

const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
  {
    id: 2,
    church: { id: 211, name: 'Église B' },
    parish: { id: 21, name: 'Sainte-Anne' },
    diocese: { id: 2, name: 'Diocèse de Thiès' },
    is_primary: false,
  },
];

describe('ArticlesFeed', () => {
  test('shows loading skeleton while fetching the aggregated feed', async () => {
    server.use(
      http.get(FEED, async () => {
        await delay(Infinity);
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderApp(<ArticlesFeed />);

    // eslint-disable-next-line testing-library/no-node-access
    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('renders a single aggregated feed (no Universel/Ma paroisse tabs)', async () => {
    // Le back agrège déjà global ∪ paroisse ∪ diocèse : un seul flux, pas d'onglet.
    const mockArticles = [
      createArticle({
        id: 'a1',
        title: 'Le pape François appelle à la paix',
        scope_type: 'global',
      }),
      createArticle({
        id: 'p1',
        title: 'Réunion du conseil paroissial',
        scope_type: 'parish',
      }),
    ];
    server.use(
      http.get(FEED, () =>
        HttpResponse.json({
          count: mockArticles.length,
          results: mockArticles,
        }),
      ),
    );

    renderApp(<ArticlesFeed />);

    // Articles de portées différentes affichés dans le MÊME flux.
    await screen.findByText('Le pape François appelle à la paix');
    expect(
      screen.getByText('Réunion du conseil paroissial'),
    ).toBeInTheDocument();
    // Plus aucun onglet.
    expect(
      screen.queryByRole('button', { name: /ma paroisse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /universel/i }),
    ).not.toBeInTheDocument();
  });

  test('renders church-scoped articles without erroring (scope_type "church")', async () => {
    // Anti-régression : le back émet des articles de portée "church" (Chantier 3a).
    // L'enum Zod front doit l'accepter, sinon articleSchema.parse throw → page d'erreur.
    const mockArticles = [
      createArticle({
        id: 'c1',
        title: 'Veillée de prière — Cathédrale du Souvenir',
        scope_type: 'church',
        scope_church_id: 5,
      }),
    ];
    server.use(
      http.get(FEED, () =>
        HttpResponse.json({
          count: mockArticles.length,
          results: mockArticles,
        }),
      ),
    );

    renderApp(<ArticlesFeed />);

    await screen.findByText('Veillée de prière — Cathédrale du Souvenir');
    expect(
      screen.queryByText(/impossible de charger les actualités/i),
    ).not.toBeInTheDocument();
  });

  test('shows empty state when the feed is empty', async () => {
    server.use(
      http.get(FEED, () => HttpResponse.json({ count: 0, results: [] })),
    );

    renderApp(<ArticlesFeed />);

    expect(await screen.findByText(/^aucune actualité$/i)).toBeInTheDocument();
  });

  test('shows error message when the feed request fails', async () => {
    server.use(http.get(FEED, () => HttpResponse.error()));

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/impossible de charger les actualités/i),
    ).toBeInTheDocument();
  });

  test('filtre « Église A » → envoie scope_type=church&scope_id et restreint le fil', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
      ),
      http.get(FEED, ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (
          params.get('scope_type') === 'church' &&
          params.get('scope_id') === '111'
        ) {
          return HttpResponse.json({
            count: 1,
            results: [
              createArticle({
                id: 'churchA',
                title: 'Veillée Église A',
                scope_type: 'church',
                scope_church_id: 111,
              }),
            ],
          });
        }
        // Sans filtre (« Tous ») → agrégat.
        return HttpResponse.json({
          count: 2,
          results: [
            createArticle({
              id: 'g1',
              title: 'Article Universel',
              scope_type: 'global',
            }),
            createArticle({
              id: 'churchA',
              title: 'Veillée Église A',
              scope_type: 'church',
              scope_church_id: 111,
            }),
          ],
        });
      }),
    );

    renderApp(<ArticlesFeed />);

    // Agrégat au départ (« Tous »).
    await screen.findByText('Article Universel');
    expect(screen.getByText('Veillée Église A')).toBeInTheDocument();

    // Sélection du filtre « Église A ».
    await userEvent.click(
      await screen.findByRole('button', { name: 'Église A' }),
    );

    // Le fil est restreint à la portée église A (l'article universel disparaît).
    await screen.findByText('Veillée Église A');
    await waitFor(() =>
      expect(screen.queryByText('Article Universel')).not.toBeInTheDocument(),
    );
  });

  test('fil « Autres paroisses » : annonces des secondaires, sans notification, filtrables', async () => {
    resetParoissesMocks();
    const demandes: (string | null)[] = [];
    server.use(
      http.get(FEED, () => HttpResponse.json({ count: 0, results: [] })),
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
    await waitFor(() =>
      expect(demandes).toContain(PAROISSES.saintPierre.id),
    );
    await waitFor(() =>
      expect(
        within(
          screen.getByRole('list', { name: 'Annonces des autres paroisses' }),
        ).getAllByRole('listitem'),
      ).toHaveLength(2),
    );
  });
});
