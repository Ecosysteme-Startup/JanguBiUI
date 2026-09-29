import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { StructurePage } from '@/features/structure/components/structure-page';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, ids } from '@/testing/mocks/db';
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

const item = (name: RegExp) => screen.findByRole('treeitem', { name });

describe('Structure', () => {
  it('se parcourt entièrement au clavier (motif « tree »)', async () => {
    const user = userEvent.setup();
    renderApp(<StructurePage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    const root = await item(/^archidiocèse de dakar/i);
    expect(root).toHaveAttribute('aria-expanded', 'true');
    await item(/^doyenné plateau-médina/i);
    // Un seul élément de l'arbre dans l'ordre de tabulation.
    expect(screen.getAllByRole('treeitem').filter((el) => el.tabIndex === 0)).toHaveLength(1);

    root.focus();
    await user.keyboard('{ArrowDown}');
    const doyenne = await item(/^doyenné plateau-médina/i);
    expect(doyenne).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(doyenne).toHaveAttribute('aria-expanded', 'true');
    await item(/^saint-dominique/i);

    await user.keyboard('{ArrowRight}');
    const parish = await item(/^saint-dominique/i);
    expect(parish).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(parish).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { level: 2, name: 'Saint-Dominique' })).toBeInTheDocument();
    expect(await screen.findByText('Église Saint-Dominique')).toBeInTheDocument();
    // Titulaires visibles : le chancelier nomme sur ce sous-arbre.
    expect(within(await screen.findByRole('list', { name: 'Titulaires d’offices' })).getByText(/germaine faye/i)).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(doyenne).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(doyenne).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Home}');
    expect(root).toHaveFocus();
  });

  it('ajoute un enfant au nœud sélectionné, avec les seuls types autorisés', async () => {
    const user = userEvent.setup();
    renderApp(<StructurePage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(within(await item(/^doyenné plateau-médina/i)).getByText('Doyenné Plateau-Médina'));
    await screen.findByRole('heading', { level: 2, name: 'Doyenné Plateau-Médina' });
    await user.click(screen.getByRole('button', { name: 'Plus d’actions' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Ajouter un enfant' }));

    const dialog = await screen.findByRole('dialog', { name: /ajouter un nœud/i });
    const typeSelect = within(dialog).getByLabelText(/type de nœud/i);
    expect(within(typeSelect).queryByRole('option', { name: 'Diocèse' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Ajouter le nœud' }));
    expect(await within(dialog).findByText('Indiquez le nom du nœud.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^nom/i), 'Saint-Laurent de Yeumbeul');
    await user.selectOptions(typeSelect, 'paroisse');
    await user.click(within(dialog).getByRole('button', { name: 'Ajouter le nœud' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(f8bState.requests.at(-1)).toMatchObject({
      method: 'POST',
      body: { name: 'Saint-Laurent de Yeumbeul', type: 'paroisse', parent_id: f8bIds.plateauMedina },
    });
    expect(await screen.findByRole('heading', { level: 2, name: 'Saint-Laurent de Yeumbeul' })).toBeInTheDocument();
  });

  it('liste les sous-nœuds du nœud sélectionné et ouvre leur fiche', async () => {
    server.use(
      http.get(apiUrl('/hierarchy/nodes/:nodeId/ancestors/'), () =>
        HttpResponse.json([
          { id: f8bIds.province, name: 'Province de Dakar', code: 'DAKP' },
          { id: ids.dakar, name: 'Archidiocèse de Dakar', code: 'DAK' },
        ]),
      ),
    );
    const user = userEvent.setup();
    renderApp(<StructurePage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    const children = await screen.findByRole('list', { name: 'Sous-nœuds de Archidiocèse de Dakar' });
    await user.click(within(children).getByRole('button', { name: /doyenné plateau-médina/i }));
    expect(await screen.findByRole('heading', { level: 2, name: 'Doyenné Plateau-Médina' })).toBeInTheDocument();
    const path = screen.getByRole('navigation', { name: 'Chemin' });
    expect(within(path).getByRole('button', { name: 'Archidiocèse de Dakar' })).toBeInTheDocument();
  });

  it('filtre l’arbre par nom et affiche un état vide explicite', async () => {
    const user = userEvent.setup();
    renderApp(<StructurePage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.type(await screen.findByLabelText(/filtrer l.arbre/i), 'Joseph');
    const results = await screen.findByRole('list', { name: /résultats du filtre/i });
    expect(within(results).getByRole('button', { name: /saint-joseph de médina/i })).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/filtrer l.arbre/i));
    await user.type(screen.getByLabelText(/filtrer l.arbre/i), 'zzz');
    expect(await screen.findByText('Aucun nœud ne correspond à ce filtre.')).toBeInTheDocument();
  });

  it('simule puis applique un import CSV de nœuds', async () => {
    const user = userEvent.setup();
    renderApp(<StructurePage nodeId={ids.dakar} />, { capacites: grantsChancelier });

    await user.click(await screen.findByRole('button', { name: 'Importer un CSV' }));
    await user.upload(screen.getByLabelText(/fichier csv/i), new File(['code,type,name,parent_code'], 'niayes.csv', { type: 'text/csv' }));
    await user.click(screen.getByRole('button', { name: 'Simuler l’import' }));

    expect(await screen.findByText('Lignes valides')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Appliquer 3 lignes' }));
    expect(await screen.findByText(/import appliqué · 3 lignes/i)).toBeInTheDocument();
  });
});
