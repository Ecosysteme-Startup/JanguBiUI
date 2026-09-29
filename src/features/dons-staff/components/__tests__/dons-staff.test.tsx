import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createStaffUser } from '@/testing/data-generators';
import { NOEUD_ARCHIDIOCESE } from '@/testing/mocks/handlers/dons-analyse';
import { resetStaffDonsMocks } from '@/testing/mocks/handlers/staff-dons';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, within } from '@/testing/test-utils';

import { DonsParoisse } from '../dons-paroisse';
import { QuetesImperees } from '../quetes-imperees';

const moi = (
  capacites: string[],
  noeud?: { id: string; name: string; type: string },
) =>
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(createStaffUser(capacites, noeud)),
    ),
  );

beforeEach(() => resetStaffDonsMocks());

describe('Dons et quêtes de la paroisse (/v1/staff/dons/)', () => {
  test('fonds : liste du nœud, publication d’un brouillon (dons.gerer_fonds)', async () => {
    moi(['dons.voir_fonds', 'dons.gerer_fonds']);
    let requete = '';
    server.use(
      http.get(`${env.API_URL}/v1/staff/dons/fonds/`, ({ request }) => {
        requete = new URL(request.url).search;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<DonsParoisse />);
    const table = await screen.findByRole('table', {
      name: 'Fonds de Saint-Dominique',
    });
    expect(requete).toContain('node=5d000000-0000-4000-8000-00000000000d');
    const ligne = within(table)
      .getByText('Denier du culte 2027')
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Publier' }));
    expect(
      await within(ligne).findByRole('button', { name: 'Clore' }),
    ).toBeInTheDocument();
    // La quête impérée déclinée n'est pas pilotée par la paroisse.
    const imperee = within(table)
      .getByText('Quête pour les séminaires')
      .closest('tr') as HTMLElement;
    expect(within(imperee).queryByRole('button')).not.toBeInTheDocument();
  });

  test('sans dons.gerer_fonds : aucune action sur les fonds, onglets par capacité', async () => {
    moi(['dons.voir_fonds']);
    renderApp(<DonsParoisse />);
    await screen.findByRole('table', { name: 'Fonds de Saint-Dominique' });
    expect(
      screen.queryByRole('button', { name: /Nouveau fonds/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Opérations' })).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'Quêtes' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'Export' }),
    ).not.toBeInTheDocument();
  });

  test('quêtes : rejet avec motif obligatoire (dons.saisir_quete)', async () => {
    moi(['dons.saisir_quete']);
    const user = userEvent.setup();
    renderApp(<DonsParoisse vue="quetes" />);
    const table = await screen.findByRole('table', {
      name: 'Quêtes en espèces de Saint-Dominique',
    });
    await user.click(within(table).getByRole('button', { name: 'Rejeter' }));
    const confirmer = screen.getByRole('button', { name: 'Confirmer' });
    expect(confirmer).toBeDisabled();
    await user.type(
      screen.getByLabelText('Motif du rejet'),
      'Écart au recomptage.',
    );
    await user.click(confirmer);
    expect(
      await screen.findByText('Rien à afficher pour ce filtre.'),
    ).toBeInTheDocument();
  });

  test('quêtes : la validation par la personne qui a saisi est refusée (four_eyes)', async () => {
    moi(['dons.saisir_quete']);
    server.use(
      http.post(`${env.API_URL}/v1/staff/dons/quetes/:id/valider/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'four_eyes',
              message:
                'La validation revient à une autre personne que la saisie.',
              details: {},
            },
          },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(<DonsParoisse vue="quetes" />);
    const table = await screen.findByRole('table', {
      name: 'Quêtes en espèces de Saint-Dominique',
    });
    await user.click(within(table).getByRole('button', { name: 'Valider' }));
    expect(
      await screen.findAllByText(
        'La validation revient à une autre personne que la saisie.',
      ),
    ).not.toHaveLength(0);
  });

  test('opérations paginées, filtrées par canal', async () => {
    moi(['dons.voir_fonds']);
    let requete = '';
    server.use(
      http.get(`${env.API_URL}/v1/staff/dons/operations/`, ({ request }) => {
        requete = new URL(request.url).search;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<DonsParoisse vue="operations" />);
    const table = await screen.findByRole('table', {
      name: 'Opérations de Saint-Dominique',
    });
    expect(within(table).getByText('JB-2026-00412')).toBeInTheDocument();
    expect(requete).toContain('limit=20');
    await user.click(screen.getByRole('button', { name: 'Espèces' }));
    expect(await within(table).findByText('QU-2026-00040')).toBeInTheDocument();
    expect(requete).toContain('channel=especes');
  });

  test('nomination diocésaine seulement : vue non ouverte (nœud paroisse requis)', async () => {
    moi(['dons.voir_fonds'], {
      id: NOEUD_ARCHIDIOCESE,
      name: 'Archidiocèse de Dakar',
      type: 'diocese',
    });
    renderApp(<DonsParoisse />);
    expect(await screen.findByText('Vue non ouverte')).toBeInTheDocument();
  });
});

describe('Quêtes impérées du diocèse', () => {
  const econome = {
    id: NOEUD_ARCHIDIOCESE,
    name: 'Archidiocèse de Dakar',
    type: 'diocese',
  };

  test('liste, suivi par paroisse (sommes seulement), reversements', async () => {
    moi(['dons.definir_quete_imperee'], econome);
    const user = userEvent.setup();
    renderApp(<QuetesImperees />);
    const table = await screen.findByRole('table', {
      name: 'Quêtes impérées de Archidiocèse de Dakar',
    });
    await user.click(
      within(table).getByRole('button', { name: 'Quête pour les séminaires' }),
    );
    const suivi = await screen.findByRole('table', {
      name: 'Suivi par paroisse',
    });
    expect(within(suivi).getByText('Saint-Dominique')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('tab', { name: 'Reversements' }));
    const reversements = await screen.findByRole('table', {
      name: 'Reversements reçus par Archidiocèse de Dakar',
    });
    expect(
      within(reversements).getByText('WV-PAYOUT-2026-09-26'),
    ).toBeInTheDocument();
  });

  test('définir une quête impérée', async () => {
    moi(['dons.definir_quete_imperee'], econome);
    const user = userEvent.setup();
    renderApp(<QuetesImperees />);
    await user.click(
      await screen.findByRole('button', { name: /Définir une quête impérée/ }),
    );
    await user.type(
      screen.getByLabelText('Intitulé'),
      'Quête pour la Terre sainte',
    );
    await user.type(screen.getByLabelText('Date de la quête'), '2027-03-26');
    await user.click(screen.getByRole('button', { name: 'Définir' }));
    const table = screen.getByRole('table', {
      name: 'Quêtes impérées de Archidiocèse de Dakar',
    });
    expect(
      await within(table).findByRole('button', {
        name: 'Quête pour la Terre sainte',
      }),
    ).toBeInTheDocument();
  });

  test('sans nomination diocésaine : vue non ouverte', async () => {
    moi(['dons.definir_quete_imperee']);
    renderApp(<QuetesImperees />);
    expect(await screen.findByText('Vue non ouverte')).toBeInTheDocument();
  });
});
