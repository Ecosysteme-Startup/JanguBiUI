import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

export const mockNotifications = [
  {
    id: 'notif-1',
    event_type: 'new_message',
    payload: { conversation_id: 'conv-1' },
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'notif-2',
    event_type: 'document_validated',
    payload: { document_id: 'doc-1' },
    is_read: true,
    read_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
];

let ticketsEmis = 0;

export const notificationsHandlers = [
  // Ticket WebSocket à usage unique (TEMPS-REEL §1).
  http.post(`${env.API_URL}/v1/me/ws-ticket/`, () => {
    ticketsEmis += 1;
    return HttpResponse.json({
      ticket: `ticket-demo-${ticketsEmis}`,
      expires_in: 60,
    });
  }),

  http.get(`${env.API_URL}/v1/messaging/notifications/`, () => {
    return HttpResponse.json(mockNotifications);
  }),

  http.post(
    `${env.API_URL}/v1/messaging/notifications/:id/read/`,
    ({ params }) => {
      const id = String(params.id);
      const notification = mockNotifications.find((n) => n.id === id);
      if (!notification) return new HttpResponse(null, { status: 404 });
      notification.is_read = true;
      notification.read_at = new Date().toISOString();
      return HttpResponse.json(notification);
    },
  ),
];
