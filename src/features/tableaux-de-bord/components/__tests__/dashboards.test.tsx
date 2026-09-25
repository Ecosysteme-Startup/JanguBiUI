import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { NodeDashboardView } from '@/features/tableaux-de-bord/components/node-dashboard';
import { PlatformDashboardView } from '@/features/tableaux-de-bord/components/platform-dashboard';
import { apiUrl } from '@/testing/mocks/api-url';
import { grantsChancelier, grantsPlateforme, grantsSecretaire, ids } from '@/testing/mocks/db';
import { nodeDashboard, resetF8b } from '@/testing/mocks/db-f8b';
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

describe('Tableau de bord diocésain', () => {
  it('affiche des agrégats et AUCUN nom de personne, même si l’API en renvoyait', async () => {
    // L'API renverrait par erreur des données nominatives : elles ne doivent jamais apparaître.
    server.use(
      http.get(apiUrl('/dashboards/nodes/:nodeId/'), () =>
        HttpResponse.json({
          ...nodeDashboard(ids.dakar, 'Archidiocèse de Dakar', 'diocese'),
          actes: {
            ...nodeDashboard(ids.dakar, 'Archidiocèse de Dakar', 'diocese').actes,
            late: [{ requester: 'Pierre Ndour', email: 'p.ndour@example.sn' }],
          },
          recent_fideles: [{ full_name: 'Cécile Coly', email: 'c.coly@example.sn' }],
          top_priest: 'Abbé Augustin Ndiaye',
        }),
      ),
    );
    const { container } = renderApp(<NodeDashboardView nodeId={ids.dakar} />, { capacites: grantsChancelier });

    expect(await screen.findByRole('heading', { level: 1, name: 'Archidiocèse de Dakar' })).toBeInTheDocument();
    expect(screen.getByText(/aucune donnée personnelle n.est remontée au diocèse/i)).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'Doyenné Plateau-Médina' })).toBeInTheDocument();
    expect(await screen.findByText(/1 déclaration de clerc attend une vérification/i)).toBeInTheDocument();

    const text = container.textContent ?? '';
    for (const nominative of ['Pierre Ndour', 'Cécile Coly', 'Augustin Ndiaye', 'Luc Bassène', '@example.sn', 'luc.bassene']) {
      expect(text).not.toContain(nominative);
    }
  });

  it('résume le déploiement par doyenné', async () => {
    renderApp(<NodeDashboardView nodeId={ids.dakar} />, { capacites: grantsChancelier });

    const row = (await screen.findByRole('cell', { name: 'Doyenné Plateau-Médina' })).closest('tr')!;
    // 3 paroisses, 1 active, 1 en fondation.
    expect(
      within(row)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Doyenné Plateau-Médina', '3', '1', '1', '']);
    expect(screen.getByText(/taux d.ouverture : 25/i)).toBeInTheDocument();
  });

  it('n’écrit jamais « chiffré de bout en bout »', async () => {
    const { container } = renderApp(<NodeDashboardView nodeId={ids.dakar} />, { capacites: grantsChancelier });
    expect(await screen.findByText(/aucun administrateur n.y a accès/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/bout en bout/i);
  });
});

describe('Tableau de bord paroissial', () => {
  it('liste ce qui est à traiter, avec les seuls liens permis par les capacités', async () => {
    renderApp(<NodeDashboardView nodeId={ids.saintDominique} />, { capacites: grantsSecretaire });

    expect(await screen.findByRole('heading', { level: 1, name: /cette semaine à saint-dominique/i })).toBeInTheDocument();
    expect(await screen.findByText(/vous agissez comme/i)).toHaveTextContent(/secrétaire paroissiale/i);
    const todo = screen.getByRole('region', { name: /à traiter/i });
    expect(within(todo).getByText('2 demandes d’actes en retard')).toBeInTheDocument();
    expect(within(todo).getByRole('link', { name: 'Traiter' })).toHaveAttribute('href', `/espace/${ids.saintDominique}/demandes`);
    // La secrétaire n'est pas joignable par les fidèles : pas de lien vers la messagerie.
    expect(within(todo).getByText(/1 conversation sans réponse/i)).toBeInTheDocument();
    expect(within(todo).queryByRole('link', { name: /messagerie/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /préparer l.annonce du dimanche/i })).toHaveAttribute(
      'href',
      `/espace/${ids.saintDominique}/annonces/nouvelle`,
    );
  });

  it('signale une erreur de chargement', async () => {
    server.use(http.get(apiUrl('/dashboards/nodes/:nodeId/'), () => HttpResponse.json({ detail: 'Refusé.' }, { status: 403 })));
    renderApp(<NodeDashboardView nodeId={ids.saintDominique} />, { capacites: grantsSecretaire });

    expect(await screen.findByRole('alert')).toHaveTextContent(/n.a pas pu être chargé/i);
  });
});

describe('Tableau de bord plateforme', () => {
  it('montre les comptes, la MFA du staff et les tâches en retard', async () => {
    renderApp(<PlatformDashboardView />, { capacites: grantsPlateforme });

    expect(await screen.findByRole('heading', { level: 1, name: /santé de la plateforme/i })).toBeInTheDocument();
    expect(screen.getByText('312')).toBeInTheDocument();
    expect(screen.getByText(/14 sur 14/)).toBeInTheDocument();
    const row = screen.getByRole('cell', { name: 'Relance des actes en retard' }).closest('tr')!;
    expect(within(row).getByText('En retard')).toBeInTheDocument();
  });
});
