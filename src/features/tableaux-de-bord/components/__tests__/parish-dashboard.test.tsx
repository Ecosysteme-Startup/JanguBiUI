import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { NodeDashboardView } from '@/features/tableaux-de-bord/components/node-dashboard';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { resetActes } from '@/testing/mocks/db-f6-actes';
import { resetF8b } from '@/testing/mocks/db-f8b';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { f8bHandlers, f8bOverrides } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// Handlers des lots en tête : d’autres lots servent les mêmes routes avec d’autres données.
beforeEach(() => {
  resetF8b();
  resetActes();
  server.use(...actesHandlers, ...f8bHandlers, ...f8bOverrides);
});

const render = (grants = grantsSecretaire) => renderApp(<NodeDashboardView nodeId={ids.saintDominique} />, { capacites: grants });

describe('Tableau de bord paroissial (PAR-Tableau-de-bord)', () => {
  it('s’ouvre sur « Aujourd’hui » et nomme la qualité réelle du titulaire en minuscules', async () => {
    const grants = grantsSecretaire.map((g) => ({ ...g, office: 'cure', office_label: 'Administrateur paroissial' }));
    render(grants);

    expect(await screen.findByRole('heading', { level: 1, name: 'Aujourd’hui' })).toBeInTheDocument();
    const line = await screen.findByText(/vous agissez comme/i);
    expect(line).toHaveTextContent(/vous agissez comme administrateur paroissial$/i);
    expect(line).not.toHaveTextContent(/curé/i);
  });

  it('liste ce qui reste à faire, avec les seuls liens permis par les capacités', async () => {
    render();

    const todo = await screen.findByRole('region', { name: /reste à faire aujourd.hui/i });
    expect(within(todo).getByText(/^Traiter/)).toHaveTextContent('Traiter 8 demandes d’actes');
    expect(within(todo).getByText(/^2 en retard/)).toBeInTheDocument();
    expect(within(todo).getByRole('link', { name: 'Ouvrir la file' })).toHaveAttribute('href', `/espace/${ids.saintDominique}/demandes`);
    // La secrétaire n'est pas joignable par les fidèles : le point est listé, sans lien vers la messagerie.
    expect(within(todo).getByText(/1 conversation sans réponse/i)).toBeInTheDocument();
    expect(within(todo).queryByRole('link', { name: /messagerie/i })).not.toBeInTheDocument();
    expect(within(todo).getByRole('link', { name: /préparer l.annonce du dimanche/i })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/annonces/nouvelle`,
    );
  });

  it('montre l’activité de la paroisse en agrégats seulement', async () => {
    render();

    const activity = await screen.findByRole('region', { name: 'Activité de la semaine' });
    expect(within(activity).getByText('Fidèles actifs').nextElementSibling).toHaveTextContent('131 sur 214');
    expect(within(activity).getByText('Lectures d’annonces').nextElementSibling).toHaveTextContent('1 480');
  });

  it('liste les demandes en retard avec un lien vers leur fiche', async () => {
    render();

    const card = await screen.findByRole('region', { name: /demandes en retard/i });
    const rows = within(card).getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
    expect(within(card).getByRole('link', { name: 'Voir toutes les demandes' })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/demandes?retard=1`,
    );
  });

  it('n’écrit jamais « chiffré de bout en bout »', async () => {
    const { container } = render();
    await screen.findByRole('region', { name: /reste à faire/i });
    expect(container.textContent).not.toMatch(/bout en bout/i);
  });

  it('signale une erreur de chargement', async () => {
    server.use(http.get(apiUrl('/dashboards/nodes/:nodeId/'), () => HttpResponse.json({ detail: 'Refusé.' }, { status: 403 })));
    render();

    expect(await screen.findByRole('alert')).toHaveTextContent(/n.a pas pu être chargé/i);
  });
});
