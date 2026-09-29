import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type {
  ConfessionBooking,
  ConfessionSlot,
} from '@/features/confessions/api/confessions';
import { page } from '@/lib/pagination';

import { networkDelay } from '../utils';

import { PAROISSES } from './paroisses';

// Confessions — contrat réel apps/confessions (SlotOutput, BookingOutput).

const API = `${env.API_URL}/v1`;
const SD = PAROISSES.saintDominique;
const PERE_TINE = 'b1f0c2d3-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

export const createSlot = (
  overrides: Partial<ConfessionSlot> = {},
): ConfessionSlot => ({
  id: 1,
  starts_at: '2026-10-03T10:00:00Z',
  ends_at: '2026-10-03T10:15:00Z',
  status: 'libre',
  place: {
    id: 1,
    name: 'Église Saint-Dominique',
    address: 'Point E',
    node_id: SD.id,
  },
  priest_id: PERE_TINE,
  priest_name: 'Emmanuel Tine',
  ...overrides,
});

export const mockSlots: ConfessionSlot[] = [
  createSlot(),
  createSlot({
    id: 2,
    starts_at: '2026-10-03T10:15:00Z',
    ends_at: '2026-10-03T10:30:00Z',
  }),
  createSlot({
    id: 3,
    starts_at: '2026-10-03T10:30:00Z',
    ends_at: '2026-10-03T10:45:00Z',
  }),
  createSlot({
    id: 4,
    starts_at: '2026-10-10T10:00:00Z',
    ends_at: '2026-10-10T10:15:00Z',
  }),
];

let bookings: ConfessionBooking[] = [];
let nextBookingId = 1;

export const resetConfessions = () => {
  bookings = [];
  nextBookingId = 1;
};

const v1Error = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message, details: {} } }, { status });

export const confessionsHandlers = [
  http.get(`${API}/confessions/slots/`, async ({ request }) => {
    await networkDelay();
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 10);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const node = url.searchParams.get('node');
    const pris = new Set(
      bookings.filter((b) => b.status === 'reservee').map((b) => b.slot.id),
    );
    const libres = mockSlots.filter(
      (s) => !pris.has(s.id) && (!node || s.place.node_id === node),
    );
    return HttpResponse.json(
      page(libres.slice(offset, offset + limit), {
        limit,
        offset,
        count: libres.length,
      }),
    );
  }),

  http.post(`${API}/confessions/bookings/`, async ({ request }) => {
    await networkDelay();
    const { slot_id } = (await request.json()) as { slot_id: number };
    const slot = mockSlots.find((s) => s.id === slot_id);
    if (!slot) return v1Error(400, 'not_found', 'Créneau introuvable.');
    if (bookings.some((b) => b.slot.id === slot_id && b.status === 'reservee'))
      return v1Error(409, 'slot_taken', 'Ce créneau vient d’être pris.');
    const booking: ConfessionBooking = {
      id: nextBookingId++,
      status: 'reservee',
      slot: { ...slot, status: 'reserve' },
      cancel_message: '',
      cancelled_at: null,
      can_cancel: true,
      created_at: new Date().toISOString(),
    };
    bookings.push(booking);
    return HttpResponse.json(booking, { status: 201 });
  }),

  http.post(`${API}/confessions/bookings/:id/cancel/`, async ({ params }) => {
    await networkDelay();
    const b = bookings.find((x) => x.id === Number(params.id));
    if (!b) return v1Error(400, 'not_found', 'Réservation introuvable.');
    if (b.status !== 'reservee')
      return v1Error(
        400,
        'booking_not_active',
        'Cette réservation n’est plus active.',
      );
    b.status = 'annulee_fidele';
    b.can_cancel = false;
    b.cancelled_at = new Date().toISOString();
    return HttpResponse.json(b);
  }),

  http.get(`${API}/me/confession-bookings/`, async () => {
    await networkDelay();
    return HttpResponse.json(page(bookings, { limit: 50 }));
  }),
];
