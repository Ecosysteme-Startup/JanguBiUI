import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { backofficeNav } from '@/config/nav';
import type { Grant } from '@/lib/capacites';
import { resetParoissesMocks } from '@/testing/mocks/handlers/paroisses';
import { server } from '@/testing/mocks/server';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/testing/test-utils';

import { ParoissiensStaff } from '../paroissiens-staff';

const NOEUD = '5d000000-0000-4000-8000-00000000000d';

/** Secrétariat de Saint-Dominique : `paroissiens.gerer` sur la paroisse. */
const SECRETARIAT: Grant[] = [
  {
    capacite: 'paroissiens.gerer',
    node_id: NOEUD,
    node_name: 'Saint-Dominique',
    node_type: 'paroisse',
    herite: true,
    office: 'secretaire_paroissial',
    office_label: 'Secrétaire paroissiale',
  },
];

beforeEach(() => {
  vi.stubEnv('TEST', 'true');
  resetParoissesMocks();
});
afterEach(() => vi.unstubAllEnvs());

describe('Paroissiens (staff, paroissiens.gerer)', () => {
  test('liste alphabétique, retrait confirmé puis rétablissement', async () => {
    let retrait = '';
    server.use(
      http.delete(
        `${env.API_URL}/hierarchy/nodes/:id/membres/:userId/`,
        ({ params }) => {
          retrait = `${String(params.id)}/${String(params.userId)}`;
          return undefined;
        },
      ),
    );
    const user = userEvent.setup();
    renderApp(<ParoissiensStaff nodeId={NOEUD} />, { capacites: SECRETARIAT });
    const table = await screen.findByRole('table', {
      name: 'Paroissiens de Saint-Dominique',
    });
    const noms = within(table)
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[0].textContent);
    expect(noms).toEqual([
      'Michel Badji',
      'Paul Diatta',
      'Marie-Thérèse Diouf',
      'Awa Faye',
      'Élisabeth Gomis',
      'Joseph Mendy',
      'Fatou Sarr',
    ]);
    expect(screen.getByText('7 membres')).toBeInTheDocument();

    await user.click(
      within(table).getByRole('button', { name: 'Retirer Joseph Mendy' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Retirer Joseph Mendy des paroissiens ?',
    });
    expect(dialog).toHaveTextContent('ni s’y réinscrire seule');
    await user.click(within(dialog).getByRole('button', { name: 'Retirer' }));
    await waitFor(() =>
      expect(screen.queryByText('Joseph Mendy')).not.toBeInTheDocument(),
    );
    expect(retrait).toBe(`${NOEUD}/0c7b0000-0000-4000-8000-000000000004`);

    await user.click(screen.getByRole('tab', { name: 'Retirés' }));
    const retires = await screen.findByRole('table', {
      name: 'Membres retirés de Saint-Dominique',
    });
    expect(within(retires).getByText('Ibrahima Ndour')).toBeInTheDocument();
    await user.click(
      within(retires).getByRole('button', { name: 'Rétablir Joseph Mendy' }),
    );
    await waitFor(() =>
      expect(screen.queryByText('Joseph Mendy')).not.toBeInTheDocument(),
    );
  });

  test('recherche par nom', async () => {
    const user = userEvent.setup();
    renderApp(<ParoissiensStaff nodeId={NOEUD} />, { capacites: SECRETARIAT });
    await screen.findByRole('table');
    await user.type(
      screen.getByRole('searchbox', { name: 'Rechercher un paroissien' }),
      'faye',
    );
    await waitFor(() =>
      expect(screen.getByText('1 membre')).toBeInTheDocument(),
    );
    expect(screen.getByText('Awa Faye')).toBeInTheDocument();
  });

  test('entrée « Paroissiens » du back-office paroisse, avec la capacité paroissiens.gerer', () => {
    const item = backofficeNav('paroisse', NOEUD)
      .flatMap((g) => g.items)
      .find((i) => i.label === 'Paroissiens');
    expect(item?.capacites).toEqual(['paroissiens.gerer']);
  });
});
