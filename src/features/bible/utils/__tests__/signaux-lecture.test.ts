import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';

import {
  reinitialiserSignaux,
  signalerLecture,
  signauxCoupes,
  signauxEnAttente,
  viderSignaux,
} from '../signaux-lecture';

const URL_EVENEMENTS = `${env.API_URL}/v1/bible/evenements/`;

describe('signaux de lecture', () => {
  beforeEach(() => reinitialiserSignaux());
  afterEach(() => reinitialiserSignaux());

  test('met en file puis envoie un lot idempotent au contrat', async () => {
    const lots: { evenements: Record<string, unknown>[] }[] = [];
    server.use(
      http.post(URL_EVENEMENTS, async ({ request }) => {
        const corps = (await request.json()) as {
          evenements: Record<string, unknown>[];
        };
        lots.push(corps);
        return HttpResponse.json({
          recus: corps.evenements.length,
          enregistres: corps.evenements.length,
          rejetes: [],
          personnalisation_parole: true,
        });
      }),
    );
    const quand = new Date('2026-09-26T21:40:00Z');
    signalerLecture(
      { type: 'lu', livre_id: 49, chapitre: 9, termine: false },
      quand,
    );
    signalerLecture({ type: 'recherche', verset_debut_id: 25893 }, quand);
    expect(signauxEnAttente()).toHaveLength(2);

    await viderSignaux();
    expect(lots).toHaveLength(1);
    const [lu, recherche] = lots[0].evenements;
    expect(lu).toMatchObject({
      type: 'lu',
      livre_id: 49,
      chapitre: 9,
      termine: false,
      occurred_at: '2026-09-26T21:40:00.000Z',
    });
    expect(typeof lu.client_event_id).toBe('string');
    expect(lu.client_event_id).not.toBe(recherche.client_event_id);
    expect(recherche).toMatchObject({
      type: 'recherche',
      verset_debut_id: 25893,
    });
    expect(signauxEnAttente()).toHaveLength(0);
  });

  test('par lots de 200 au plus', async () => {
    const tailles: number[] = [];
    server.use(
      http.post(URL_EVENEMENTS, async ({ request }) => {
        const n = ((await request.json()) as { evenements: unknown[] })
          .evenements.length;
        tailles.push(n);
        return HttpResponse.json({
          recus: n,
          enregistres: n,
          rejetes: [],
          personnalisation_parole: true,
        });
      }),
    );
    for (let i = 0; i < 250; i += 1) {
      signalerLecture({ type: 'lu', livre_id: 1, chapitre: 1 });
    }
    await viderSignaux();
    expect(tailles).toEqual([200, 50]);
  });

  test('personnalisation désactivée : on cesse d’envoyer', async () => {
    server.use(
      http.post(URL_EVENEMENTS, () =>
        HttpResponse.json({
          recus: 1,
          enregistres: 0,
          rejetes: [],
          personnalisation_parole: false,
        }),
      ),
    );
    signalerLecture({ type: 'lu', livre_id: 49, chapitre: 9 });
    await viderSignaux();
    expect(signauxCoupes()).toBe(true);
    signalerLecture({ type: 'lu', livre_id: 49, chapitre: 10 });
    expect(signauxEnAttente()).toHaveLength(0);
  });

  test('hors ligne : les signaux restent en file', async () => {
    server.use(http.post(URL_EVENEMENTS, () => HttpResponse.error()));
    signalerLecture({ type: 'lu', livre_id: 49, chapitre: 9 });
    await viderSignaux();
    expect(signauxEnAttente()).toHaveLength(1);
  });
});
