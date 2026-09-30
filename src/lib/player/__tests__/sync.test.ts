import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { dispatchNotificationFrameForTests } from '@/lib/realtime/notifications-socket';
import { useNotificationsSocket } from '@/lib/realtime/use-notifications-socket';
import {
  GLORIA_ID,
  messeTracks,
  resetAudioLecteurMocks,
} from '@/testing/mocks/handlers/audio-lecteur';
import { server } from '@/testing/mocks/server';

import { getDeviceId, resetDeviceIdForTests } from '../device';
import {
  DEFAULT_RETRY_AFTER_S,
  flushListenEvents,
  listenEventsThrottled,
  pendingListenEvents,
  resetListenEventsForTests,
} from '../listen-events';
import {
  attachPlayerEngine,
  resetPlayerModuleForTests,
  usePlayerStore,
} from '../player-store';
import { resetStateSyncForTests, STATE_INTERVAL_MS } from '../state-sync';
import { EVENTS_INTERVAL_MS, usePlayerSync } from '../use-player-sync';

import { FakeEngine } from './fake-engine';
import { FakeWebSocket } from '@/testing/fake-web-socket';
import { simulerSession, terminerSession } from '@/testing/session';
import { createTestQueryClient } from '@/testing/test-utils';

// Chaque store zustand repart de son état initial après chaque test (__mocks__/zustand.ts).
vi.mock('zustand');

beforeEach(simulerSession);
afterEach(terminerSession);

const API = `${env.API_URL}/audio`;
const store = () => usePlayerStore.getState();

interface PutBody {
  track_id: string;
  position_seconds: number;
  device_id: string;
  client_updated_at: string;
  playing?: boolean;
}

let puts: PutBody[];
let batches: { events: { kind: string }[] }[];
let engine: FakeEngine;
let detach: () => void;

beforeEach(() => {
  vi.stubEnv('TEST', 'true');
  localStorage.clear();
  resetPlayerModuleForTests();
  resetListenEventsForTests();
  resetStateSyncForTests();
  resetDeviceIdForTests();
  resetAudioLecteurMocks();
  puts = [];
  batches = [];
  server.use(
    http.put(`${API}/lecture/etat/`, async ({ request }) => {
      const body = (await request.json()) as PutBody;
      puts.push(body);
      return HttpResponse.json({ applied: true, state: null });
    }),
    http.post(`${API}/evenements/`, async ({ request }) => {
      batches.push((await request.json()) as never);
      return HttpResponse.json(
        { recus: 1, enregistres: 1, doublons: 0, rejetes: 0 },
        { status: 202 },
      );
    }),
  );
  engine = new FakeEngine();
  detach = attachPlayerEngine(engine);
});

afterEach(() => {
  detach();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('PUT lecture/etat/', () => {
  it('écrit l’état au lancement (playing), toutes les 15 s, à la pause', async () => {
    await store().playTracks(messeTracks, 2);
    // Décision 10 : le lancement part avec `playing: true`.
    await vi.waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toMatchObject({
      track_id: GLORIA_ID,
      position_seconds: 112,
      device_id: getDeviceId(),
      playing: true,
    });
    vi.useFakeTimers();
    renderHook(() => usePlayerSync(false));

    engine.tick(120);
    await vi.advanceTimersByTimeAsync(STATE_INTERVAL_MS);
    expect(puts).toHaveLength(2);
    expect(puts[1]).toMatchObject({
      track_id: GLORIA_ID,
      position_seconds: 120,
      device_id: getDeviceId(),
      playing: false,
    });
    expect(new Date(puts[1].client_updated_at).toISOString()).toBe(
      puts[1].client_updated_at,
    );

    engine.tick(135);
    store().pause();
    await vi.advanceTimersByTimeAsync(0);
    expect(puts).toHaveLength(3); // à la pause
    expect(puts[2]).toMatchObject({ position_seconds: 135, playing: false });

    await vi.advanceTimersByTimeAsync(STATE_INTERVAL_MS * 2);
    expect(puts).toHaveLength(3); // rien en pause

    // Reprise : de nouveau `playing: true`.
    store().play();
    await vi.advanceTimersByTimeAsync(0);
    expect(puts).toHaveLength(4);
    expect(puts[3]).toMatchObject({ position_seconds: 135, playing: true });
  });

  it('à pagehide : état et événements partent en fetch keepalive', async () => {
    await store().playTracks(messeTracks, 2);
    await vi.waitFor(() => expect(puts).toHaveLength(1)); // lancement
    puts.length = 0;
    renderHook(() => usePlayerSync(false));
    const spy = vi.spyOn(globalThis, 'fetch');
    engine.tick(150);
    window.dispatchEvent(new Event('pagehide'));
    await vi.waitFor(() => expect(puts).toHaveLength(1));
    await vi.waitFor(() => expect(batches).toHaveLength(1));
    const calls = spy.mock.calls.filter(
      ([url]) =>
        String(url).includes('/lecture/etat/') ||
        String(url).includes('/evenements/'),
    );
    expect(calls.length).toBeGreaterThanOrEqual(2);
    for (const [, init] of calls)
      expect((init as RequestInit).keepalive).toBe(true);
    expect(puts[0].position_seconds).toBe(150);
  });
});

describe('événements d’écoute en lot', () => {
  it('envoie la file toutes les 30 s puis la vide', async () => {
    await store().playTracks(messeTracks, 2);
    expect(pendingListenEvents().map((e) => e.kind)).toEqual(['start']);
    vi.useFakeTimers();
    renderHook(() => usePlayerSync(false));
    await vi.advanceTimersByTimeAsync(EVENTS_INTERVAL_MS);
    expect(batches).toHaveLength(1);
    expect(batches[0].events.map((e) => e.kind)).toEqual(['start']);
    expect(pendingListenEvents()).toHaveLength(0);
  });

  it('garde la file si le serveur est injoignable', async () => {
    server.use(http.post(`${API}/evenements/`, () => HttpResponse.error()));
    await store().playTracks(messeTracks, 2);
    vi.useFakeTimers();
    renderHook(() => usePlayerSync(false));
    await vi.advanceTimersByTimeAsync(EVENTS_INTERVAL_MS);
    expect(pendingListenEvents()).toHaveLength(1);
  });

  it('sur 429, renvoie le même lot après Retry-After, pas avant', async () => {
    const recus: { events: { client_event_id: string }[] }[] = [];
    let limite = true;
    server.use(
      http.post(`${API}/evenements/`, async ({ request }) => {
        recus.push((await request.json()) as never);
        if (limite) {
          limite = false;
          return HttpResponse.json(
            { error: { code: 'throttled', message: 'Trop de requêtes.' } },
            { status: 429, headers: { 'Retry-After': '20' } },
          );
        }
        return HttpResponse.json(
          { recus: 1, enregistres: 1, doublons: 0, rejetes: 0 },
          { status: 202 },
        );
      }),
    );
    await store().playTracks(messeTracks, 2);
    vi.useFakeTimers();
    await flushListenEvents();
    expect(recus).toHaveLength(1);
    expect(listenEventsThrottled()).toBe(true);
    expect(pendingListenEvents()).toHaveLength(1);

    // Aucun envoi pendant l'attente, même au retour du réseau.
    await flushListenEvents();
    await vi.advanceTimersByTimeAsync(19_000);
    expect(recus).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1_500);
    await vi.waitFor(() => expect(recus).toHaveLength(2));
    expect(recus[1].events.map((e) => e.client_event_id)).toEqual(
      recus[0].events.map((e) => e.client_event_id),
    );
    await vi.waitFor(() => expect(pendingListenEvents()).toHaveLength(0));
    expect(listenEventsThrottled()).toBe(false);
  });

  it('sur 429 sans Retry-After, attend 60 s', async () => {
    let appels = 0;
    server.use(
      http.post(`${API}/evenements/`, () => {
        appels += 1;
        return HttpResponse.json(
          { error: { code: 'throttled' } },
          { status: 429 },
        );
      }),
    );
    await store().playTracks(messeTracks, 2);
    vi.useFakeTimers();
    await flushListenEvents();
    expect(appels).toBe(1);
    await vi.advanceTimersByTimeAsync(DEFAULT_RETRY_AFTER_S * 1000 - 1_000);
    expect(appels).toBe(1);
    await vi.advanceTimersByTimeAsync(1_500);
    await vi.waitFor(() => expect(appels).toBe(2));
  });
});

describe('reprise multi-appareils', () => {
  it('au démarrage, propose de reprendre l’écoute de l’autre appareil', async () => {
    renderHook(() => usePlayerSync(true));
    await vi.waitFor(() => expect(store().offer).not.toBeNull());
    expect(store().offer).toMatchObject({
      positionSeconds: 107,
      deviceId: 'web-ordinateur-paroisse',
    });
    expect(store().offer?.track.id).toBe(GLORIA_ID);
  });

  it('ne propose rien sans état (204)', async () => {
    server.use(
      http.get(
        `${API}/lecture/etat/`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    renderHook(() => usePlayerSync(true));
    await new Promise((r) => setTimeout(r, 20));
    expect(store().offer).toBeNull();
  });

  it('playback.state d’un autre appareil → offre ; le sien ou en lecture → ignoré', async () => {
    server.use(
      http.get(
        `${API}/lecture/etat/`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    renderHook(() => usePlayerSync(true));

    dispatchNotificationFrameForTests({
      type: 'notification',
      event_type: 'playback.state',
      track_id: GLORIA_ID,
      position_seconds: 88,
      device_id: getDeviceId(),
      updated_at: '2026-09-27T10:43:02Z',
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(store().offer).toBeNull();

    dispatchNotificationFrameForTests({
      type: 'notification',
      event_type: 'playback.state',
      track_id: GLORIA_ID,
      position_seconds: 88,
      device_id: 'android-mt-diouf',
      updated_at: '2026-09-27T10:43:02Z',
    });
    await vi.waitFor(() => expect(store().offer?.positionSeconds).toBe(88));
    expect(store().offer?.track.title).toBe('Gloria — Messe de la Visitation');

    store().setOffer(null);
    await store().playTracks(messeTracks, 0);
    dispatchNotificationFrameForTests({
      type: 'notification',
      event_type: 'playback.state',
      track_id: GLORIA_ID,
      position_seconds: 90,
      device_id: 'android-mt-diouf',
      updated_at: '2026-09-27T10:44:00Z',
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(store().offer).toBeNull();
  });
});

describe('une lecture à la fois (décision 10)', () => {
  const pauseFrame = (sauf: string) => ({
    type: 'notification',
    event_type: 'playback.state',
    action: 'pause',
    sauf_device_id: sauf,
    track_id: GLORIA_ID,
    device_id: sauf,
  });

  beforeEach(() => {
    server.use(
      http.get(
        `${API}/lecture/etat/`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  });

  it('playback.state action pause d’un autre appareil → pause, sans erreur ni écriture', async () => {
    renderHook(() => usePlayerSync(true));
    await store().playTracks(messeTracks, 2);
    await vi.waitFor(() => expect(puts).toHaveLength(1));
    engine.tick(130);

    dispatchNotificationFrameForTests(pauseFrame('android-mt-diouf'));
    expect(store().status).toBe('paused');
    expect(engine.playing).toBe(false);
    expect(store().pausedElsewhere).toBe(true);
    expect(store().errorMessage).toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    // L'autre appareil garde la main : pas de PUT à cette pause.
    expect(puts).toHaveLength(1);
    expect(store().offer).toBeNull();

    // Reprendre ici : on relance, `playing: true` repart.
    store().play();
    await vi.waitFor(() => expect(puts).toHaveLength(2));
    expect(puts[1].playing).toBe(true);
    expect(store().pausedElsewhere).toBe(false);
  });

  it('reçoit la pause par la socket ws/notifications/ unique de l’onglet (bus), sans socket à lui', async () => {
    const client = createTestQueryClient();
    renderHook(() => useNotificationsSocket(true), {
      wrapper: ({ children }) =>
        createElement(QueryClientProvider, { client }, children),
    });
    renderHook(() => usePlayerSync(true));
    await store().playTracks(messeTracks, 2);
    await vi.waitFor(() => expect(FakeWebSocket.last()?.readyState).toBe(1));
    // Le lecteur n'ouvre aucune socket : seule celle de l'onglet existe.
    expect(FakeWebSocket.instances).toHaveLength(1);

    FakeWebSocket.last()!.emit(pauseFrame('android-mt-diouf'));
    expect(store().status).toBe('paused');
    expect(engine.playing).toBe(false);
    expect(store().pausedElsewhere).toBe(true);
  });

  it('ignore la pause qui l’exclut (sauf_device_id = cet appareil)', async () => {
    renderHook(() => usePlayerSync(true));
    await store().playTracks(messeTracks, 2);
    dispatchNotificationFrameForTests(pauseFrame(getDeviceId()));
    expect(store().status).toBe('playing');
    expect(engine.playing).toBe(true);
  });
});
