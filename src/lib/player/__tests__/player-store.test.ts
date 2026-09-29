import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import {
  GLORIA_ID,
  HOMELIE_ID,
  homelieTrack,
  KYRIE_ID,
  messeTracks,
  resetAudioLecteurMocks,
} from '@/testing/mocks/handlers/audio-lecteur';
import { server } from '@/testing/mocks/server';

import { resetDeviceIdForTests } from '../device';
import {
  pendingListenEvents,
  resetListenEventsForTests,
} from '../listen-events';
import {
  attachPlayerEngine,
  resetPlayerModuleForTests,
  selectRate,
  SLEEP_FADE_MS,
  usePlayerStore,
} from '../player-store';
import { resetStateSyncForTests } from '../state-sync';

import { FakeEngine } from './fake-engine';
import { simulerSession, terminerSession } from '@/testing/session';

// Chaque store zustand repart de son état initial après chaque test (__mocks__/zustand.ts).
vi.mock('zustand');

beforeEach(simulerSession);
afterEach(terminerSession);

const API = `${env.API_URL}/audio`;
const store = () => usePlayerStore.getState();

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
  engine = new FakeEngine();
  detach = attachPlayerEngine(engine);
});

afterEach(() => {
  detach();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('playTracks', () => {
  it('appelle lecture/, charge le flux HLS signé et reprend à la position du serveur', async () => {
    await store().playTracks(messeTracks, 2, {
      kindLabel: 'l’album',
      label: 'Messe du 27 septembre 2026',
    });

    const s = store();
    expect(s.current?.id).toBe(GLORIA_ID);
    expect(s.current?.title).toBe('Gloria — Messe de la Visitation');
    expect(s.status).toBe('playing');
    expect(s.waveform).toHaveLength(200);
    expect(s.duration).toBe(252);
    expect(engine.lastLoad.source.url).toMatch(/master\.m3u8\?verify=/);
    expect(engine.lastLoad.source.format).toBe('hls');
    expect(engine.lastLoad.source.fallbackUrl).toMatch(/\.mp3$/);
    // Reprise : 1:52 (contrat : resume.position_seconds).
    expect(engine.lastLoad.options).toEqual({ startAt: 112, autoplay: true });
    expect(s.position).toBe(112);
  });

  it('précharge la piste suivante et charge « À écouter ensuite »', async () => {
    const lectures: string[] = [];
    server.events.on('request:start', ({ request }) => {
      if (request.url.includes('/lecture/') && request.method === 'POST')
        lectures.push(request.url);
    });
    await store().playTracks(messeTracks, 2);
    await vi.waitFor(() => expect(store().recommendations).toHaveLength(3));
    expect(lectures.some((u) => u.includes(messeTracks[3].id))).toBe(true);
    expect(store().recommendations[0].reason).toBe(
      'Autre enregistrement de cette messe',
    );
    server.events.removeAllListeners();
  });

  it('affiche un message sobre si la piste n’est plus disponible (404)', async () => {
    server.use(
      http.post(`${API}/pistes/:id/lecture/`, () =>
        HttpResponse.json(
          { error: { code: 'piste_introuvable' } },
          { status: 404 },
        ),
      ),
    );
    await store().playTrack(messeTracks[0]);
    expect(store().status).toBe('error');
    expect(store().errorMessage).toBe('Cette piste n’est plus disponible.');
    expect(engine.loads).toHaveLength(0);
  });

  it('relance la même piste sans la recharger si elle est déjà en cours', async () => {
    await store().playTracks(messeTracks, 2);
    store().pause();
    expect(store().status).toBe('paused');
    await store().playTracks(messeTracks, 2);
    expect(engine.loads).toHaveLength(1);
    expect(store().status).toBe('playing');
  });
});

describe('file d’attente', () => {
  it('suivant / précédent suivent l’album ; « précédent » après 3 s revient au début', async () => {
    await store().playTracks(messeTracks, 2);
    store().next();
    await vi.waitFor(() => expect(engine.loads).toHaveLength(2));
    expect(store().current?.id).toBe(messeTracks[3].id);
    engine.tick(20);
    store().previous();
    expect(store().position).toBe(0);
    expect(store().current?.id).toBe(messeTracks[3].id);
    store().previous();
    await vi.waitFor(() => expect(store().current?.id).toBe(GLORIA_ID));
  });

  it('joue d’abord « À suivre · ajoutée par vous », puis reprend l’album', async () => {
    await store().playTracks(messeTracks, 2);
    store().addToQueue(homelieTrack);
    store().next();
    await vi.waitFor(() => expect(store().current?.id).toBe(HOMELIE_ID));
    expect(store().upNext).toHaveLength(0);
    store().next();
    await vi.waitFor(() => expect(store().current?.id).toBe(messeTracks[3].id));
  });

  it('enchaîne à la fin de la piste ; « répéter la piste » la rejoue', async () => {
    await store().playTracks(messeTracks, 0);
    engine.finish();
    await vi.waitFor(() => expect(engine.loads).toHaveLength(2));
    expect(store().current?.id).toBe(KYRIE_ID);

    store().cycleRepeat(); // toute la file
    store().cycleRepeat(); // cette piste
    expect(store().repeat).toBe('one');
    const loads = engine.loads.length;
    engine.tick(200);
    engine.finish();
    expect(engine.loads).toHaveLength(loads);
    expect(engine.position).toBe(0);
    expect(engine.playing).toBe(true);
  });

  it('en fin de file, la lecture automatique passe à « À écouter ensuite »', async () => {
    await store().playTracks([messeTracks[2]], 0);
    await vi.waitFor(() => expect(store().recommendations).toHaveLength(3));
    engine.finish();
    await vi.waitFor(() =>
      expect(store().current?.title).toBe('Gloria du 15 août 2026'),
    );
    expect(store().context?.label).toBe('À écouter ensuite');
  });

  it('aléatoire garde la piste en cours en tête et toutes les pistes', async () => {
    await store().playTracks(messeTracks, 4);
    store().toggleShuffle();
    const s = store();
    expect(s.order[0]).toBe(4);
    expect(s.cursor).toBe(0);
    expect([...s.order].sort((a, b) => a - b)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    store().toggleShuffle();
    expect(store().cursor).toBe(4);
  });
});

describe('réglages', () => {
  it('mémorise la vitesse par type de contenu (homélies à part)', async () => {
    await store().playTrack(homelieTrack);
    store().setRate(1.25);
    expect(engine.rate).toBe(1.25);
    await store().playTracks(messeTracks, 2);
    expect(selectRate(store())).toBe(1);
    expect(engine.rate).toBe(1);
    await store().playTrack(homelieTrack);
    expect(selectRate(store())).toBe(1.25);
    expect(engine.rate).toBe(1.25);
  });

  it('fait tourner les vitesses 0,75 → 1 → 1,25 → 1,5', async () => {
    await store().playTracks(messeTracks, 2);
    store().cycleRate();
    expect(selectRate(store())).toBe(1.25);
    store().cycleRate();
    store().cycleRate();
    expect(selectRate(store())).toBe(0.75);
  });

  it('transmet qualité, volume et sourdine au moteur', async () => {
    await store().playTracks(messeTracks, 2);
    store().setQuality('economie');
    store().setVolume(0.4);
    store().toggleMute();
    expect(engine.quality).toBe('economie');
    expect(engine.volume).toBe(0.4);
    expect(engine.muted).toBe(true);
  });

  it('minuterie : baisse le son en 10 s puis met en pause', async () => {
    await store().playTracks(messeTracks, 2);
    vi.useFakeTimers();
    store().setVolume(0.8);
    store().setSleep({ mode: 'minutes', minutes: 15 });
    expect(store().sleep.mode).toBe('minutes');
    vi.advanceTimersByTime(15 * 60_000);
    vi.advanceTimersByTime(SLEEP_FADE_MS / 2);
    expect(engine.volume).toBeCloseTo(0.4, 1);
    expect(engine.playing).toBe(true);
    vi.advanceTimersByTime(SLEEP_FADE_MS / 2);
    expect(engine.playing).toBe(false);
    expect(engine.volume).toBe(0.8);
    expect(store().sleep.mode).toBe('off');
  });

  it('minuterie « fin de la piste » : s’arrête au lieu d’enchaîner', async () => {
    await store().playTracks(messeTracks, 2);
    store().setSleep({ mode: 'fin_piste' });
    engine.finish();
    expect(store().current?.id).toBe(GLORIA_ID);
    expect(store().status).toBe('paused');
    expect(store().sleep.mode).toBe('off');
  });
});

describe('événements d’écoute', () => {
  it('enregistre start, puis skip si l’on passe avant 30 s, puis complete', async () => {
    await store().playTracks(messeTracks, 0);
    engine.tick(12);
    store().next();
    await vi.waitFor(() => expect(engine.loads).toHaveLength(2));
    expect(store().current?.id).toBe(KYRIE_ID);
    engine.tick(210);
    engine.finish();
    const kinds = pendingListenEvents().map(
      (e) => `${e.kind}:${e.track_id.slice(0, 8)}`,
    );
    expect(kinds.slice(0, 4)).toEqual([
      `start:${messeTracks[0].id.slice(0, 8)}`,
      `skip:${messeTracks[0].id.slice(0, 8)}`,
      `start:${KYRIE_ID.slice(0, 8)}`,
      `complete:${KYRIE_ID.slice(0, 8)}`,
    ]);
    const e = pendingListenEvents()[0];
    expect(e.device_id).toMatch(/^web-/);
    expect(e.client_event_id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('reprise', () => {
  it('« Reprendre ici » charge la piste à la position de l’autre appareil', async () => {
    store().setOffer({
      track: {
        ...messeTracks[2],
        duration_seconds: 252,
        performers: [],
        tags: [],
      } as never,
      positionSeconds: 107,
      deviceId: 'web-ordinateur-paroisse',
      updatedAt: '2026-09-27T12:34:00Z',
    });
    await store().acceptOffer();
    expect(store().offer).toBeNull();
    expect(store().current?.id).toBe(GLORIA_ID);
    expect(engine.lastLoad.options.startAt).toBe(107);
  });
});
