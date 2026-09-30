import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { NodeDashboardView } from '@/features/tableaux-de-bord/components/node-dashboard';
import type { Grant } from '@/lib/capacites';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsSecretaire, ids } from '@/testing/mocks/db';
import { resetActes } from '@/testing/mocks/db-f6-actes';
import { resetF8b } from '@/testing/mocks/db-f8b';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';
import { f8bHandlers, f8bOverrides } from '@/testing/mocks/handlers/f8b';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

const nodeId = ids.saintDominique;
const grant = (capacite: string): Grant => ({ ...grantsSecretaire[0], capacite });
const withGrants = (...capacites: string[]) => [...grantsSecretaire, ...capacites.map(grant)];

/** Réponse conforme à `TodayTasks` : quêtes à confirmer, intentions à planifier et du jour. */
const todayTasks = (quetes = 2) => ({
  node: { id: nodeId, name: 'Saint-Dominique' },
  date: '2026-09-27',
  tasks: [
    { code: 'demandes_a_traiter', label: 'Demandes d’actes à traiter', count: 8 },
    { code: 'quetes_a_confirmer', label: 'Quêtes à confirmer', count: quetes },
    { code: 'intentions_a_planifier', label: 'Intentions de messe à planifier', count: 4 },
    { code: 'intentions_du_jour', label: 'Intentions de messe du jour', count: 1 },
  ],
  confessions: null,
});

let calls: URL[] = [];

beforeEach(() => {
  calls = [];
  resetF8b();
  resetActes();
  server.use(
    ...actesHandlers,
    ...f8bHandlers,
    ...f8bOverrides,
    http.get(apiUrl('/staff/taches-du-jour/'), ({ request }) => {
      calls.push(new URL(request.url));
      return HttpResponse.json(todayTasks());
    }),
  );
});

const render = (grants: Grant[]) => renderApp(<NodeDashboardView nodeId={nodeId} />, { capacites: grants });
const todo = () => screen.findByRole('region', { name: /reste à faire aujourd.hui/i });

describe('Reste à faire aujourd’hui : tâches du jour (quêtes, intentions)', () => {
  it('lit /staff/taches-du-jour/ pour la paroisse et ajoute les rubriques permises', async () => {
    render(withGrants('dons.saisir_quete', 'intentions.gerer'));

    const region = await todo();
    expect(await within(region).findByText('2 quêtes en espèces à confirmer')).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    expect(calls[0].searchParams.get('node')).toBe(nodeId);

    expect(within(region).getByRole('link', { name: 'Confirmer les quêtes en espèces' })).toHaveAttribute('href', `/espace/${nodeId}/dons/quetes`);
    expect(within(region).getByText('4 intentions de messe à planifier')).toBeInTheDocument();
    expect(within(region).getByRole('link', { name: 'Planifier les intentions de messe' })).toHaveAttribute('href', `/espace/${nodeId}/intentions`);
    expect(within(region).getByText('1 intention de messe aujourd’hui')).toBeInTheDocument();
    expect(within(region).getByRole('link', { name: 'Voir la feuille des intentions du jour' })).toHaveAttribute(
      'href',
      `/espace/${nodeId}/intentions/feuille?date=2026-09-27`,
    );
  });

  it('gestion des fonds sans saisie : la quête renvoie vers les dons, sans les intentions', async () => {
    render(withGrants('dons.gerer_fonds'));

    const region = await todo();
    expect(await within(region).findByRole('link', { name: 'Confirmer les quêtes en espèces' })).toHaveAttribute('href', `/espace/${nodeId}/dons`);
    expect(within(region).queryByText(/intentions? de messe/)).not.toBeInTheDocument();
  });

  it('sans capacité : aucun appel et aucune rubrique de quête ni d’intention', async () => {
    render(grantsSecretaire);

    const region = await todo();
    expect(within(region).getByText(/^Traiter/)).toBeInTheDocument();
    expect(within(region).queryByText(/quêtes? en espèces/)).not.toBeInTheDocument();
    expect(within(region).queryByText(/intentions? de messe/)).not.toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('n’affiche pas la rubrique quand il n’y a rien à confirmer', async () => {
    server.use(http.get(apiUrl('/staff/taches-du-jour/'), () => HttpResponse.json(todayTasks(0))));
    render(withGrants('dons.saisir_quete', 'intentions.gerer'));

    const region = await todo();
    expect(await within(region).findByText('4 intentions de messe à planifier')).toBeInTheDocument();
    expect(within(region).queryByText(/à confirmer/)).not.toBeInTheDocument();
  });
});
