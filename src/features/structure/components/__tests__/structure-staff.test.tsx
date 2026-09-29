import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { ComptesPlateforme } from '@/features/users/components/comptes-plateforme';
import { createStaffUser } from '@/testing/data-generators';
import { NOEUD_ARCHIDIOCESE } from '@/testing/mocks/handlers/dons-analyse';
import { resetStaffStructureMocks } from '@/testing/mocks/handlers/staff-structure';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, within } from '@/testing/test-utils';

import { JournalAudit } from '../journal-audit';
import { Nominations } from '../nominations';
import { Structure } from '../structure';

const moi = (
  capacites: string[],
  noeud?: { id: string; name: string; type: string },
) =>
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () =>
      HttpResponse.json(createStaffUser(capacites, noeud)),
    ),
  );

beforeEach(() => resetStaffStructureMocks());

describe('Écrans staff « structure » sur /v1/hierarchy/', () => {
  test('structure : enfants du nœud de la nomination, descente dans l’arbre', async () => {
    moi(['structure.gerer'], {
      id: NOEUD_ARCHIDIOCESE,
      name: 'Archidiocèse de Dakar',
      type: 'diocese',
    });
    const user = userEvent.setup();
    renderApp(<Structure />);
    const table = await screen.findByRole('table', {
      name: 'Rattachés à Archidiocèse de Dakar',
    });
    await user.click(
      within(table).getByRole('button', { name: /Doyenné Plateau-Médina/ }),
    );
    const enfants = await screen.findByRole('table', {
      name: 'Rattachés à Doyenné Plateau-Médina',
    });
    expect(within(enfants).getByText('Saint-Dominique')).toBeInTheDocument();
  });

  test('nominations : liste paginée du nœud, fin d’une nomination', async () => {
    moi(['offices.nommer']);
    let requete = '';
    server.use(
      http.get(`${env.API_URL}/v1/hierarchy/assignments/`, ({ request }) => {
        requete = new URL(request.url).search;
        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp(<Nominations />);
    const table = await screen.findByRole('table', {
      name: 'Offices de Saint-Dominique',
    });
    expect(requete).toContain('status=active');
    expect(requete).toContain('limit=50');
    const ligne = within(table)
      .getByText('Cécile Coly')
      .closest('tr') as HTMLElement;
    await user.click(within(ligne).getByRole('button', { name: 'Mettre fin' }));
    await user.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(await within(table).findByText('Emmanuel Tine')).toBeInTheDocument();
    expect(within(table).queryByText('Cécile Coly')).not.toBeInTheDocument();
  });

  test('journal d’audit (audit.voir)', async () => {
    moi(['audit.voir']);
    renderApp(<JournalAudit />);
    const table = await screen.findByRole('table', { name: 'Journal d’audit' });
    expect(within(table).getByText('dons.quete_saisie')).toBeInTheDocument();
  });

  test('comptes plateforme (plateforme.admin)', async () => {
    moi(['plateforme.admin']);
    renderApp(<ComptesPlateforme />);
    const table = await screen.findByRole('table', {
      name: 'Comptes de la plateforme',
    });
    expect(within(table).getByText('Marie-Thérèse Diouf')).toBeInTheDocument();
  });
});
