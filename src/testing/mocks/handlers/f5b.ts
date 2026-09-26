import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { ids, onboardingState } from '@/testing/mocks/db';
import {
  announcementDetails,
  announcements,
  currentRequests,
  f5bState,
  parishNode,
  parishWeek,
  priests,
  rosaryToday,
} from '@/testing/mocks/db-f5b';

const page = <T,>(results: T[]) => ({ count: results.length, next: null, previous: null, results });

/** Lot F5b : Ma paroisse, annonces, agenda, notifications, profil, accueil. */
export const f5bHandlers = [
  // Ma paroisse
  http.get(apiUrl(`/hierarchy/nodes/${ids.saintDominique}/`), () => HttpResponse.json(parishNode)),
  http.get(apiUrl('/news/'), () => HttpResponse.json(page(announcements))),
  http.get(apiUrl('/news/:id/'), ({ params }) => {
    const detail = announcementDetails[String(params.id)];
    return detail ? HttpResponse.json(detail) : HttpResponse.json({ message: 'Article introuvable.' }, { status: 404 });
  }),
  http.post(apiUrl('/news/:id/read/'), ({ params }) => {
    f5bState.readArticles.push(String(params.id));
    return HttpResponse.json({ first_read: true });
  }),
  http.get(apiUrl('/public/nodes/:id/week/'), () => HttpResponse.json(parishWeek)),
  http.get(apiUrl('/agenda/'), () => HttpResponse.json(page(Object.values(f5bState.events)))),
  http.get(apiUrl('/agenda/:id/'), ({ params }) => {
    const event = f5bState.events[Number(params.id)];
    return event ? HttpResponse.json(event) : HttpResponse.json({ message: 'Événement introuvable.' }, { status: 404 });
  }),
  http.post(apiUrl('/agenda/:id/register/'), ({ params }) => {
    const event = f5bState.events[Number(params.id)];
    if (!event) return HttpResponse.json({ message: 'Événement introuvable.' }, { status: 404 });
    if (event.is_full) return HttpResponse.json({ message: 'Cet événement est complet.' }, { status: 409 });
    const updated = { ...event, is_registered: true, registrations_count: event.registrations_count + 1 };
    f5bState.events[event.id] = updated;
    return HttpResponse.json(updated, { status: 201 });
  }),
  http.delete(apiUrl('/agenda/:id/register/'), ({ params }) => {
    const event = f5bState.events[Number(params.id)];
    if (event) f5bState.events[event.id] = { ...event, is_registered: false, registrations_count: event.registrations_count - 1 };
    return new HttpResponse(null, { status: 204 });
  }),
  http.get(apiUrl('/messaging/priests/'), () => HttpResponse.json(priests)),

  // Accueil
  http.get(apiUrl('/documents/requests/'), () => HttpResponse.json(page(currentRequests))),
  http.get(apiUrl('/rosary/today/'), () => HttpResponse.json(rosaryToday)),

  // Notifications
  http.get(apiUrl('/notifications/'), () => HttpResponse.json(f5bState.notifications)),
  http.post(apiUrl('/notifications/read-all/'), () => {
    f5bState.notifications = f5bState.notifications.map((n) => ({ ...n, is_read: true }));
    return HttpResponse.json({ unread: 0 });
  }),
  http.post(apiUrl('/notifications/:id/read/'), ({ params }) => {
    f5bState.readIds.push(String(params.id));
    f5bState.notifications = f5bState.notifications.map((n) => (n.id === params.id ? { ...n, is_read: true } : n));
    return HttpResponse.json(f5bState.notifications.find((n) => n.id === params.id));
  }),
  http.post(apiUrl('/me/ws-ticket/'), () => HttpResponse.json({ ticket: 'ticket-test', expires_in: 60 })),

  // Profil
  http.get(apiUrl('/me/notification-preferences/'), () => HttpResponse.json(f5bState.preferences)),
  http.put(apiUrl('/me/notification-preferences/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f5bState.preferences = { ...f5bState.preferences, ...body };
    // Même endpoint que l'onboarding (placé avant lui) : on reflète aussi son état.
    if (typeof body.topic_annonces === 'boolean') onboardingState.annonces = body.topic_annonces;
    return HttpResponse.json(f5bState.preferences);
  }),
  http.get(apiUrl('/me/declaration/'), () => HttpResponse.json(f5bState.declaration)),
  http.patch(apiUrl('/me/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.phone === 'string' && body.phone.startsWith('+000')) {
      return HttpResponse.json({ phone: ['Saisissez un numéro de téléphone valide.'] }, { status: 400 });
    }
    f5bState.profilePatches.push(body);
    return HttpResponse.json({});
  }),
  http.get(apiUrl('/me/export/'), () => HttpResponse.json({ profil: { email: 'marie-therese.diouf@example.sn' } })),
  http.delete(apiUrl('/me/'), () => {
    if (f5bState.deleteConflict) {
      return HttpResponse.json({ message: 'Vous avez une nomination en cours : demandez d’abord qu’elle prenne fin.' }, { status: 409 });
    }
    f5bState.deleted = true;
    return new HttpResponse(null, { status: 204 });
  }),
];
