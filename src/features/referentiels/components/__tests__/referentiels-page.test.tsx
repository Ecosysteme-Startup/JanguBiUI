import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReferentielsPage } from '@/features/referentiels/components/referentiels-page';
import { grantsPlateforme, ids } from '@/testing/mocks/db';
import { f8bState, resetF8b } from '@/testing/mocks/db-f8b';
import { f8bOverrides } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => {
  resetF8b();
  server.use(...f8bOverrides);
});

describe('Référentiels', () => {
  it('présente le catalogue d’offices, onglet actif dans l’URL', async () => {
    renderApp(<ReferentielsPage tab="offices" />, { capacites: grantsPlateforme });

    const row = (await screen.findByRole('rowheader', { name: 'Chancelier' })).closest('tr')!;
    expect(within(row).getByText('Diocèse')).toBeInTheDocument();
    expect(within(row).getByText('Sous-arbre')).toBeInTheDocument();
    const tabs = screen.getByRole('navigation', { name: 'Référentiels' });
    expect(within(tabs).getByRole('link', { name: /catalogue d.offices/i })).toHaveAttribute('aria-current', 'page');
    expect(within(tabs).getByRole('link', { name: /types de nœuds/i })).toHaveAttribute('href', '/plateforme/referentiels?onglet=types');
  });

  it('montre la matrice offices × capacités', async () => {
    renderApp(<ReferentielsPage tab="capacites" />, { capacites: grantsPlateforme });

    expect(await screen.findByRole('img', { name: 'Chancelier : personnes.verifier' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Curé : personnes.verifier' })).not.toBeInTheDocument();
  });

  it('retire puis rétablit une capacité pour un diocèse', async () => {
    const user = userEvent.setup();
    renderApp(<ReferentielsPage tab="retraits" />, { capacites: grantsPlateforme });

    const form = await screen.findByRole('form', { name: /retirer une capacité/i });
    await user.click(within(form).getByRole('button', { name: 'Retirer la capacité' }));
    expect(await within(form).findByText(/choisissez le diocèse/i)).toBeInTheDocument();

    await user.selectOptions(await within(form).findByLabelText(/diocèse/i), ids.dakar);
    await user.selectOptions(within(form).getByLabelText(/^office/i), 'secretaire_paroissial');
    await user.selectOptions(within(form).getByLabelText(/capacité retirée/i), 'actes.traiter');
    await user.click(within(form).getByRole('button', { name: 'Retirer la capacité' }));
    await waitFor(() =>
      expect(f8bState.requests.at(-1)).toMatchObject({
        method: 'POST',
        body: { diocese_node_id: ids.dakar, office: 'secretaire_paroissial', capability: 'actes.traiter' },
      }),
    );

    await user.click(await screen.findByRole('button', { name: /rétablir horaires.gerer pour curé/i }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Rétablir' }));
    await waitFor(() => expect(f8bState.requests.at(-1)).toMatchObject({ method: 'DELETE' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /rétablir horaires.gerer/i })).not.toBeInTheDocument());
  });
});
