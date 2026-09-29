import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { page } from '@/lib/pagination';
import { createRequesterRequest } from '@/testing/mocks/handlers/documents';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentsList } from '../documents-list';

const URL_LISTE = `${env.API_URL}/v1/documents/requests/`;

describe('DocumentsList (GET /v1/documents/requests/)', () => {
  test('squelette pendant le chargement', async () => {
    server.use(
      http.get(URL_LISTE, async () => {
        await delay(Infinity);
        return HttpResponse.json(page([]));
      }),
    );
    renderApp(<DocumentsList />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0,
    );
  });

  test('affiche le libellé du type, la paroisse et le statut', async () => {
    renderApp(<DocumentsList />);

    expect(
      await screen.findByText('Certificat de baptême'),
    ).toBeInTheDocument();
    expect(screen.getByText('Attestation de confirmation')).toBeInTheDocument();
    expect(screen.getByText('Prêt à retirer')).toBeInTheDocument();
    expect(screen.getByText('Complément demandé')).toBeInTheDocument();
    expect(screen.getAllByText(/Saint-Dominique/).length).toBeGreaterThan(0);
  });

  test('« Autre document » affiche la précision saisie', async () => {
    server.use(
      http.get(URL_LISTE, () =>
        HttpResponse.json(
          page([
            createRequesterRequest({
              document_type: 'other',
              document_type_label: 'Autre document',
              document_type_free: 'Certificat de catholicité',
            }),
          ]),
        ),
      ),
    );
    renderApp(<DocumentsList />);
    expect(
      await screen.findByText('Certificat de catholicité'),
    ).toBeInTheDocument();
  });

  test('état vide', async () => {
    server.use(http.get(URL_LISTE, () => HttpResponse.json(page([]))));
    renderApp(<DocumentsList />);
    await screen.findByText(/aucune demande/i);
  });

  test('erreur réseau', async () => {
    server.use(http.get(URL_LISTE, () => HttpResponse.error()));
    renderApp(<DocumentsList />);
    await screen.findByText(/impossible de charger vos demandes/i);
  });

  test('chaque demande mène à son détail (UUID)', async () => {
    renderApp(<DocumentsList />);
    const link = await screen.findByRole('link', {
      name: /certificat de baptême/i,
    });
    expect(link).toHaveAttribute(
      'href',
      '/app/documents/0f1e2d3c-4b5a-4968-8778-695a4b3c2d1e',
    );
  });
});
