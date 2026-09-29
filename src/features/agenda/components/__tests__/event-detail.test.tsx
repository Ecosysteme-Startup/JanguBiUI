import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createEvent } from '@/testing/mocks/handlers/agenda';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { EventDetail } from '../event-detail';

// Contrat réel : GET /v1/agenda/<id>/, POST /v1/agenda/<id>/register/.
const detailUrl = `${env.API_URL}/v1/agenda/1/`;
const registerUrl = `${env.API_URL}/v1/agenda/1/register/`;

const makeEvent = createEvent;

describe('EventDetail', () => {
  test('affiche la description COMPLÈTE (non tronquée) après chargement', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(
          makeEvent({
            title: 'Messe de la Pentecôte',
            description:
              'Grande célébration à 10h, suivie d’un repas paroissial.\nVenez nombreux.',
          }),
        ),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByRole('heading', { name: 'Messe de la Pentecôte' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/repas paroissial/i)).toBeInTheDocument();
    expect(screen.getByText(/Venez nombreux/i)).toBeInTheDocument();
  });

  test('affiche le lieu et la paroisse organisatrice', async () => {
    server.use(http.get(detailUrl, () => HttpResponse.json(makeEvent())));

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByText('Église Saint-Dominique'),
    ).toBeInTheDocument();
    expect(screen.getByText('Saint-Dominique')).toBeInTheDocument();
  });

  test('état « Événement introuvable » sur 404 V1', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(
          {
            error: { code: 'not_found', message: 'Introuvable.', details: {} },
          },
          { status: 404 },
        ),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByText('Événement introuvable.'),
    ).toBeInTheDocument();
  });

  test('« S’inscrire » envoie le nombre de places choisi', async () => {
    let body: unknown = null;
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(
          makeEvent({ max_participants: 40, seats_remaining: 25 }),
        ),
      ),
      http.post(registerUrl, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          makeEvent({ is_registered: true, my_seats: 2 }),
          { status: 201 },
        );
      }),
    );

    renderApp(<EventDetail eventId={1} />);

    await userEvent.selectOptions(
      await screen.findByLabelText('Nombre de personnes'),
      '2',
    );
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(
      await screen.findByText('2 places sont réservées.'),
    ).toBeInTheDocument();
    expect(body).toEqual({ seats: 2 });
  });

  test('un refus « complet » (409 event_full) est expliqué', async () => {
    server.use(
      http.get(detailUrl, () => HttpResponse.json(makeEvent())),
      http.post(registerUrl, () =>
        HttpResponse.json(
          { error: { code: 'event_full', message: 'Complet.', details: {} } },
          { status: 409 },
        ),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    await userEvent.click(
      await screen.findByRole('button', { name: "S'inscrire" }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cet événement est complet.',
    );
  });

  test('affiche « Annuler mon inscription » quand déjà inscrit', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(makeEvent({ is_registered: true, my_seats: 1 })),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByRole('button', { name: 'Annuler mon inscription' }),
    ).toBeInTheDocument();
  });

  test('événement annulé : pas d’inscription possible', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(makeEvent({ is_cancelled: true })),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByText('Cet événement a été annulé.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: "S'inscrire" }),
    ).not.toBeInTheDocument();
  });
});
