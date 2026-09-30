import { http, HttpResponse } from 'msw';

import { apiUrl } from '@/testing/mocks/api-url';
import { me, mockState } from '@/testing/mocks/db';
import {
  f7State,
  makePlanning,
  makeSlots,
  places,
  priests,
} from '@/testing/mocks/db-f7-pretre';

const page = <T>(results: T[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

/** Lot F7 : messagerie (apps/messaging), confessions (apps/confessions), lieux de culte. */
export const f7PretreHandlers = [
  // Messagerie
  http.post(apiUrl('/me/ws-ticket/'), () =>
    HttpResponse.json({ ticket: 'ticket-test', expires_in: 60 }),
  ),
  http.get(apiUrl('/messaging/priests/'), () => HttpResponse.json(priests)),
  http.get(apiUrl('/messaging/cgu/'), () =>
    HttpResponse.json({
      accepted: f7State.cguAccepted,
      accepted_at: f7State.cguAccepted ? '2026-09-01T10:00:00+00:00' : null,
    }),
  ),
  http.post(apiUrl('/messaging/cgu/'), () => {
    f7State.cguAccepted = true;
    return HttpResponse.json({
      accepted: true,
      accepted_at: '2026-09-25T10:00:00+00:00',
    });
  }),
  http.get(apiUrl('/messaging/conversations/'), ({ request }) => {
    const search = (
      new URL(request.url).searchParams.get('search') ?? ''
    ).toLowerCase();
    return HttpResponse.json(
      f7State.conversations.filter(
        (c) =>
          !search ||
          `${c.participant_b.full_name} ${c.participant_a.full_name}`
            .toLowerCase()
            .includes(search),
      ),
    );
  }),
  http.post(apiUrl('/messaging/conversations/create/'), async ({ request }) => {
    const body = (await request.json()) as { priest_user_id: string };
    f7State.created.push(body.priest_user_id);
    return HttpResponse.json(
      { ...f7State.conversations[0], id: `new-${body.priest_user_id}` },
      { status: 201 },
    );
  }),
  http.get(apiUrl('/messaging/conversations/:id/'), ({ params }) => {
    const found = f7State.conversations.find((c) => c.id === params.id);
    return found
      ? HttpResponse.json(found)
      : new HttpResponse(null, { status: 404 });
  }),
  http.get(apiUrl('/messaging/conversations/:id/messages/'), () =>
    f7State.cguAccepted
      ? HttpResponse.json(f7State.messages)
      : HttpResponse.json(
          {
            detail:
              'Vous devez accepter les CGU de messagerie pour accéder aux messages.',
          },
          { status: 403 },
        ),
  ),
  http.post(
    apiUrl('/messaging/conversations/:id/messages/send/'),
    async ({ request }) => {
      const body = (await request.json()) as {
        content: string;
        client_message_id?: string;
      };
      f7State.sent.push(body);
      const message = {
        id: `sent-${f7State.sent.length}`,
        sender_id: me.id,
        sender_name: 'Marie-Thérèse Diouf',
        content: body.content,
        content_type: 'text',
        client_message_id: body.client_message_id ?? null,
        reply_to_id: null,
        read_at: null,
        deleted_at: null,
        is_deleted: false,
        reactions: [],
        attachments: [],
        created_at: new Date().toISOString(),
      };
      f7State.messages = [message, ...f7State.messages];
      return HttpResponse.json(message, { status: 201 });
    },
  ),
  http.post(apiUrl('/messaging/conversations/:id/read/'), () => {
    f7State.markedRead += 1;
    return HttpResponse.json({ status: 'ok' });
  }),
  http.post(apiUrl('/messaging/conversations/:id/archive/'), ({ params }) => {
    f7State.conversations = f7State.conversations.map((c) =>
      c.id === params.id ? { ...c, is_archived: true } : c,
    );
    return HttpResponse.json(
      f7State.conversations.find((c) => c.id === params.id),
    );
  }),
  http.get(apiUrl('/messaging/availability/'), () =>
    HttpResponse.json(f7State.availability),
  ),
  http.put(apiUrl('/messaging/availability/'), async ({ request }) => {
    f7State.availability = {
      ...f7State.availability,
      ...((await request.json()) as object),
    };
    return HttpResponse.json(f7State.availability);
  }),

  // Confession (fidèle)
  http.get(apiUrl('/confessions/slots/'), () =>
    HttpResponse.json(page(makeSlots())),
  ),
  http.get(apiUrl('/me/confession-bookings/'), () =>
    HttpResponse.json(page(f7State.bookings)),
  ),
  http.post(apiUrl('/confessions/bookings/'), async ({ request }) => {
    const body = (await request.json()) as { slot_id: number };
    f7State.bookingBodies.push(body);
    const slot = makeSlots().find((s) => s.id === body.slot_id)!;
    const booking = {
      id: 900,
      status: 'reservee',
      slot: { ...slot, status: 'reserve' },
      cancel_message: '',
      cancelled_at: null,
      can_cancel: true,
      created_at: '2026-09-24T10:00:00+00:00',
    };
    f7State.bookings = [booking];
    return HttpResponse.json(booking, { status: 201 });
  }),
  http.post(apiUrl('/confessions/bookings/:id/cancel/'), ({ params }) => {
    f7State.cancelledBookings.push(Number(params.id));
    const booking = {
      ...(f7State.bookings[0] as object),
      status: 'annulee_fidele',
      can_cancel: false,
    };
    f7State.bookings = [];
    return HttpResponse.json(booking);
  }),

  // Confession (back-office)
  http.get(apiUrl('/staff/confessions/planning/'), () =>
    HttpResponse.json(
      makePlanning(
        mockState.grants.some((g) => g.capacite === 'confessions.gerer'),
      ).map((slot) => {
        // Dernière présence notée sur ce rendez-vous : honoree ou absent.
        const noted = f7State.attendance.findLast(
          (a) => a.bookingId === slot.booking?.id,
        );
        return noted && slot.booking
          ? {
              ...slot,
              booking: {
                ...slot.booking,
                status: noted.body.attended ? 'honoree' : 'absent',
              },
            }
          : slot;
      }),
    ),
  ),
  http.post(
    apiUrl('/staff/confessions/bookings/:id/attendance/'),
    async ({ params, request }) => {
      const body = (await request.json()) as { attended?: unknown };
      if (typeof body.attended !== 'boolean')
        return HttpResponse.json(
          {
            error: {
              code: 'validation_error',
              message: 'Indiquez si la personne est venue.',
              details: { attended: ['Ce champ est obligatoire.'] },
            },
          },
          { status: 400 },
        );
      f7State.attendance.push({
        bookingId: Number(params.id),
        body: { attended: body.attended },
      });
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.get(apiUrl('/staff/confessions/rules/'), () =>
    HttpResponse.json(f7State.rules),
  ),
  http.post(apiUrl('/staff/confessions/rules/'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    f7State.ruleBodies.push(body);
    return HttpResponse.json(
      {
        id: 1,
        place: {
          id: 11,
          name: 'Église Saint-Dominique',
          address: '',
          node_id: places[0].node_id,
        },
        ...body,
        is_active: true,
      },
      { status: 201 },
    );
  }),
  http.delete(apiUrl('/staff/confessions/rules/:id/'), ({ params }) => {
    f7State.deletedRules.push(Number(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
  http.post(
    apiUrl('/staff/confessions/slots/:id/cancel/'),
    async ({ params, request }) => {
      f7State.cancelledSlots.push({
        slotId: Number(params.id),
        body: await request.json(),
      });
      return HttpResponse.json({
        ...makeSlots()[0],
        id: Number(params.id),
        status: 'bloque',
      });
    },
  ),
  http.get(apiUrl('/hierarchy/nodes/:nodeId/places/'), () =>
    HttpResponse.json(places),
  ),
];
