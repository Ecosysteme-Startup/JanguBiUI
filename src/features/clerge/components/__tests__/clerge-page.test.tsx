import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClergePage } from '@/features/clerge/components/clerge-page';
import { grantsChancelier } from '@/testing/mocks/db';
import { f8bIds, f8bState, resetF8b } from '@/testing/mocks/db-f8b';
import { renderApp } from '@/testing/test-utils';
import { f8bHandlers } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8bHandlers));

beforeEach(() => resetF8b());

describe('Clergé', () => {
  it('exige un motif pour refuser une déclaration', async () => {
    const user = userEvent.setup();
    renderApp(<ClergePage />, { capacites: grantsChancelier });

    expect(await screen.findByRole('heading', { level: 2, name: 'Père Luc Bassène' })).toBeInTheDocument();
    expect(screen.getByText('Société du Verbe Divin', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText(/déclaration reçue le 22\.09 à/i)).toBeInTheDocument();
    expect(screen.getByText('Justificatifs · 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /celebret-2026\.pdf/ })).toHaveAttribute('href', 'https://files.example.sn/celebret-2026.pdf');
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
    const list = screen.getByRole('table');
    await waitFor(() => expect(within(list).queryByText('Père Luc Bassène')).not.toBeInTheDocument());
    expect(within(list).getByText('Père Basile Ndione')).toBeInTheDocument();
  });

  it('demande un complément, motif obligatoire, et garde la déclaration en attente', async () => {
    const user = userEvent.setup();
    renderApp(<ClergePage />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Demander un complément' }));
    const dialog = await screen.findByRole('dialog', { name: /demander un complément/i });
    await user.click(within(dialog).getByRole('button', { name: 'Envoyer la demande' }));
    expect(await within(dialog).findByText(/indiquez ce qui manque/i)).toBeInTheDocument();
    expect(f8bState.requests).toHaveLength(0);

    await user.type(within(dialog).getByLabelText(/ce qui manque/i), 'Joindre la lettre du provincial.');
    await user.click(within(dialog).getByRole('button', { name: 'Envoyer la demande' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(f8bState.requests.at(-1)).toMatchObject({
      url: expect.stringContaining(`/hierarchy/verifications/${f8bIds.prePersonne}/decision/`),
      body: { decision: 'complement', note: 'Joindre la lettre du provincial.' },
    });
    const row = (await screen.findByRole('button', { name: 'Père Luc Bassène' })).closest('tr')!;
    expect(await within(row).findByText('Complément demandé')).toBeInTheDocument();
  });

  it('montre une déclaration en attente de complément avec son motif', async () => {
    const user = userEvent.setup();
    renderApp(<ClergePage />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Père Basile Ndione' }));

    const panel = await screen.findByRole('region', { name: 'Père Basile Ndione' });
    expect(within(panel).getByText('En attente de la personne')).toBeInTheDocument();
    expect(within(panel).getByText('Joindre la lettre d’obédience du provincial.')).toBeInTheDocument();
    expect(within(panel).getByText('Aucun justificatif joint à la déclaration.')).toBeInTheDocument();
  });

  it('valide le statut de clerc', async () => {
    const user = userEvent.setup();
    renderApp(<ClergePage />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Valider le statut de clerc' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(f8bState.requests.at(-1)).toMatchObject({ body: { decision: 'verifie', note: '' } }));
  });
});
