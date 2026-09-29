import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { dispatchNotificationFrameForTests } from '@/lib/realtime/notifications-socket';
import {
  GLORIA_ID,
  messeTracks,
  resetAudioLecteurMocks,
} from '@/testing/mocks/handlers/audio-lecteur';
import { server } from '@/testing/mocks/server';

import { getDeviceId, resetDeviceIdForTests } from '../device';
import {
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

const API = `${env.API_URL}/v1/audio`;
const store = () => usePlayerStore.getState();

interface PutBody {
  track_id: string;
  position_seconds: number;
  device_id: string;
  client_updated_at: string;
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
  it('écrit l’état toutes les 15 s pendant la lecture, pas en pause', async () => {
    await store().playTracks(messeTracks, 2);
    vi.useFakeTimers();
    renderHook(() => usePlayerSync(false));

    engine.tick(120);
    await vi.advanceTimersByTimeAsync(STATE_INTERVAL_MS);
    expect(puts).toHaveLength(1);
    expect(puts[0]).toMatchObject({
      track_id: GLORIA_ID,
      position_seconds: 120,
      device_id: getDeviceId(),
    });
    expect(new Date(puts[0].client_updated_at).toISOString()).toBe(
      puts[0].client_updated_at,
    );

    engine.tick(135);
    store().pause();
    await vi.advanceTimersByTimeAsync(0);
    expect(puts).toHaveLength(2); // à la pause
    expect(puts[1].position_seconds).toBe(135);

    await vi.advanceTimersByTimeAsync(STATE_INTERVAL_MS * 2);
    expect(puts).toHaveLength(2); // rien en pause
  });

  it('à pagehide : état et événements partent en fetch keepalive', async () => {
    await store().playTracks(messeTracks, 2);
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
