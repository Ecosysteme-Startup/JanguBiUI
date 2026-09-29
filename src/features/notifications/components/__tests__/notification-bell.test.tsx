import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen } from '@/testing/test-utils';
import { createUser } from '@/testing/data-generators';

import { NotificationBell } from '@/components/layouts/notification-bell';

const mockNotifications = [
  {
    id: 'notif-1',
    event_type: 'new_message',
    payload: {},
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 2 * 60_000).toISOString(),
  },
  {
    id: 'notif-2',
    event_type: 'document_validated',
    payload: {},
    is_read: true,
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
  },
];

function setupAuthenticatedUser() {
  const user = createUser();
  server.use(
    http.get(`${env.API_URL}/v1/me/`, () => HttpResponse.json(user)),
  );
  return user;
}

describe('NotificationBell', () => {
  test('renders the bell button', async () => {
    setupAuthenticatedUser();
    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json([]),
      ),
    );

    renderApp(<NotificationBell />);

    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });

  test('shows unread badge when there are unread notifications', async () => {
    setupAuthenticatedUser();
    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json(mockNotifications),
      ),
    );

    renderApp(<NotificationBell />);

    // Badge shows unread count (1 unread)
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  test('does not show badge when all notifications are read', async () => {
    setupAuthenticatedUser();
    const allRead = mockNotifications.map((n) => ({ ...n, is_read: true }));
    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json(allRead),
      ),
    );

    renderApp(<NotificationBell />);

    await waitFor(() => {
      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });
  });

  test('opens dropdown and shows notification list when clicked', async () => {
    setupAuthenticatedUser();
    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json(mockNotifications),
      ),
    );

    renderApp(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText('Nouveau message reçu')).toBeInTheDocument();
      expect(screen.getByText('Document validé')).toBeInTheDocument();
    });
  });

  test('shows empty state when no notifications', async () => {
    setupAuthenticatedUser();
    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json([]),
      ),
    );

    renderApp(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText('Aucune notification')).toBeInTheDocument();
    });
  });

  test('calls mark-read endpoint when clicking an unread notification', async () => {
    setupAuthenticatedUser();
    const readIds: string[] = [];

    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json(mockNotifications),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/notifications/:id/read/`,
        ({ params }) => {
          readIds.push(String(params.id));
          return HttpResponse.json({ ...mockNotifications[0], is_read: true });
        },
      ),
    );

    renderApp(<NotificationBell />);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    await screen.findByText('Nouveau message reçu');

    await userEvent.click(screen.getByText('Nouveau message reçu'));

    await waitFor(() => {
      expect(readIds).toContain('notif-1');
    });
  });

  test('shows 9+ badge when more than 9 notifications are unread', async () => {
    setupAuthenticatedUser();
    const manyUnread = Array.from({ length: 12 }, (_, i) => ({
      id: `notif-${i}`,
      event_type: 'new_message',
      payload: {},
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString(),
    }));

    server.use(
      http.get(`${env.API_URL}/v1/messaging/notifications/`, () =>
        HttpResponse.json(manyUnread),
      ),
    );

    renderApp(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });
});
