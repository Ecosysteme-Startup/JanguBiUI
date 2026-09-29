import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { Event } from '@/features/agenda/api/get-events';
import { page } from '@/lib/pagination';

import { networkDelay } from '../utils';

import { PAROISSES } from './paroisses';

// Agenda fidèle — contrat réel apps/agenda (EventOutputSerializer) :
// GET /v1/agenda/ (paginé limit/offset, filtres type/node/date_from/date_to),
// GET /v1/agenda/<id>/, POST|DELETE /v1/agenda/<id>/register/.

const API = `${env.API_URL}/v1`;
const SD = PAROISSES.saintDominique;

export const createEvent = (overrides: Partial<Event> = {}): Event => ({
  id: 1,
  title: 'Messe de rentrée paroissiale',
  description:
    'Messe d’action de grâce pour la rentrée, suivie d’un verre de l’amitié.',
  event_type: 'mass',
  start_at: '2026-10-04T09:30:00Z',
  end_at: '2026-10-04T11:30:00Z',
  location: 'Église Saint-Dominique',
  node_id: SD.id,
  node_name: SD.name,
  place_id: 1,
  max_participants: null,
  registration_closes_at: null,
  registrations_count: 0,
  seats_taken: 0,
  seats_remaining: null,
  is_full: false,
  registrations_open: true,
  is_registered: false,
  my_seats: null,
  my_note: null,
  is_cancelled: false,
  ...overrides,
});

export const mockEvents: Event[] = [
  createEvent(),
  createEvent({
    id: 2,
    title: 'Récollection des lecteurs',
    description:
      'Matinée de prière et de formation animée par le Père Emmanuel Tine.',
    event_type: 'retreat',
    start_at: '2026-10-10T08:30:00Z',
    end_at: '2026-10-10T12:30:00Z',
    location: 'Salle paroissiale Saint-Dominique',
    max_participants: 40,
    registrations_count: 12,
    seats_taken: 15,
    seats_remaining: 25,
  }),
  createEvent({
    id: 3,
    title: 'Conférence sur la Parole de Dieu',
    event_type: 'conference',
    start_at: '2026-10-17T17:00:00Z',
    end_at: '2026-10-17T19:00:00Z',
    location: 'Cathédrale Notre-Dame-des-Victoires',
    node_id: PAROISSES.cathedrale.id,
    node_name: PAROISSES.cathedrale.name,
    max_participants: 120,
    registrations_count: 118,
    seats_taken: 120,
    seats_remaining: 0,
    is_full: true,
  }),
];

const inscriptions = new Map<number, number>();

const withRegistration = (e: Event): Event => {
  const seats = inscriptions.get(e.id);
  if (seats == null) return e;
  const taken = e.seats_taken + seats;
  return {
    ...e,
    is_registered: true,
    my_seats: seats,
    seats_taken: taken,
    registrations_count: e.registrations_count + 1,
    seats_remaining:
      e.max_participants == null ? null : e.max_participants - taken,
    is_full: e.max_participants != null && taken >= e.max_participants,
  };
};

const v1Error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

export const agendaHandlers = [
  http.get(`${API}/agenda/`, async ({ request }) => {
    await networkDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const all = mockEvents
      .filter((e) => !type || e.event_type === type)
      .map(withRegistration);
    return HttpResponse.json(
      page(all.slice(offset, offset + limit), {
        limit,
        offset,
        count: all.length,
      }),
    );
  }),

  http.get(`${API}/agenda/:id/`, async ({ params }) => {
    await networkDelay();
    const event = mockEvents.find((e) => e.id === Number(params.id));
    if (!event) return v1Error(404, 'not_found', 'Événement introuvable.');
    return HttpResponse.json(withRegistration(event));
  }),

  http.post(`${API}/agenda/:id/register/`, async ({ params, request }) => {
    await networkDelay();
    const event = mockEvents.find((e) => e.id === Number(params.id));
    if (!event) return v1Error(404, 'not_found', 'Événement introuvable.');
    const body = (await request.json().catch(() => ({}))) as { seats?: number };
    const seats = body.seats ?? 1;
    if (seats < 1 || seats > 10)
      return v1Error(400, 'invalid_seats', 'Indiquez entre 1 et 10 personnes.');
    if (event.is_full && !inscriptions.has(event.id))
      return v1Error(409, 'event_full', 'Cet événement est complet.');
    inscriptions.set(event.id, seats);
    return HttpResponse.json(withRegistration(event), { status: 201 });
  }),

  http.delete(`${API}/agenda/:id/register/`, async ({ params }) => {
    await networkDelay();
    const id = Number(params.id);
    if (!inscriptions.delete(id))
      return v1Error(
        400,
        'not_registered',
        'Vous n’êtes pas inscrit à cet événement.',
      );
    return new HttpResponse(null, { status: 204 });
  }),
];
