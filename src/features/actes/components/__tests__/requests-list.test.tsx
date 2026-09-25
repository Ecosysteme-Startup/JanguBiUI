import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { RequestsList } from '@/features/actes/components/requests-list';
import { apiUrl } from '@/testing/mocks/api-url';
import { resetActes } from '@/testing/mocks/db-f6-actes';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

beforeEach(() => resetActes());

describe('FID-Demandes', () => {
  it('liste mes demandes avec leur paroisse du sacrement et leur statut', async () => {
    renderApp(<RequestsList />);

    const table = await screen.findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(7);
    expect(within(table).getByRole('link', { name: /attestation parrain \/ marraine.*DOC-20260923-00419/i })).toHaveAttribute(
      'href',
      '/app/demandes/d0c00000-0000-4000-8000-000000000001',
    );
    expect(within(table).getAllByText('Sainte-Thérèse de Grand-Dakar').length).toBeGreaterThan(0);
    expect(within(table).getByText('À vous de répondre')).toBeInTheDocument();
    expect(screen.getByText(/une demande prête à retirer à cathédrale notre-dame-des-victoires/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nouvelle demande/i })).toHaveAttribute('href', '/app/demandes/nouvelle');
  });

  it('sépare les demandes en cours des demandes terminées', async () => {
    const user = userEvent.setup();
    renderApp(<RequestsList />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /^en cours/i }));
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: /^terminées/i }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('Rejetée')).toBeInTheDocument();
    expect(within(table).queryByText('Soumise')).not.toBeInTheDocument();
  });

  it('filtre par type d’acte', async () => {
    const user = userEvent.setup();
    renderApp(<RequestsList />);
    await screen.findByRole('table');

    await user.click(screen.getByRole('button', { name: /attestation de confirmation · 2/i }));

    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3);
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
    await screen.findByRole('table');

    expect(document.body.textContent).not.toMatch(/pdf/i);
    expect(screen.queryByRole('link', { name: /télécharger/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /télécharger/i })).not.toBeInTheDocument();
  });
});
