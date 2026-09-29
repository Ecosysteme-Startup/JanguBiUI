import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { renderApp, screen } from '@/testing/test-utils';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';

import { WelcomeBanner } from '../welcome-banner';

describe('WelcomeBanner', () => {
  test('renders a greeting message based on current hour', () => {
    renderApp(<WelcomeBanner />);

    const greetings = ['Bonjour', 'Bon après-midi', 'Bonsoir'];
    const found = greetings.some((g) => screen.queryByText(g) !== null);
    expect(found).toBe(true);
  });

  test('renders current date', () => {
    renderApp(<WelcomeBanner />);

    const today = new Date();
    const monthName = today.toLocaleDateString('fr-FR', { month: 'long' });
    expect(screen.getByText(new RegExp(monthName, 'i'))).toBeInTheDocument();
  });

  test('renders safely when user profile is null', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () =>
        HttpResponse.json(createUser({ profile: null as never })),
      ),
    );

    renderApp(<WelcomeBanner />);

    await screen.findByText('Bienvenue');
  });
});
