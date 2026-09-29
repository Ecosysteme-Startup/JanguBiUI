import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';

import { Personnalisation } from '../personnalisation';

describe('Personnalisation (profil)', () => {
  test('présence désactivée par défaut pour un fidèle, activable', async () => {
    let corps: unknown = null;
    server.use(
      http.put(`${env.API_URL}/v1/me/presence/`, async ({ request }) => {
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
});
