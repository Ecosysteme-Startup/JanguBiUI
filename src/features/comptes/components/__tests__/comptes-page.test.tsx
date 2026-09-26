import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ComptesPage } from '@/features/comptes/components/comptes-page';
import { grantsPlateforme } from '@/testing/mocks/db';
import { f8bIds, f8bState, resetF8b } from '@/testing/mocks/db-f8b';
import { renderApp } from '@/testing/test-utils';
import { f8bHandlers } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8bHandlers));

beforeEach(() => resetF8b());

describe('Comptes', () => {
  it('verrouille un compte seulement après confirmation', async () => {
    const user = userEvent.setup();
    renderApp(<ComptesPage />, { capacites: grantsPlateforme });

    const panel = await screen.findByRole('region', { name: 'Mme Germaine Faye' });
    expect(within(panel).getByText('Secrétaire paroissiale')).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'Verrouiller le compte' }));

    const dialog = await screen.findByRole('dialog', { name: /verrouiller ce compte/i });
    expect(f8bState.requests).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(f8bState.requests).toHaveLength(0);

    await user.click(within(panel).getByRole('button', { name: 'Verrouiller le compte' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Verrouiller le compte' }));

    await waitFor(() => expect(f8bState.requests.at(-1)?.url).toContain(`/platform/accounts/${f8bIds.accountFaye}/lock/`));
    expect(await within(panel).findByRole('button', { name: 'Déverrouiller le compte' })).toBeInTheDocument();
    const row = screen.getByRole('button', { name: 'Mme Germaine Faye' }).closest('tr')!;
    expect(await within(row).findByText('Verrouillé')).toBeInTheDocument();
  });

  it('filtre les comptes et ouvre une autre fiche', async () => {
    const user = userEvent.setup();
    renderApp(<ComptesPage />, { capacites: grantsPlateforme });

    await user.selectOptions(await screen.findByLabelText('Statut'), 'verrouille');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Mme Germaine Faye' })).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Pierre Ndour' }));

    const panel = await screen.findByRole('region', { name: 'Pierre Ndour' });
    expect(within(panel).getByText('Aucune nomination.')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Forcer la MFA' })).toBeInTheDocument();
  });

  it('ne prétend jamais à un chiffrement de bout en bout', async () => {
    const { container } = renderApp(<ComptesPage />, { capacites: grantsPlateforme });
    expect(await screen.findByText(/aucun administrateur n.y a accès/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/bout en bout/i);
  });

  it('filtre par rôle avec les onglets', async () => {
    const user = userEvent.setup();
    renderApp(<ComptesPage />, { capacites: grantsPlateforme });

    expect(await screen.findByRole('button', { name: 'Pierre Ndour' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^staff/i }));

    expect(screen.getByRole('tab', { name: /^staff/i })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Pierre Ndour' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Mme Germaine Faye' })).toBeInTheDocument();
  });
});
