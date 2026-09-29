import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createStaffUser } from '@/testing/data-generators';
import { resetStaffMocks } from '@/testing/mocks/handlers/staff';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, within } from '@/testing/test-utils';

import { StaffActeDetail } from '../staff-acte-detail';
import { StaffActesFile } from '../staff-actes-file';

const secretaire = createStaffUser(['actes.traiter']);

beforeEach(() => {
  resetStaffMocks();
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () => HttpResponse.json(secretaire)),
  );
});

describe('Demandes d’actes (staff, actes.traiter)', () => {
  test('file paginée de /staff/documents/, filtrée par statut', async () => {
    let requete = '';
    server.use(
      http.get(`${env.API_URL}/v1/staff/documents/`, ({ request }) => {
        requete = new URL(request.url).search;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<StaffActesFile />);
    const table = await screen.findByRole('table', {
      name: 'Demandes d’actes de Saint-Dominique',
    });
    expect(within(table).getByText('SD-2026-0142')).toBeInTheDocument();
    expect(requete).toContain(`node=${secretaire.capability_nodes![0].node_id}`);
    expect(requete).toContain('limit=20');

    await user.click(screen.getByRole('button', { name: /Prête à retirer/ }));
    expect(
      await within(table).findByText('SD-2026-0131'),
    ).toBeInTheDocument();
    expect(requete).toContain('status=ready_for_pickup');
    expect(within(table).queryByText('SD-2026-0142')).not.toBeInTheDocument();
  });

  test('sans nomination : vue non ouverte', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createStaffUser([])),
      ),
    );
    renderApp(<StaffActesFile />);
    expect(await screen.findByText('Vue non ouverte')).toBeInTheDocument();
  });

  test('détail : rejet avec motif obligatoire, puis historique', async () => {
    const user = userEvent.setup();
    renderApp(
      <StaffActeDetail acteId="a1000000-0000-4000-8000-000000000001" />,
    );
    expect(await screen.findByText('SD-2026-0142')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Rejeter' }));
    const confirmer = screen.getByRole('button', { name: 'Confirmer' });
    expect(confirmer).toBeDisabled();
    await user.type(
      screen.getByLabelText(/Motif du rejet/),
      'Aucun baptême à ce nom au registre.',
    );
    await user.click(confirmer);
    expect(await screen.findAllByText('Rejetée')).not.toHaveLength(0);
    expect(
      screen.getByText('Aucun baptême à ce nom au registre.', {
        selector: 'dd',
      }),
    ).toBeInTheDocument();
  });

  test('détail : note interne ajoutée', async () => {
    const user = userEvent.setup();
    renderApp(
      <StaffActeDetail acteId="a1000000-0000-4000-8000-000000000002" />,
    );
    await user.type(
      await screen.findByLabelText('Nouvelle note'),
      'Registre 1988 consulté.',
    );
    await user.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(
      await screen.findByText('Registre 1988 consulté.'),
    ).toBeInTheDocument();
  });

  test('détail introuvable : message dédié', async () => {
    renderApp(<StaffActeDetail acteId="inconnue" />);
    expect(await screen.findByText('Demande introuvable')).toBeInTheDocument();
  });
});
