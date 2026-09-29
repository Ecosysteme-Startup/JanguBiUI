import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { mockDocuments } from '@/testing/mocks/handlers/documents';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentDetail } from '../document-detail';

const [soumise, prete, complement] = mockDocuments;
const url = (id: string) => `${env.API_URL}/v1/documents/requests/${id}/`;

describe('DocumentDetail (GET /v1/documents/requests/<uuid>/)', () => {
  test('spinner pendant le chargement', async () => {
    server.use(
      http.get(url(soumise.id), async () => {
        await delay(Infinity);
        return HttpResponse.json(soumise);
      }),
    );
    renderApp(<DocumentDetail documentId={soumise.id} />);
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  test('type, référence, paroisse du registre, délai indicatif', async () => {
    renderApp(<DocumentDetail documentId={soumise.id} />);

    expect(
      await screen.findByRole('heading', { name: 'Certificat de baptême' }),
    ).toBeInTheDocument();
    expect(screen.getByText(`Réf. ${soumise.reference}`)).toBeInTheDocument();
    expect(screen.getByText('Saint-Dominique')).toBeInTheDocument();
    expect(screen.getByText(/Vers le 30 septembre 2026/)).toBeInTheDocument();
  });

  test('acte prêt : lieu et horaires de retrait', async () => {
    renderApp(<DocumentDetail documentId={prete.id} />);

    expect(await screen.findByText('Votre acte est prêt')).toBeInTheDocument();
    expect(
      screen.getByText(/Secrétariat de Saint-Dominique/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Du mardi au samedi, 9 h – 12 h'),
    ).toBeInTheDocument();
    // Pas d'annulation possible une fois l'acte prêt.
    expect(
      screen.queryByRole('button', { name: 'Annuler la demande' }),
    ).toBeNull();
  });

  test('complément demandé : le commentaire du secrétariat et l’envoi', async () => {
    let body: unknown = null;
    server.use(
      http.post(`${url(complement.id)}supplement/`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          ...complement,
          status: 'under_verification',
        });
      }),
    );
    renderApp(<DocumentDetail documentId={complement.id} />);

    expect(
      await screen.findByText('Merci de préciser l’année du mariage.'),
    ).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText('Précisions'),
      'Mariés en 2012.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Envoyer le complément' }),
    );

    await waitFor(() =>
      expect(body).toEqual({ additional_info: 'Mariés en 2012.' }),
    );
    expect(await screen.findByText('En vérification')).toBeInTheDocument();
  });

  test('annuler une demande soumise', async () => {
    renderApp(<DocumentDetail documentId={soumise.id} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Annuler la demande' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmer l’annulation' }),
    );

    expect(await screen.findByText('Annulée')).toBeInTheDocument();
  });

  test('erreur de chargement', async () => {
    server.use(http.get(url('inconnu'), () => HttpResponse.error()));
    renderApp(<DocumentDetail documentId="inconnu" />);
    await screen.findByText(/impossible de charger cette demande/i);
  });
});
