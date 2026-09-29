import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { setCguMessagerie } from '@/testing/mocks/handlers/messaging';
import { server } from '@/testing/mocks/server';
import { renderApp, screen } from '@/testing/test-utils';

import { NewConversation } from '../new-conversation';

const push = vi.fn();

describe('NewConversation (GET /v1/messaging/priests/, CGU)', () => {
  beforeEach(() => {
    push.mockReset();
    setCguMessagerie(true);
    vi.mocked(useRouter).mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    } as never);
  });

  test('prêtres joignables avec leur office ; indisponible désactivé', async () => {
    renderApp(<NewConversation />);

    const tine = await screen.findByRole('button', { name: /Emmanuel Tine/ });
    expect(tine).toHaveTextContent('Curé · Saint-Dominique');
    expect(tine).toBeEnabled();
    const diouf = screen.getByRole('button', { name: /Paul Diouf/ });
    expect(diouf).toBeDisabled();
    expect(diouf).toHaveTextContent('En retraite jusqu’au 12 octobre.');
  });

  test('CGU non acceptées : acceptation avant la liste', async () => {
    setCguMessagerie(false);
    renderApp(<NewConversation />);

    await userEvent.click(
      await screen.findByRole('button', { name: /J’ai compris et j’accepte/ }),
    );
    expect(
      await screen.findByRole('button', { name: /Emmanuel Tine/ }),
    ).toBeInTheDocument();
  });

  test('ouvre l’échange puis mène à la conversation', async () => {
    renderApp(<NewConversation />);
    await userEvent.click(
      await screen.findByRole('button', { name: /Emmanuel Tine/ }),
    );
    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith('/app/messages/conv-new'),
    );
  });

  test('refus « mineur » expliqué sobrement', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/messaging/conversations/create/`, () =>
        HttpResponse.json(
          {
            error: {
              code: 'minor',
              message: 'Réservé aux majeurs.',
              details: {},
            },
          },
          { status: 403 },
        ),
      ),
    );
    renderApp(<NewConversation />);
    await userEvent.click(
      await screen.findByRole('button', { name: /Emmanuel Tine/ }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /réservée aux personnes majeures/,
    );
  });
});
