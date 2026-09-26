import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';

import { NominationsPage } from '@/features/nominations/components/nominations-page';
import { grantsChancelier, grantsSecretaire, ids } from '@/testing/mocks/db';
import { apiUrl } from '@/testing/mocks/api-url';
import { f8bIds, f8bState, resetF8b } from '@/testing/mocks/db-f8b';
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

/** Rangée du registre contenant à la fois l'office et le nœud. */
const rowWith = (office: string, node: RegExp) =>
  screen.getAllByRole('row').find((r) => within(r).queryByText(office) && node.test(r.textContent ?? ''));

describe('Nominations', () => {
  it('filtre le registre par statut, avec les compteurs', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    expect(await screen.findByText('Abbé Augustin Ndiaye')).toBeInTheDocument();
    const statuses = screen.getByRole('group', { name: /filtrer par statut/i });
    await user.click(await within(statuses).findByRole('button', { name: /à venir · 1/i }));

    await waitFor(() => expect(screen.queryByText('Abbé Augustin Ndiaye')).not.toBeInTheDocument());
    const row = screen.getByText('Abbé Ignace Ndour').closest('tr')!;
    expect(within(row).getByText('À venir')).toBeInTheDocument();
    expect(row).toHaveTextContent(/1er\s+oct\. 2026/);
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
    expect(await within(row).findByText('Échue')).toBeInTheDocument();
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

  it('nomme une personne trouvée par la recherche, sur un lieu du sous-arbre', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Nouvelle nomination' }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await user.type(within(panel).getByRole('combobox', { name: /personne/i }), 'ndour');
    await user.click(await within(panel).findByRole('option', { name: /abbé ignace ndour/i }));
    await user.type(within(panel).getByLabelText(/rechercher un lieu/i), 'thér');
    const lieu = within(panel).getByLabelText(/^lieu/i);
    await within(lieu).findByRole('option', { name: /sainte-thérèse/i });
    await user.selectOptions(lieu, within(lieu).getByRole('option', { name: /sainte-thérèse/i }));
    await user.selectOptions(within(panel).getByLabelText(/^office/i), 'Curé / administrateur paroissial');
    const quality = within(panel).getByRole('group', { name: 'Qualité' });
    expect(within(quality).getByRole('radio', { name: 'Curé' })).toBeChecked();
    await user.click(within(quality).getByRole('radio', { name: 'Administrateur paroissial' }));
    await user.click(within(panel).getByRole('button', { name: 'Nommer' }));

    await waitFor(() => expect(screen.queryByRole('region', { name: 'Nommer une personne' })).not.toBeInTheDocument());
    expect(f8bState.requests.at(-1)).toMatchObject({
      method: 'POST',
      body: {
        person_id: '5f0c0000-0000-4000-8000-0000000000e2',
        office: 'cure',
        quality: 'administrateur',
        node_id: f8bIds.sainteTherese,
        end_date: null,
      },
    });
    await waitFor(() => expect(rowWith('Administrateur paroissial', /sainte-thérèse/i)).toBeDefined());
  });

  it('ne demande pas de qualité pour un office qui n’en a pas', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Nouvelle nomination' }));
    const panel = await screen.findByRole('region', { name: 'Nommer une personne' });
    await within(panel).findByRole('option', { name: 'Chancelier' });
    await user.selectOptions(within(panel).getByLabelText(/^office/i), 'Chancelier');

    expect(within(panel).queryByRole('group', { name: 'Qualité' })).not.toBeInTheDocument();
  });

  it('modifie la qualité d’une nomination active de curé', async () => {
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Modifier la qualité : Abbé Augustin Ndiaye, Curé' }));
    expect(screen.queryByRole('button', { name: /modifier la qualité : abbé ignace ndour/i })).not.toBeInTheDocument();
    const dialog = await screen.findByRole('dialog', { name: 'Modifier la qualité' });
    await user.click(within(dialog).getByRole('radio', { name: 'Administrateur paroissial' }));
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(f8bState.requests.at(-1)).toMatchObject({ method: 'PATCH', body: { action: 'qualifier', quality: 'administrateur' } });
    await waitFor(() => expect(rowWith('Administrateur paroissial', /saint-dominique/i)).toBeDefined());
  });

  it('affiche l’erreur du serveur dans la fenêtre', async () => {
    server.use(
      http.patch(apiUrl('/hierarchy/assignments/:id/'), () =>
        HttpResponse.json({ error: { code: 'assignment_closed', message: 'Cette nomination n’est plus en cours.' } }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Modifier la qualité : Abbé Augustin Ndiaye, Curé' }));
    const dialog = await screen.findByRole('dialog', { name: 'Modifier la qualité' });
    await user.click(within(dialog).getByRole('radio', { name: 'Administrateur paroissial' }));
    await user.click(within(dialog).getByRole('button', { name: 'Enregistrer' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Cette nomination n’est plus en cours.');
  });

  it('ne propose pas de modifier la qualité sans offices.nommer', async () => {
    const lecture = grantsSecretaire.map((g) => ({ ...g, node_id: ids.dakar, node_type: 'diocese' }));
    renderApp(<NominationsPage nodeId={ids.dakar} />, { capacites: lecture });

    expect(await screen.findByText('Abbé Augustin Ndiaye')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /modifier la qualité/i })).not.toBeInTheDocument();
  });
});
