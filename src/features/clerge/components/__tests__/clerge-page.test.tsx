import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClergePage } from '@/features/clerge/components/clerge-page';
import { grantsChancelier } from '@/testing/mocks/db';
import { f8bIds, f8bState, resetF8b } from '@/testing/mocks/db-f8b';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => resetF8b());

describe('Clergé', () => {
  it('exige un motif pour refuser une déclaration', async () => {
    const user = userEvent.setup();
    renderApp(<ClergePage />, { capacites: grantsChancelier });

    expect(await screen.findByRole('heading', { level: 2, name: 'luc.bassene@example.sn' })).toBeInTheDocument();
    expect(screen.getByText('Société du Verbe Divin', { selector: 'dd' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refuser' }));

    const dialog = await screen.findByRole('dialog', { name: /refuser cette déclaration/i });
    await user.click(within(dialog).getByRole('button', { name: 'Refuser la déclaration' }));
    expect(await within(dialog).findByText(/indiquez le motif du refus/i)).toBeInTheDocument();
    expect(f8bState.requests).toHaveLength(0);

    await user.type(within(dialog).getByLabelText(/motif du refus/i), 'Lettre d’obédience non confirmée.');
    await user.click(within(dialog).getByRole('button', { name: 'Refuser la déclaration' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(f8bState.requests.at(-1)).toMatchObject({
      url: expect.stringContaining(`/hierarchy/verifications/${f8bIds.prePersonne}/decision/`),
      body: { decision: 'rejete', note: 'Lettre d’obédience non confirmée.' },
    });
    expect(await screen.findByText('Aucune déclaration en attente')).toBeInTheDocument();
  });

  it('valide le statut de clerc', async () => {
    const user = userEvent.setup();
    renderApp(<ClergePage />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Valider le statut de clerc' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(f8bState.requests.at(-1)).toMatchObject({ body: { decision: 'verifie', note: '' } }));
  });
});
