import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { useRealtimeStore } from '@/stores/realtime-store';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '@/testing/test-utils';

import { Personnalisation } from '../personnalisation';

describe('Personnalisation (profil)', () => {
  test('présence désactivée par défaut pour un fidèle, activable', async () => {
    let corps: unknown = null;
    server.use(
      http.put(`${env.API_URL}/me/presence/`, async ({ request }) => {
        corps = await request.json();
        return HttpResponse.json({
          montrer_presence: true,
          effective: true,
          default: false,
        });
      }),
    );
    renderApp(<Personnalisation />);
    const presence = await screen.findByRole('switch', {
      name: 'Montrer quand je suis en ligne',
    });
    await waitFor(() => expect(presence).toBeEnabled());
    expect(presence).not.toBeChecked();
    expect(
      await screen.findByRole('switch', { name: 'Suggestions de lecture' }),
    ).toBeChecked();
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: "Suggestions d'écoute" }),
      ).toBeChecked(),
    );

    await userEvent.click(presence);
    await waitFor(() => expect(corps).toEqual({ montrer_presence: true }));
    await waitFor(() => expect(presence).toBeChecked());
    expect(
      screen.getByRole('button', { name: "Effacer l'historique de lecture" }),
    ).toBeInTheDocument();
  });

  test('réciprocité : le réglage le dit ; masquer efface la présence des autres', async () => {
    server.use(
      http.get(`${env.API_URL}/me/presence/`, () =>
        HttpResponse.json({
          montrer_presence: true,
          effective: true,
          default: false,
        }),
      ),
      http.put(`${env.API_URL}/me/presence/`, () =>
        HttpResponse.json({
          montrer_presence: false,
          effective: false,
          default: false,
        }),
      ),
    );
    useRealtimeStore.getState().setPresences([
      {
        user_id: 'pere-emmanuel-tine',
        visible: true,
        online: true,
        last_seen_at: null,
      },
    ]);
    renderApp(<Personnalisation />);
    expect(
      await screen.findByText(
        /Si vous masquez votre présence, vous ne verrez plus celle des autres\./,
      ),
    ).toBeInTheDocument();
    const presence = await screen.findByRole('switch', {
      name: 'Montrer quand je suis en ligne',
    });
    await waitFor(() => expect(presence).toBeChecked());
    await userEvent.click(presence);
    await waitFor(() => expect(presence).not.toBeChecked());
    expect(useRealtimeStore.getState().presences).toEqual({});
  });
});
