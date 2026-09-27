import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { RequestsList } from '@/features/actes/components/requests-list';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetActes } from '@/testing/mocks/db-f6-actes';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { actesHandlers } from '@/testing/mocks/handlers/f6-actes';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...actesHandlers));

beforeEach(() => resetActes());

describe('FID-Demandes', () => {
  it('liste mes demandes en cours en cartes : paroisse du sacrement, statut, suivi', async () => {
    renderApp(<RequestsList />);

    const list = await screen.findByRole('list', { name: 'Demandes en cours' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(within(list).getByRole('link', { name: /DOC-20260923-00419.*attestation parrain \/ marraine/i })).toHaveAttribute(
      'href',
      '/app/demandes/d0c00000-0000-4000-8000-000000000001',
    );
    expect(within(list).getAllByText(/Sainte-Thérèse de Grand-Dakar/).length).toBeGreaterThan(0);
    expect(within(list).getByText('Complément demandé')).toBeInTheDocument();
    expect(within(list).getByRole('link', { name: /^répondre/i })).toBeInTheDocument();
    expect(screen.getByText(/une demande prête à retirer à cathédrale notre-dame-des-victoires/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nouvelle demande/i })).toHaveAttribute('href', '/app/demandes/nouvelle');
  });

  it('sépare les demandes en cours des demandes terminées', async () => {
    const user = userEvent.setup();
    renderApp(<RequestsList />);
    await screen.findByRole('list', { name: 'Demandes en cours' });

    await user.click(screen.getByRole('radio', { name: /^terminées/i }));
    const list = screen.getByRole('list', { name: 'Demandes terminées' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Rejetée')).toBeInTheDocument();
  });

  it('filtre par type d’acte', async () => {
    const user = userEvent.setup();
    renderApp(<RequestsList />);
    const list = await screen.findByRole('list', { name: 'Demandes en cours' });
    const chip = within(screen.getByRole('group', { name: 'Filtrer par type d’acte' })).getAllByRole('button')[1];

    await user.click(chip);

    expect(within(list).getAllByRole('listitem').length).toBeLessThan(4);
  });

  it('présente un état vide qui invite à faire une demande', async () => {
    server.use(http.get(apiUrl('/documents/requests/'), () => HttpResponse.json({ count: 0, next: null, previous: null, results: [] })));
    renderApp(<RequestsList />);

    expect(await screen.findByText('Aucune demande pour l’instant.')).toBeInTheDocument();
  });

  it('signale une erreur de chargement', async () => {
    server.use(http.get(apiUrl('/documents/requests/'), () => HttpResponse.json({ message: 'Erreur' }, { status: 500 })));
    renderApp(<RequestsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/n’ont pas pu être chargées/);
  });

  it('ne propose aucun acte en fichier numérique', async () => {
    renderApp(<RequestsList />);
    await screen.findByRole('list', { name: 'Demandes en cours' });

    expect(document.querySelector('a[href$=".pdf"], a[download]')).toBeNull();
    expect(screen.queryByRole('link', { name: /télécharger/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /télécharger/i })).not.toBeInTheDocument();
  });
});
