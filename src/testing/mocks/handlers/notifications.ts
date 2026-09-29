import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

export const mockNotifications = [
  {
    id: 'notif-1',
    event_type: 'message.received',
    payload: { conversation_id: 'conv-1' },
    is_read: false,
    read_at: null,
    created_at: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: 'notif-2',
    event_type: 'documents.status',
    payload: {
      request_id: '0f1e2d3c-4b5a-4968-8778-695a4b3c2d1e',
      reference: 'DOC-20260921-4F2A1C',
      status: 'ready_for_pickup',
    },
    is_read: true,
    read_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
  },
];

let ticketsEmis = 0;

// Préférences (NotificationPreference) : valeurs par défaut du backend.
let preferences = {
  in_app: true,
  email: true,
  push: true,
  topic_annonces: true,
  topic_evenements: true,
  quiet_start: '22:00:00',
  quiet_end: '06:00:00',
};

export const notificationsHandlers = [
  // Ticket WebSocket à usage unique (TEMPS-REEL §1).
  http.post(`${env.API_URL}/v1/me/ws-ticket/`, () => {
    ticketsEmis += 1;
    return HttpResponse.json({
      ticket: `ticket-demo-${ticketsEmis}`,
      expires_in: 60,
    });
  }),

  // Routes canoniques /v1/notifications/ (apps/messaging urls_notifications).
  http.get(`${env.API_URL}/v1/notifications/`, () => {
    return HttpResponse.json(mockNotifications);
  }),

  http.get(`${env.API_URL}/v1/notifications/unread-count/`, () =>
    HttpResponse.json({
      unread: mockNotifications.filter((n) => !n.is_read).length,
    }),
  ),

  http.post(`${env.API_URL}/v1/notifications/read-all/`, () => {
    for (const n of mockNotifications) {
      n.is_read = true;
      n.read_at = n.read_at ?? new Date().toISOString();
    }
    return HttpResponse.json({ unread: 0 });
  }),

  http.post(`${env.API_URL}/v1/notifications/:id/read/`, ({ params }) => {
    const id = String(params.id);
    const notification = mockNotifications.find((n) => n.id === id);
    if (!notification) return new HttpResponse(null, { status: 404 });
    notification.is_read = true;
    notification.read_at = new Date().toISOString();
    return HttpResponse.json(notification);
  }),

  http.get(`${env.API_URL}/v1/me/notification-preferences/`, () =>
    HttpResponse.json(preferences),
  ),

  http.put(
    `${env.API_URL}/v1/me/notification-preferences/`,
    async ({ request }) => {
      preferences = { ...preferences, ...((await request.json()) as object) };
      return HttpResponse.json(preferences);
    },
  ),

  // Export RGPD (GET /v1/me/export/) : un objet JSON.
  http.get(`${env.API_URL}/v1/me/export/`, () =>
    HttpResponse.json({ profil: { email: 'marie-therese.diouf@exemple.sn' } }),
  ),
];
