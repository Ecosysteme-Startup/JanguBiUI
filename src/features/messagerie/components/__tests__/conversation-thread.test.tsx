import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { ConversationThread } from '@/features/messagerie/components/conversation-thread';
import { FakeWebSocket } from '@/testing/fake-web-socket';
import { apiUrl } from '@/testing/mocks/api-url';
import {
  f7Ids,
  f7State,
  MINOR_MESSAGE,
  resetF7State,
} from '@/testing/mocks/db-f7-pretre';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import { f7PretreHandlers } from '@/testing/mocks/handlers/f7-pretre';

// Handlers du lot en tête : d’autres lots servent la même route avec d’autres données.
beforeEach(() => server.use(...f7PretreHandlers));

const renderThread = () =>
  renderApp(
    <ConversationThread
      conversationId={f7Ids.convTine}
      notice={{ bookingHref: '/app/confession' }}
    />,
  );

beforeEach(() => {
  resetF7State();
  FakeWebSocket.reset();
  vi.stubGlobal('WebSocket', FakeWebSocket);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ConversationThread (FID-Conversation)', () => {
  it('affiche le fil, le bandeau confession et un badge de chiffrement honnête', async () => {
    renderThread();

    expect(
      await screen.findByRole('heading', { name: 'Emmanuel Tine' }),
    ).toBeInTheDocument();
    const log = await screen.findByRole('log', {
      name: /messages avec emmanuel tine/i,
    });
    expect(
      within(log).getByText(/la session commence le samedi 17 octobre/i),
    ).toBeInTheDocument();

    const notice = screen.getByRole('note');
    expect(notice).toHaveTextContent(
      'La confession ne se fait pas par message.',
    );
    expect(
      within(notice).getByRole('link', { name: 'Prendre rendez-vous' }),
    ).toHaveAttribute('href', '/app/confession');
    expect(
      screen.getByText(/aucun administrateur n.y a accès/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/bout en bout/i)).not.toBeInTheDocument();
  });

  it('envoie un message par l’API et l’ajoute au fil', async () => {
    const user = userEvent.setup();
    renderThread();

    await user.type(
      await screen.findByLabelText(/votre message à emmanuel tine/i),
      'Mardi nous convient, merci.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Envoyer le message' }),
    );

    expect(
      await within(screen.getByRole('log')).findByText(
        'Mardi nous convient, merci.',
      ),
    ).toBeInTheDocument();
    expect(f7State.sent).toEqual([
      expect.objectContaining({ content: 'Mardi nous convient, merci.' }),
    ]);
    expect(screen.getByLabelText(/votre message à emmanuel tine/i)).toHaveValue(
      '',
    );
  });

  it('marque comme lus les messages du prêtre affichés', async () => {
    renderThread();
    await screen.findByRole('log');
    await vi.waitFor(() => expect(f7State.markedRead).toBe(1));
  });

  it('explique le refus quand l’expéditeur est mineur (RG-13)', async () => {
    server.use(
      http.post(apiUrl('/messaging/conversations/:id/messages/send/'), () =>
        HttpResponse.json(
          { detail: MINOR_MESSAGE, code: 'minor' },
          { status: 403 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderThread();

    await user.type(
      await screen.findByLabelText(/votre message à emmanuel tine/i),
      'Bonjour mon Père',
    );
    await user.click(
      screen.getByRole('button', { name: 'Envoyer le message' }),
    );

    expect(
      await screen.findByText(
        'La messagerie est réservée aux personnes majeures',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/si tu as moins de 18 ans/i)).toBeInTheDocument();
    expect(screen.getAllByRole('note')[0]).toHaveTextContent(
      'La confession ne se fait pas par message.',
    );
  });

  it('garde le bandeau confession tant que les conditions ne sont pas acceptées', async () => {
    f7State.cguAccepted = false;
    const user = userEvent.setup();
    renderThread();

    await user.click(
      await screen.findByRole('button', {
        name: /j.accepte les conditions de la messagerie/i,
      }),
    );

    expect(await screen.findByRole('log')).toBeInTheDocument();
    expect(screen.getAllByRole('note')[0]).toHaveTextContent(
      'La confession ne se fait pas par message.',
    );
  });

  it('ajoute en direct un message reçu par le socket de la conversation', async () => {
    renderThread();
    await screen.findByRole('log');
    await vi.waitFor(() => expect(FakeWebSocket.last()?.readyState).toBe(1));
    expect(FakeWebSocket.last()!.url).toContain(
      `/ws/messaging/conversations/${f7Ids.convTine}/?ticket=ticket-test`,
    );

    act(() =>
      FakeWebSocket.last()!.emit({
        type: 'message.received',
        message: {
          id: 'ws-1',
          sender_id: f7Ids.tine,
          sender_name: null,
          content: 'À mardi, alors.',
          client_message_id: null,
          read_at: null,
          is_deleted: false,
          created_at: new Date().toISOString(),
        },
      }),
    );

    expect(
      await within(screen.getByRole('log')).findByText('À mardi, alors.'),
    ).toBeInTheDocument();
  });

  it('passe « hors ligne » avec un bouton Réessayer quand le temps réel est injoignable', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    FakeWebSocket.autoFail = true;
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderThread();
    await screen.findByRole('log');

    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(await screen.findByText(/hors ligne\./i)).toBeInTheDocument();
    const attempts = FakeWebSocket.instances.length;

    FakeWebSocket.autoFail = false;
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    await vi.waitFor(() =>
      expect(FakeWebSocket.instances.length).toBe(attempts + 1),
    );
    await vi.waitFor(() =>
      expect(screen.queryByText(/hors ligne\./i)).not.toBeInTheDocument(),
    );
  });
});
