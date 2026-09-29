import { create } from 'zustand';

import { ApiError } from '@/lib/api-client';

import { fetchLecture, fetchNextUp, setTrackLiked } from './api';
import type { AudioEngine, EngineListener } from './engine';
import { recordListenEvent } from './listen-events';
import { reportPlaybackState } from './state-sync';
import {
  type Lecture,
  type PlayContext,
  type PlayerStatus,
  type Quality,
  type RepeatMode,
  type ResumeOffer,
  type SleepTimer,
  type SpeedBucket,
  type Track,
  type TrackInput,
  trackSchema,
} from './types';

/**
 * Store du lecteur audio global (zustand). Une seule instance pour toute
 * l'application : la file, la piste, la position, les réglages (vitesse,
 * qualité, volume, minuterie) et l'état de l'interface (barre / déployé).
 *
 * Le moteur (`<audio>` + hls.js) est branché par `<PlayerRoot>` via
 * `attachPlayerEngine` ; le store le pilote et reçoit ses événements.
 */

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
export const SLEEP_MINUTES = [15, 30, 45] as const;
/** Fondu du son à l'arrêt de la minuterie (spec, décision 5). */
export const SLEEP_FADE_MS = 10_000;
/** Seuil sous lequel « précédent » revient au début de la piste. */
const RESTART_THRESHOLD = 3;
/** « Passe » au sens du contrat §6 : moins de 30 s d'écoute. */
const SKIP_THRESHOLD = 30;
/** Une URL signée préchargée sert au plus 2 min (la reprise peut bouger). */
const PREFETCH_TTL_MS = 2 * 60_000;

const PREFS_KEY = 'jb_player_prefs';

interface Prefs {
  rates: Record<SpeedBucket, number>;
  quality: Quality;
  volume: number;
  autoplay: boolean;
}

const DEFAULT_PREFS: Prefs = {
  rates: { parole: 1, musique: 1 },
  quality: 'auto',
  volume: 0.7,
  autoplay: true,
};

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      rates: { ...DEFAULT_PREFS.rates, ...(p.rates ?? {}) },
      quality: p.quality ?? DEFAULT_PREFS.quality,
      volume: typeof p.volume === 'number' ? p.volume : DEFAULT_PREFS.volume,
      autoplay: p.autoplay ?? DEFAULT_PREFS.autoplay,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(s: Prefs) {
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        rates: s.rates,
        quality: s.quality,
        volume: s.volume,
        autoplay: s.autoplay,
      }),
    );
  } catch {
    // préférences non persistées
  }
}

/** Homélies et retraites gardent leur propre vitesse (1,25× par exemple). */
export function speedBucket(track: Track | null | undefined): SpeedBucket {
  if (!track) return 'musique';
  const kind = track.album?.kind ?? '';
  if (kind === 'homelies' || kind === 'retraite') return 'parole';
  const tags = (track.tags ?? []).map((t) => t.toLowerCase());
  if (tags.some((t) => t.startsWith('homélie') || t.startsWith('homelie')))
    return 'parole';
  return 'musique';
}

export function coverOf(track: Track | null | undefined): string | null {
  return track?.cover_url ?? track?.album?.cover_url ?? null;
}

export interface PlayerState {
  // File d'attente
  tracks: Track[];
  /** Ordre de lecture (indices de `tracks`) ; permuté en aléatoire. */
  order: number[];
  /** Position dans `order` de la piste de contexte en cours. */
  cursor: number;
  context: PlayContext | null;
  /** « À suivre · ajoutée par vous » : jouée avant la suite du contexte. */
  upNext: Track[];
  /** « À écouter ensuite » (GET pistes/<id>/ensuite/). */
  recommendations: Track[];
  current: Track | null;
  fromUpNext: boolean;

  // Lecture
  status: PlayerStatus;
  errorMessage: string | null;
  position: number;
  duration: number;
  waveform: number[];
  bitrate: number | null;
  qualitySelectable: boolean;

  // Réglages
  rates: Record<SpeedBucket, number>;
  quality: Quality;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  autoplay: boolean;
  sleep: SleepTimer;

  // Interface
  expanded: boolean;
  offer: ResumeOffer | null;
  liked: Record<string, boolean>;

  // Actions
  playTracks: (
    tracks: TrackInput[],
    index?: number,
    context?: PlayContext | null,
  ) => Promise<void>;
  playTrack: (track: TrackInput, context?: PlayContext | null) => Promise<void>;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  skipBy: (delta: number) => void;
  next: (options?: { auto?: boolean }) => void;
  previous: () => void;
  jumpTo: (orderPosition: number) => void;
  playFromUpNext: (index: number) => void;
  playRecommendation: (index: number) => void;
  addToQueue: (track: TrackInput) => void;
  playNext: (track: TrackInput) => void;
  removeFromUpNext: (index: number) => void;
  clearUpNext: () => void;
  setRate: (rate: number) => void;
  cycleRate: () => void;
  setQuality: (quality: Quality) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleAutoplay: () => void;
  setSleep: (
    timer:
      | { mode: 'off' }
      | { mode: 'minutes'; minutes: number }
      | { mode: 'fin_piste' },
  ) => void;
  toggleLike: (track?: Track | null) => void;
  expand: () => void;
  collapse: () => void;
  setOffer: (offer: ResumeOffer | null) => void;
  acceptOffer: () => Promise<void>;
  stop: () => void;
}

// --- Moteur et minuteurs (hors état React) ---------------------------------

let engine: AudioEngine | null = null;
let loadCounter = 0;
let startedFor = -1;
let endedFor = -1;
let sleepTimeout: ReturnType<typeof setTimeout> | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let attachListener: ((e: AudioEngine) => void) | null = null;
const prefetched = new Map<string, { at: number; promise: Promise<Lecture> }>();

function clearSleepTimers() {
  if (sleepTimeout) clearTimeout(sleepTimeout);
  if (fadeInterval) clearInterval(fadeInterval);
  sleepTimeout = null;
  fadeInterval = null;
}

function identity(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

function shuffled(indices: number[]): number[] {
  const a = [...indices];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseTrack(input: TrackInput): Track {
  return trackSchema.parse(input);
}

function lectureErrorMessage(err: unknown): string {
  const status = err instanceof ApiError ? err.status : 0;
  if (status === 404) return 'Cette piste n’est plus disponible.';
  if (status === 409)
    return 'Cette piste est en cours de préparation. Réessayez dans quelques minutes.';
  return 'Impossible de lancer la lecture. Vérifiez votre connexion.';
}

function getLecture(trackId: string): Promise<Lecture> {
  const hit = prefetched.get(trackId);
  prefetched.delete(trackId);
  if (hit && Date.now() - hit.at < PREFETCH_TTL_MS) return hit.promise;
  return fetchLecture(trackId);
}

/** Précharge l'URL signée d'une piste (survol, piste suivante de la file). */
export function prefetchLecture(trackId: string) {
  const hit = prefetched.get(trackId);
  if (hit && Date.now() - hit.at < PREFETCH_TTL_MS) return;
  const promise = fetchLecture(trackId);
  promise.catch(() => prefetched.delete(trackId));
  prefetched.set(trackId, { at: Date.now(), promise });
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const prefs = loadPrefs();

  const rateFor = (track: Track | null) => get().rates[speedBucket(track)];

  /** Quitte la piste en cours : événement d'écoute + position retenue. */
  const leaveCurrent = () => {
    const { current, position, status } = get();
    if (!current || status === 'idle') return;
    if (startedFor === loadCounter && endedFor !== loadCounter) {
      recordListenEvent(
        position < SKIP_THRESHOLD ? 'skip' : 'progress',
        current.id,
        position,
      );
    }
    if (position > 0) {
      void reportPlaybackState({ trackId: current.id, position });
    }
  };

  const nextContextTrack = (): Track | null => {
    const { tracks, order, cursor } = get();
    const pos = cursor + 1;
    return pos < order.length ? tracks[order[pos]] : null;
  };

  const loadTrack = async (
    track: Track,
    { autoplay = true, startAt }: { autoplay?: boolean; startAt?: number } = {},
  ) => {
    leaveCurrent();
    const loadId = ++loadCounter;
    set({
      current: track,
      status: 'loading',
      errorMessage: null,
      position: startAt ?? 0,
      duration: track.duration_seconds,
      waveform: [],
      bitrate: null,
      recommendations: [],
    });

    let lecture: Lecture;
    try {
      lecture = await getLecture(track.id);
    } catch (err) {
      if (loadId !== loadCounter) return;
      set({ status: 'error', errorMessage: lectureErrorMessage(err) });
      return;
    }
    if (loadId !== loadCounter) return;

    const merged: Track = {
      ...track,
      ...lecture.track,
      cover_url: lecture.track.cover_url ?? track.cover_url,
      reason: track.reason ?? lecture.track.reason,
      album: lecture.track.album
        ? {
            ...(track.album ?? {}),
            ...lecture.track.album,
            cover_url:
              lecture.track.album.cover_url ?? track.album?.cover_url ?? null,
          }
        : track.album,
    };
    const duration = lecture.track.duration_seconds || track.duration_seconds;
    let at = startAt ?? lecture.resume?.position_seconds ?? 0;
    if (duration > 0 && at >= duration - 1) at = 0;

    set({
      current: merged,
      waveform: lecture.waveform,
      duration,
      position: at,
      status: autoplay ? 'loading' : 'paused',
      liked:
        merged.liked != null
          ? { ...get().liked, [merged.id]: merged.liked }
          : get().liked,
    });

    const e = engine;
    if (e) {
      const s = get();
      e.setRate(rateFor(merged));
      e.setVolume(s.volume);
      e.setMuted(s.muted);
      e.setQuality(s.quality);
      e.load(
        {
          url: lecture.stream.master_url,
          fallbackUrl: lecture.stream.mp3_url,
          format: lecture.stream.format,
        },
        { startAt: at, autoplay },
      );
      e.setRate(rateFor(merged));
    }

    // Précharge la piste suivante et « À écouter ensuite ».
    const following = get().upNext[0] ?? nextContextTrack();
    if (following) prefetchLecture(following.id);
    fetchNextUp(merged.id)
      .then((recos) => {
        if (loadId !== loadCounter) return;
        const inQueue = new Set(get().tracks.map((t) => t.id));
        set({
          recommendations: recos
            .filter((t) => !inQueue.has(t.id) && t.id !== merged.id)
            .slice(0, 3),
        });
      })
      .catch(() => {
        // recommandations facultatives
      });
  };

  const handleEnded = () => {
    const s = get();
    if (!s.current) return;
    endedFor = loadCounter;
    recordListenEvent('complete', s.current.id, s.duration || s.position);
    if (s.sleep.mode === 'fin_piste') {
      set({ sleep: { mode: 'off' }, status: 'paused' });
      return;
    }
    if (s.repeat === 'one') {
      engine?.seek(0);
      void engine?.play();
      return;
    }
    get().next({ auto: true });
  };

  const listener: EngineListener = {
    onTime: (position) => set({ position }),
    onDuration: (duration) => {
      if (duration > 0) set({ duration });
    },
    onPlaying: () => {
      set({ status: 'playing', errorMessage: null });
      const { current, position } = get();
      if (current && startedFor !== loadCounter) {
        startedFor = loadCounter;
        recordListenEvent('start', current.id, position);
      }
    },
    onPaused: () => {
      const { status, current, position } = get();
      if (status === 'loading' || status === 'idle') return;
      if (status !== 'paused') set({ status: 'paused' });
      if (current && status === 'playing') {
        void reportPlaybackState({ trackId: current.id, position });
      }
    },
    onWaiting: () => {},
    onEnded: handleEnded,
    onError: (message) => set({ status: 'error', errorMessage: message }),
    onBitrate: (kbps) =>
      set({
        bitrate: kbps,
        qualitySelectable: engine?.supportsQuality() ?? false,
      }),
  };

  attachListener = (e) => {
    e.setListener(listener);
    const s = get();
    e.setVolume(s.volume);
    e.setMuted(s.muted);
    e.setQuality(s.quality);
  };

  const persist = () => savePrefs(get());

  const fadeOutAndPause = () => {
    const e = engine;
    const base = get().volume;
    if (!e) {
      set({ sleep: { mode: 'off' } });
      return;
    }
    const steps = 40;
    let i = 0;
    fadeInterval = setInterval(() => {
      i++;
      e.setVolume(base * Math.max(0, 1 - i / steps));
      if (i >= steps) {
        if (fadeInterval) clearInterval(fadeInterval);
        fadeInterval = null;
        e.pause();
        e.setVolume(get().volume);
        set({ sleep: { mode: 'off' }, status: 'paused' });
      }
    }, SLEEP_FADE_MS / steps);
  };

  return {
    tracks: [],
    order: [],
    cursor: 0,
    context: null,
    upNext: [],
    recommendations: [],
    current: null,
    fromUpNext: false,

    status: 'idle',
    errorMessage: null,
    position: 0,
    duration: 0,
    waveform: [],
    bitrate: null,
    qualitySelectable: false,

    rates: prefs.rates,
    quality: prefs.quality,
    volume: prefs.volume,
    muted: false,
    shuffle: false,
    repeat: 'off',
    autoplay: prefs.autoplay,
    sleep: { mode: 'off' },

    expanded: false,
    offer: null,
    liked: {},

    playTracks: async (inputs, index = 0, context = null) => {
      const tracks = inputs.map(parseTrack);
      if (tracks.length === 0) return;
      const i = Math.min(Math.max(0, index), tracks.length - 1);
      const s = get();
      let order = identity(tracks.length);
      let cursor = i;
      if (s.shuffle) {
        order = [i, ...shuffled(order.filter((n) => n !== i))];
        cursor = 0;
      }
      const target = tracks[i];
      set({ tracks, order, cursor, context, fromUpNext: false });
      if (
        s.current?.id === target.id &&
        (s.status === 'paused' || s.status === 'playing')
      ) {
        if (s.status === 'paused') void engine?.play();
        return;
      }
      await loadTrack(target, { autoplay: true });
    },

    playTrack: (track, context = null) => get().playTracks([track], 0, context),

    toggle: () => {
      const s = get();
      if (s.status === 'playing' || s.status === 'loading') get().pause();
      else get().play();
    },

    play: () => {
      const s = get();
      if (!s.current) return;
      if (s.status === 'error') {
        void loadTrack(s.current, { autoplay: true, startAt: s.position });
        return;
      }
      void engine?.play();
    },

    pause: () => {
      const s = get();
      if (!s.current) return;
      engine?.pause();
      if (s.status === 'playing') {
        set({ status: 'paused' });
        void reportPlaybackState({
          trackId: s.current.id,
          position: s.position,
        });
      } else if (s.status === 'loading') {
        set({ status: 'paused' });
      }
    },

    seek: (seconds) => {
      const { duration, current } = get();
      if (!current) return;
      const max = duration > 0 ? duration : Number.POSITIVE_INFINITY;
      const t = Math.min(Math.max(0, seconds), max);
      engine?.seek(t);
      set({ position: t });
    },

    skipBy: (delta) => get().seek(get().position + delta),

    next: ({ auto = false } = {}) => {
      const s = get();
      if (s.upNext.length > 0) {
        const [first, ...rest] = s.upNext;
        set({ upNext: rest, fromUpNext: true });
        void loadTrack(first);
        return;
      }
      const pos = s.cursor + 1;
      if (pos < s.order.length) {
        set({ cursor: pos, fromUpNext: false });
        void loadTrack(s.tracks[s.order[pos]]);
        return;
      }
      if (s.repeat === 'all' && s.order.length > 0) {
        set({ cursor: 0, fromUpNext: false });
        void loadTrack(s.tracks[s.order[0]]);
        return;
      }
      if (s.autoplay && s.recommendations.length > 0) {
        const recos = s.recommendations;
        set({
          tracks: recos,
          order: identity(recos.length),
          cursor: 0,
          fromUpNext: false,
          context: { kindLabel: '', label: 'À écouter ensuite' },
        });
        void loadTrack(recos[0]);
        return;
      }
      // Fin de la file : on s'arrête au début de la dernière piste.
      if (auto) {
        engine?.pause();
        engine?.seek(0);
        set({ status: 'paused', position: 0 });
      }
    },

    previous: () => {
      const s = get();
      if (s.position > RESTART_THRESHOLD || s.fromUpNext) {
        if (s.fromUpNext && s.position <= RESTART_THRESHOLD) {
          set({ fromUpNext: false });
          void loadTrack(s.tracks[s.order[s.cursor]]);
          return;
        }
        get().seek(0);
        return;
      }
      if (s.cursor > 0) {
        const pos = s.cursor - 1;
        set({ cursor: pos });
        void loadTrack(s.tracks[s.order[pos]]);
        return;
      }
      get().seek(0);
    },

    jumpTo: (orderPosition) => {
      const s = get();
      if (orderPosition < 0 || orderPosition >= s.order.length) return;
      set({ cursor: orderPosition, fromUpNext: false });
      void loadTrack(s.tracks[s.order[orderPosition]]);
    },

    playFromUpNext: (index) => {
      const s = get();
      const t = s.upNext[index];
      if (!t) return;
      set({
        upNext: s.upNext.filter((_, i) => i !== index),
        fromUpNext: true,
      });
      void loadTrack(t);
    },

    playRecommendation: (index) => {
      const s = get();
      const recos = s.recommendations;
      if (!recos[index]) return;
      set({
        tracks: recos,
        order: identity(recos.length),
        cursor: index,
        fromUpNext: false,
        context: { kindLabel: '', label: 'À écouter ensuite' },
      });
      void loadTrack(recos[index]);
    },

    addToQueue: (track) => {
      const t = parseTrack(track);
      set({ upNext: [...get().upNext, t] });
      if (get().upNext.length === 1) prefetchLecture(t.id);
    },

    playNext: (track) => {
      const t = parseTrack(track);
      set({ upNext: [t, ...get().upNext] });
      prefetchLecture(t.id);
    },

    removeFromUpNext: (index) =>
      set({ upNext: get().upNext.filter((_, i) => i !== index) }),

    clearUpNext: () => set({ upNext: [] }),

    setRate: (rate) => {
      const bucket = speedBucket(get().current);
      set({ rates: { ...get().rates, [bucket]: rate } });
      engine?.setRate(rate);
      persist();
    },

    cycleRate: () => {
      const cur = rateFor(get().current);
      const i = SPEEDS.findIndex((r) => r === cur);
      get().setRate(SPEEDS[(i + 1) % SPEEDS.length]);
    },

    setQuality: (quality) => {
      set({ quality });
      engine?.setQuality(quality);
      persist();
    },

    setVolume: (volume) => {
      const v = Math.min(1, Math.max(0, volume));
      set({ volume: v, muted: v === 0 ? get().muted : false });
      engine?.setVolume(v);
      if (v > 0) engine?.setMuted(false);
      persist();
    },

    toggleMute: () => {
      const muted = !get().muted;
      set({ muted });
      engine?.setMuted(muted);
    },

    toggleShuffle: () => {
      const s = get();
      const currentIndex = s.order[s.cursor] ?? 0;
      if (!s.shuffle) {
        const rest = identity(s.tracks.length).filter(
          (n) => n !== currentIndex,
        );
        set({
          shuffle: true,
          order: s.tracks.length ? [currentIndex, ...shuffled(rest)] : [],
          cursor: 0,
        });
      } else {
        set({
          shuffle: false,
          order: identity(s.tracks.length),
          cursor: currentIndex,
        });
      }
    },

    cycleRepeat: () => {
      const r = get().repeat;
      set({ repeat: r === 'off' ? 'all' : r === 'all' ? 'one' : 'off' });
    },

    toggleAutoplay: () => {
      set({ autoplay: !get().autoplay });
      persist();
    },

    setSleep: (timer) => {
      clearSleepTimers();
      if (engine) engine.setVolume(get().volume);
      if (timer.mode === 'minutes') {
        const ms = timer.minutes * 60_000;
        set({
          sleep: {
            mode: 'minutes',
            minutes: timer.minutes,
            endsAt: Date.now() + ms,
          },
        });
        sleepTimeout = setTimeout(fadeOutAndPause, ms);
      } else {
        set({
          sleep:
            timer.mode === 'fin_piste'
              ? { mode: 'fin_piste' }
              : { mode: 'off' },
        });
      }
    },

    toggleLike: (track) => {
      const t = track ?? get().current;
      if (!t) return;
      const liked = !get().liked[t.id];
      set({ liked: { ...get().liked, [t.id]: liked } });
      if (liked) recordListenEvent('like', t.id, get().position);
      setTrackLiked(t.id, liked).catch(() => {
        set({ liked: { ...get().liked, [t.id]: !liked } });
      });
    },

    expand: () => {
      if (get().current) set({ expanded: true });
    },
    collapse: () => set({ expanded: false }),

    setOffer: (offer) => set({ offer }),

    acceptOffer: async () => {
      const offer = get().offer;
      if (!offer) return;
      set({
        offer: null,
        tracks: [offer.track],
        order: [0],
        cursor: 0,
        fromUpNext: false,
        context: null,
      });
      await loadTrack(offer.track, {
        autoplay: true,
        startAt: offer.positionSeconds,
      });
    },

    stop: () => {
      leaveCurrent();
      loadCounter++;
      clearSleepTimers();
      engine?.pause();
      set({
        current: null,
        status: 'idle',
        position: 0,
        duration: 0,
        waveform: [],
        expanded: false,
        tracks: [],
        order: [],
        cursor: 0,
        upNext: [],
        recommendations: [],
        context: null,
        sleep: { mode: 'off' },
      });
    },
  };
});

/** Branche le moteur de lecture (appelé par `<PlayerRoot>`). */
export function attachPlayerEngine(e: AudioEngine) {
  engine = e;
  attachListener?.(e);
  return () => {
    if (engine === e) {
      e.setListener(null);
      engine = null;
    }
  };
}

/** Vitesse de la piste en cours (mémorisée par type de contenu). */
export function selectRate(s: PlayerState): number {
  return s.rates[speedBucket(s.current)];
}

/** Tests uniquement : remet les compteurs du module à zéro. */
export function resetPlayerModuleForTests() {
  clearSleepTimers();
  prefetched.clear();
  loadCounter = 0;
  startedFor = -1;
  endedFor = -1;
}
