import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { PAROISSES } from '@/testing/mocks/handlers/paroisses';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor } from '@/testing/test-utils';

import OnboardingPage from '../page';

const replace = vi.fn();

describe('OnboardingPage — choix de paroisse (/me/paroisses/)', () => {
  beforeEach(() => {
    replace.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      replace,
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as never);
  });

  test('sans paroisse : recherche dans l’annuaire puis POST principale', async () => {
    const captured: { body: unknown } = { body: null };
    server.use(
      http.get(`${env.API_URL}/v1/me/paroisses/`, () => HttpResponse.json([])),
      http.post(`${env.API_URL}/v1/me/paroisses/`, async ({ request }) => {
        captured.body = await request.json();
        return HttpResponse.json(
          [
            {
              paroisse: {
                id: PAROISSES.saintDominique.id,
                name: 'Saint-Dominique',
              },
              principale: true,
              membre_depuis: '2026-09-27T10:00:00Z',
            },
          ],
          { status: 201 },
        );
      }),
    );

    renderApp(<OnboardingPage />);

    const commencer = await screen.findByRole('button', { name: /commencer/i });
    expect(commencer).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText(/rechercher une paroisse/i),
      'Domin',
    );
    await userEvent.click(
      await screen.findByRole('button', { name: /Saint-Dominique/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: /commencer/i }));

    await waitFor(() =>
      expect(captured.body).toEqual({
        paroisse_id: PAROISSES.saintDominique.id,
        principale: true,
      }),
    );
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });

  test('« Plus tard » : la paroisse est facultative', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/me/paroisses/`, () => HttpResponse.json([])),
    );
    renderApp(<OnboardingPage />);
    await userEvent.click(
      await screen.findByRole('button', { name: /plus tard/i }),
    );
    expect(replace).toHaveBeenCalled();
  });

  test('déjà membre d’une paroisse : renvoi vers l’accueil', async () => {
    renderApp(<OnboardingPage />);
    await waitFor(() => expect(replace).toHaveBeenCalled());
  });
});
