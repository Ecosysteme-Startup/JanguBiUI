import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { resetConfessions } from '@/testing/mocks/handlers/confessions';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, within } from '@/testing/test-utils';

import { ConfessionsContent } from '../confessions-content';

describe('ConfessionsContent (contrat /v1/confessions/)', () => {
  beforeEach(() => resetConfessions());

  test('liste les créneaux libres de la paroisse principale, groupés par jour', async () => {
    let node: string | null = null;
    server.use(
      http.get(`${env.API_URL}/v1/confessions/slots/`, ({ request }) => {
        node = new URL(request.url).searchParams.get('node');
        return undefined as never;
      }),
    );
    renderApp(<ConfessionsContent />);

    expect(await screen.findByText(/samedi 3 octobre/i)).toBeInTheDocument();
    expect(screen.getAllByText('Emmanuel Tine').length).toBeGreaterThan(0);
    expect(
      screen.getByText('Vous n’avez pas de rendez-vous.'),
    ).toBeInTheDocument();
    // La paroisse principale (GET /me/paroisses/) filtre les créneaux.
    expect(node).toBe('5b7d2c1e-8a41-4f0b-9d7e-2c3f1a6b9e01');
  });

  test('réserver un créneau puis l’annuler', async () => {
    renderApp(<ConfessionsContent />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: /10:00/ }))[0],
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Réserver ce créneau' }),
    );

    const annuler = await screen.findByRole('button', {
      name: 'Annuler le rendez-vous',
    });
    expect(screen.getByText('Réservé')).toBeInTheDocument();
    await userEvent.click(annuler);
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmer l’annulation' }),
    );
    expect(await screen.findByText('Annulé par vous')).toBeInTheDocument();
  });

  test('créneau pris entre-temps (409 slot_taken) : message clair', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/confessions/bookings/`, () =>
        HttpResponse.json(
          { error: { code: 'slot_taken', message: 'Pris.', details: {} } },
          { status: 409 },
        ),
      ),
    );
    renderApp(<ConfessionsContent />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: /10:15/ }))[0],
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Réserver ce créneau' }),
    );
    const alerte = await screen.findByRole('alert');
    expect(within(alerte).getByText(/vient d’être pris/)).toBeInTheDocument();
  });
});
