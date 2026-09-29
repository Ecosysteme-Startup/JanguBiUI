import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { resetParoissesMocks } from '@/testing/mocks/handlers/paroisses';
import { server } from '@/testing/mocks/server';
import {
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@/testing/test-utils';

import { MesParoisses } from '../mes-paroisses';

beforeEach(() => {
  vi.stubEnv('TEST', 'true');
  resetParoissesMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe('Mes paroisses (profil)', () => {
  test('principale, autres paroisses et encadrés (maquette WEB-FID-Mes-Paroisses)', async () => {
    renderApp(<MesParoisses />);
    expect(await screen.findByText('Saint-Dominique')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Point E · doyenné Plateau-Médina · membre depuis le 3 septembre 2026',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Principale')).toBeInTheDocument();
    const autres = screen.getByRole('list', { name: 'Autres paroisses' });
    const lignes = within(autres).getAllByRole('listitem');
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toHaveTextContent('Cathédrale Notre-Dame-des-Victoires');
    expect(lignes[0]).toHaveTextContent(
      'Plateau · ajoutée le 8 septembre 2026',
    );
    expect(lignes[1]).toHaveTextContent('Saint-Pierre des Baobabs');
    expect(
      screen.getByRole('heading', {
        name: 'Ce que change la paroisse principale',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Une adhésion libre' }),
    ).toBeInTheDocument();
  });

  test('recherche « Médina » puis « Ajouter » : Saint-Joseph de Médina devient secondaire', async () => {
    let corps: unknown = null;
    server.use(
      http.post(`${env.API_URL}/v1/me/paroisses/`, async ({ request }) => {
        corps = await request.clone().json();
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<MesParoisses />);
    await screen.findByText('Saint-Dominique');
    await user.type(
      screen.getByRole('searchbox', {
        name: 'Rechercher une paroisse à ajouter',
      }),
      'Médina',
    );
    const trouvees = await screen.findByRole('list', {
      name: 'Paroisses trouvées',
    });
    expect(
      within(trouvees).getByText('Saint-Joseph de Médina'),
    ).toBeInTheDocument();
    await user.click(
      within(trouvees).getByRole('button', {
        name: 'Ajouter Saint-Joseph de Médina',
      }),
    );
    await waitFor(() =>
      expect(corps).toEqual({
        paroisse_id: '5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e02',
        principale: false,
      }),
    );
    const autres = await screen.findByRole('list', {
      name: 'Autres paroisses',
    });
    await waitFor(() =>
      expect(within(autres).getAllByRole('listitem')).toHaveLength(3),
    );
    expect(within(trouvees).getByText('Ajoutée')).toBeInTheDocument();
    // La principale ne change pas.
    expect(
      screen.getAllByText('Principale')[0].closest('div'),
    ).toHaveTextContent('Saint-Dominique');
  });

  test('définir comme principale, puis quitter (avec confirmation)', async () => {
    const user = userEvent.setup();
    renderApp(<MesParoisses />);
    await screen.findByText('Saint-Dominique');
    await user.click(
      screen.getByRole('button', {
        name: 'Définir Saint-Pierre des Baobabs comme principale',
      }),
    );
    await waitFor(() =>
      expect(
        within(
          screen.getByRole('list', { name: 'Autres paroisses' }),
        ).getByText('Saint-Dominique'),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Quitter Cathédrale Notre-Dame-des-Victoires',
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Quitter Cathédrale Notre-Dame-des-Victoires ?',
    });
    expect(dialog).toHaveTextContent('retirés de vos appareils');
    await user.click(
      within(dialog).getByRole('button', { name: 'Quitter la paroisse' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByText('Cathédrale Notre-Dame-des-Victoires'),
      ).not.toBeInTheDocument(),
    );
  });

  test('retiré par la paroisse : message sobre', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/me/paroisses/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'retire_par_la_paroisse',
              message: 'Retiré.',
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<MesParoisses />);
    await screen.findByText('Saint-Dominique');
    await user.type(
      screen.getByRole('searchbox', {
        name: 'Rechercher une paroisse à ajouter',
      }),
      'Thérèse',
    );
    await user.click(
      await screen.findByRole('button', {
        name: 'Ajouter Sainte-Thérèse de Grand-Dakar',
      }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cette paroisse vous a retiré de ses membres.',
    );
  });
});
