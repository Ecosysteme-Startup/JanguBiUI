import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';

import ParametresPage from '@/app/espace/[nodeId]/parametres/page';
import type { Grant } from '@/lib/capacites';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { f8aState, resetF8a } from '@/testing/mocks/db-f8a';
import { f8aOverrides, v1Error } from '@/testing/mocks/handlers/f8a';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f8aHandlers } from '@/testing/mocks/handlers/f8a';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8aHandlers));

/** Chancelier du diocèse : `structure.gerer` héritée sur la paroisse. */
const grantsStructure: Grant[] = [...grantsSecretaire, { ...grantsSecretaire[0], capacite: 'structure.gerer', office: 'chancelier' }];

const renderPage = async (capacites: Grant[]) =>
  renderApp(await ParametresPage({ params: Promise.resolve({ nodeId: ids.saintDominique }) }), { capacites });

beforeEach(() => {
  resetF8a();
  server.use(...f8aOverrides);
});

describe('Paramètres (PAR-Parametres)', () => {
  it('présente l’identité, les lieux de culte et les CEB rattachées', async () => {
    await renderPage(grantsSecretaire);

    expect(await screen.findByRole('heading', { name: 'Paramètres de la paroisse', level: 1 })).toBeInTheDocument();
    const identity = screen.getByRole('region', { name: /identité/i });
    expect(within(identity).getByText('Saint-Dominique')).toBeInTheDocument();
    expect(within(identity).getByText('Érigé, le 07.10.1956')).toBeInTheDocument();
    expect(await within(identity).findByText('Archidiocèse de Dakar')).toBeInTheDocument();
    expect(await screen.findByText('Chapelle de la Cité universitaire')).toBeInTheDocument();
    expect(await screen.findByText('CEB Saint-Charles-Lwanga')).toBeInTheDocument();
  });

  it('reste en lecture seule sans structure.gerer (exigée par le serveur pour modifier le nœud)', async () => {
    await renderPage(grantsSecretaire);

    expect(await screen.findByText('Modification réservée à la chancellerie')).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
  });

  it('enregistre l’adresse avec structure.gerer', async () => {
    const user = userEvent.setup();
    await renderPage(grantsStructure);

    const address = await screen.findByLabelText('Adresse');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await user.clear(address);
    await user.type(address, 'Rue de Fatick, Point E, Dakar');
    expect(screen.getByText('1 modification')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Paramètres enregistrés.')).toBeInTheDocument();
    expect(f8aState.lastBody).toEqual({ address: 'Rue de Fatick, Point E, Dakar', city: 'Dakar' });
  });

  it('affiche proprement un refus du serveur', async () => {
    server.use(http.patch(apiUrl('/hierarchy/nodes/:nodeId/'), () => v1Error(403, 'permission_denied', 'Vous n’avez pas la capacité requise sur ce nœud.')));
    const user = userEvent.setup();
    await renderPage(grantsStructure);

    await user.type(await screen.findByLabelText('Ville'), ' Plateau');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Vous n’avez pas la capacité de modifier ce nœud.')).toBeInTheDocument();
  });

  it('refuse l’écran sans horaires.gerer', async () => {
    await renderPage(grantsSecretaire.filter((g) => g.capacite !== 'horaires.gerer'));

    expect(await screen.findByText('Paramètres : accès réservé')).toBeInTheDocument();
  });
});
