import { screen, waitFor } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createConversation, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ConversationList } from '../conversation-list';

const mockUser = createUser({ id: 'current-user-id' });

describe('ConversationList', () => {
  beforeEach(() => {
    server.use(
      http.get(`${env.API_URL}/v1/me/`, () => HttpResponse.json(mockUser)),
    );
  });

  test('shows loading skeleton while fetching conversations', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, async () => {
        await delay(Infinity);
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderApp(<ConversationList />);

    // Wait for user auth to resolve (enabled guard), then conversations enter loading
    // eslint-disable-next-line testing-library/no-node-access
    await waitFor(() =>
      expect(document.querySelector('.animate-pulse')).not.toBeNull(),
    );
  });

  test('displays participant name derived from participant_b when current user is participant_a', async () => {
    const conv = createConversation({
      id: 'c1',
      participant_a: {
        id: 'current-user-id',
        email: 'me@example.com',
        full_name: 'Moi',
      },
      participant_b: {
        id: 'other-id',
        email: 'jean@eglise.sn',
        full_name: 'Père Jean',
      },
      last_message: {
        id: 'lm1',
        content: 'Bonjour !',
        sent_at: new Date().toISOString(),
      },
      unread_count: 0,
    });
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({ count: 1, results: [conv] }),
      ),
    );

    renderApp(<ConversationList />);

    await screen.findByText('Père Jean');
    expect(screen.getByText('Bonjour !')).toBeInTheDocument();
  });

  test('shows unread badge when unread_count > 0', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createConversation({
              id: 'c1',
              participant_a: {
                id: 'current-user-id',
                email: 'me@test.sn',
                full_name: 'Moi',
              },
              participant_b: {
                id: 'other',
                email: 'jean@eglise.sn',
                full_name: 'Père Jean',
              },
              unread_count: 5,
            }),
          ],
        }),
      ),
    );

    renderApp(<ConversationList />);

    await screen.findByText('5');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('does not show unread badge when unread_count is 0', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createConversation({
              id: 'c1',
              participant_a: {
                id: 'current-user-id',
                email: 'me@test.sn',
                full_name: 'Moi',
              },
              participant_b: {
                id: 'other',
                email: 'jean@eglise.sn',
                full_name: 'Père Jean',
              },
              unread_count: 0,
            }),
          ],
        }),
      ),
    );

    renderApp(<ConversationList />);

    await screen.findByText('Père Jean');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('shows empty state when no conversations exist', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<ConversationList />);

    await screen.findByText(/aucune conversation pour le moment/i);
    expect(
      screen.getByText(/aucune conversation pour le moment/i),
    ).toBeInTheDocument();
  });

  test('shows error message when API request fails', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.error(),
      ),
    );

    renderApp(<ConversationList />);

    await screen.findByText(/impossible de charger vos messages/i);
    expect(
      screen.getByText(/impossible de charger vos messages/i),
    ).toBeInTheDocument();
  });

  test('renders "Aucun message" when last_message is null', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createConversation({
              id: 'c1',
              participant_a: {
                id: 'current-user-id',
                email: 'me@test.sn',
                full_name: 'Moi',
              },
              participant_b: {
                id: 'other',
                email: 'jean@eglise.sn',
                full_name: 'Père Jean',
              },
              last_message: null as never,
              last_message_at: null as never,
              unread_count: 0,
            }),
          ],
        }),
      ),
    );

    renderApp(<ConversationList />);

    await screen.findByText('Père Jean');
    expect(screen.getByText('Aucun message')).toBeInTheDocument();
  });

  test('each conversation links to its chat page', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/messaging/conversations/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createConversation({
              id: 'conv-123',
              participant_a: {
                id: 'current-user-id',
                email: 'me@test.sn',
                full_name: 'Moi',
              },
              participant_b: {
                id: 'other',
                email: 'jean@eglise.sn',
                full_name: 'Père Jean',
              },
              unread_count: 0,
            }),
          ],
        }),
      ),
    );

    renderApp(<ConversationList />);

    const link = await screen.findByRole('link', { name: /père jean/i });
    expect(link).toHaveAttribute('href', '/app/messages/conv-123');
  });
});
