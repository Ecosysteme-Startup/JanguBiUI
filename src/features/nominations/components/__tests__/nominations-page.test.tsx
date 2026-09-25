import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NominationsPage } from '@/features/nominations/components/nominations-page';
import { grantsChancelier, ids } from '@/testing/mocks/db';
import { f8bState, resetF8b } from '@/testing/mocks/db-f8b';
import { f8bOverrides } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f8bHandlers } from '@/testing/mocks/handlers/f8b';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f8bHandlers));

beforeEach(() => {
  resetF8b();
  server.use(...f8bOverrides);
});

describe('Nominations', () => {
  it('filtre le registre par statut, avec les compteurs', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    expect(await screen.findByText('Abbé Augustin Ndiaye')).toBeInTheDocument();
    const statuses = screen.getByRole('group', { name: /filtrer par statut/i });
    await user.click(await within(statuses).findByRole('button', { name: /proposées · 1/i }));

    await waitFor(() => expect(screen.queryByText('Abbé Augustin Ndiaye')).not.toBeInTheDocument());
    expect(screen.getByText('Abbé Ignace Ndour')).toBeInTheDocument();
    expect(screen.getByText(/effet 01\.10\.2026/)).toBeInTheDocument();
  });

  it('termine une nomination après confirmation', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: /terminer : abbé augustin ndiaye/i }));
    const dialog = await screen.findByRole('dialog', { name: /terminer cette nomination/i });
    expect(f8bState.requests).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: /terminer aujourd.hui/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(f8bState.requests.at(-1)).toMatchObject({ method: 'PATCH', body: { action: 'terminer' } });
    const row = (await screen.findByText('Abbé Augustin Ndiaye')).closest('tr')!;
    expect(await within(row).findByText('Terminée')).toBeInTheDocument();
  });

  it('exige une date d’effet, simule puis applique le mouvement', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    const simulate = await screen.findByRole('button', { name: 'Simuler l’import' });
    expect(simulate).toBeDisabled();
    await user.type(screen.getByLabelText(/date d.effet/i), '2026-10-01');
    expect(screen.getByText('Fins de mandat au 30/09')).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText(/fichier csv/i),
      new File(['action,email,office,node_code'], 'mouvement.csv', { type: 'text/csv' }),
    );
    await user.click(simulate);

    expect(await screen.findByText(/clerc pas encore vérifié/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Appliquer 3 lignes' }));
    expect(await screen.findByText(/import appliqué/i)).toBeInTheDocument();
    const applied = new URL(f8bState.requests.at(-1)!.url);
    expect(applied.searchParams.get('dry_run')).toBe('false');
    expect(applied.searchParams.get('effective_date')).toBe('2026-10-01');
  });
});
