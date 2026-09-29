import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor } from '@/testing/test-utils';

import { PreferencesNotifications } from '../preferences-notifications';

describe('PreferencesNotifications (GET|PUT /v1/me/notification-preferences/)', () => {
  test('affiche les préférences et envoie l’objet complet au changement', async () => {
    let envoye: Record<string, unknown> | null = null;
    server.use(
      http.put(
        `${env.API_URL}/v1/me/notification-preferences/`,
        async ({ request }) => {
          envoye = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(envoye);
        },
      ),
    );
    renderApp(<PreferencesNotifications />);

    const annonces = await screen.findByRole('switch', {
      name: 'Annonces de ma paroisse',
    });
    expect(annonces).toBeChecked();
    expect(screen.getByLabelText('Début des heures calmes')).toHaveValue(
      '22:00',
    );

    await userEvent.click(annonces);
    await waitFor(() =>
      expect(envoye).toEqual({
        in_app: true,
        email: true,
        push: true,
        topic_annonces: false,
        topic_evenements: true,
        quiet_start: '22:00:00',
        quiet_end: '06:00:00',
      }),
    );
  });
});
