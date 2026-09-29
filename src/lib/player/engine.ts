import type { Quality } from './types';

/**
 * Moteur de lecture : une seule balise `<audio>` pour toute l'application,
 * pilotée par le store du lecteur. `hls.js` (chargé à la demande) lit le HLS
 * du contrat ; Safari (et tout navigateur qui sait lire `application/
 * vnd.apple.mpegurl`) utilise son HLS natif. En cas d'erreur fatale du flux
 * HLS, on retombe sur le MP3 de secours (`stream.mp3_url`).
 */

export interface EngineListener {
  onTime(position: number): void;
  onDuration(duration: number): void;
  onPlaying(): void;
  onPaused(): void;
  onWaiting(): void;
  onEnded(): void;
  onError(message: string): void;
  /** Débit de la variante en cours (kb/s), `null` si inconnu (natif, MP3). */
  onBitrate(kbps: number | null): void;
}

export interface EngineSource {
  url: string;
  fallbackUrl?: string | null;
  format?: string;
}

export interface LoadOptions {
  startAt: number;
  autoplay: boolean;
}

export interface AudioEngine {
  setListener(listener: EngineListener | null): void;
  load(source: EngineSource, options: LoadOptions): void;
  play(): Promise<void>;
  pause(): void;
  seek(seconds: number): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setQuality(quality: Quality): void;
  /** Le choix de qualité n'est possible qu'avec hls.js (pas en HLS natif). */
  supportsQuality(): boolean;
  destroy(): void;
}

// Sous-ensemble de l'API hls.js utilisé ici (évite d'importer le module au
// chargement : il n'est téléchargé qu'à la première piste HLS).
interface HlsLevel {
  bitrate: number;
}
interface HlsInstance {
  levels: HlsLevel[];
  currentLevel: number;
  loadSource(url: string): void;
  attachMedia(media: HTMLMediaElement): void;
  recoverMediaError(): void;
  destroy(): void;
  on(event: string, cb: (event: string, data: any) => void): void;
}
interface HlsStatic {
  new (config?: Record<string, unknown>): HlsInstance;
  isSupported(): boolean;
  Events: Record<string, string>;
  ErrorTypes: Record<string, string>;
}

export type HlsLoader = () => Promise<HlsStatic>;

const defaultHlsLoader: HlsLoader = () =>
  import('hls.js').then((m) => m.default as unknown as HlsStatic);

function isHls(source: EngineSource): boolean {
  return (
    source.format === 'hls' || /\.m3u8(\?|$)/i.test(source.url.split('#')[0])
  );
}

export class HtmlAudioEngine implements AudioEngine {
  private listener: EngineListener | null = null;
  private hls: HlsInstance | null = null;
  private generation = 0;
  private quality: Quality = 'auto';
  private pendingStart: number | null = null;
  private fallback: string | null = null;
  private readonly detach: () => void;

  constructor(
    private readonly audio: HTMLAudioElement,
    private readonly loadHls: HlsLoader = defaultHlsLoader,
  ) {
    const on = <K extends keyof HTMLMediaElementEventMap>(
      type: K,
      fn: () => void,
    ) => {
      audio.addEventListener(type, fn);
      return () => audio.removeEventListener(type, fn);
    };
    const offs = [
      on('timeupdate', () => {
        // Avant les métadonnées, le <audio> repart de 0 : on garde la position
        // de reprise affichée jusqu'à ce qu'elle soit appliquée.
        if (this.pendingStart != null) return;
        this.listener?.onTime(audio.currentTime);
      }),
      on('durationchange', () => {
        if (Number.isFinite(audio.duration))
          this.listener?.onDuration(audio.duration);
      }),
      on('loadedmetadata', () => this.applyPendingStart()),
      on('playing', () => this.listener?.onPlaying()),
      on('pause', () => this.listener?.onPaused()),
      on('waiting', () => this.listener?.onWaiting()),
      on('ended', () => this.listener?.onEnded()),
      on('error', () => {
        // Erreurs du flux hls.js : gérées par son propre évènement.
        if (!this.hls) this.handleNativeError();
      }),
    ];
    this.detach = () => offs.forEach((off) => off());
  }

  setListener(listener: EngineListener | null) {
    this.listener = listener;
  }

  load(source: EngineSource, { startAt, autoplay }: LoadOptions) {
    const gen = ++this.generation;
    this.teardownHls();
    this.fallback = source.fallbackUrl ?? null;
    this.pendingStart = startAt > 0 ? startAt : null;
    this.listener?.onBitrate(null);

    const nativeHls =
      typeof this.audio.canPlayType === 'function' &&
      this.audio.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (!isHls(source) || nativeHls) {
      this.loadNative(source.url, autoplay);
      return;
    }

    void this.loadHls()
      .then((Hls) => {
        if (gen !== this.generation) return;
        if (!Hls.isSupported()) {
          this.loadNative(this.fallback ?? source.url, autoplay);
          return;
        }
        const hls = new Hls({
          startPosition: startAt > 0 ? startAt : -1,
          // Segments de 6 s : ~30 s d'avance suffisent (2G/3G).
          maxBufferLength: 30,
        });
        this.hls = hls;
        this.pendingStart = null;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (gen !== this.generation) return;
          this.applyQuality();
          if (autoplay) void this.play();
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data: { level: number }) => {
          const level = hls.levels[data.level];
          this.listener?.onBitrate(
            level ? Math.round(level.bitrate / 1000) : null,
          );
        });
        hls.on(
          Hls.Events.ERROR,
          (_e, data: { fatal: boolean; type: string }) => {
            if (!data.fatal || gen !== this.generation) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
              return;
            }
            const resumeAt = this.audio.currentTime || startAt;
            this.teardownHls();
            if (this.fallback) {
              const fb = this.fallback;
              this.fallback = null;
              this.pendingStart = resumeAt > 0 ? resumeAt : null;
              this.loadNative(fb, true);
            } else {
              this.listener?.onError('Le flux audio est indisponible.');
            }
          },
        );
        hls.loadSource(source.url);
        hls.attachMedia(this.audio);
      })
      .catch(() => {
        if (gen !== this.generation) return;
        this.loadNative(this.fallback ?? source.url, autoplay);
      });
  }

  private loadNative(url: string, autoplay: boolean) {
    this.audio.src = url;
    try {
      this.audio.load();
    } catch {
      // jsdom : load() non implémenté.
    }
    if (autoplay) void this.play();
  }

  private handleNativeError() {
    if (this.fallback && this.audio.src !== this.fallback) {
      const fb = this.fallback;
      this.fallback = null;
      const resumeAt = this.audio.currentTime;
      this.pendingStart = resumeAt > 0 ? resumeAt : this.pendingStart;
      this.loadNative(fb, true);
      return;
    }
    this.listener?.onError('Le flux audio est indisponible.');
  }

  private applyPendingStart() {
    if (this.pendingStart != null) {
      try {
        this.audio.currentTime = this.pendingStart;
      } catch {
        // ignoré
      }
      this.pendingStart = null;
    }
  }

  private applyQuality() {
    const hls = this.hls;
    if (!hls || hls.levels.length === 0) return;
    if (this.quality === 'auto') {
      hls.currentLevel = -1;
      return;
    }
    let best = 0;
    hls.levels.forEach((level, i) => {
      const cur = hls.levels[best].bitrate;
      if (
        this.quality === 'economie' ? level.bitrate < cur : level.bitrate > cur
      )
        best = i;
    });
    hls.currentLevel = best;
  }

  private teardownHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  async play() {
    try {
      await this.audio.play();
    } catch (err) {
      // Lecture refusée (politique d'autoplay) : on reste en pause.
      if ((err as Error)?.name !== 'AbortError') this.listener?.onPaused();
    }
  }

  pause() {
    this.audio.pause();
  }

  seek(seconds: number) {
    if (this.pendingStart != null && this.audio.readyState < 1) {
      this.pendingStart = seconds;
      return;
    }
    try {
      this.audio.currentTime = seconds;
    } catch {
      this.pendingStart = seconds;
    }
    this.listener?.onTime(seconds);
  }

  setRate(rate: number) {
    this.audio.playbackRate = rate;
    this.audio.defaultPlaybackRate = rate;
  }

  setVolume(volume: number) {
    this.audio.volume = Math.min(1, Math.max(0, volume));
  }

  setMuted(muted: boolean) {
    this.audio.muted = muted;
  }

  setQuality(quality: Quality) {
    this.quality = quality;
    this.applyQuality();
  }

  supportsQuality() {
    return this.hls != null;
  }

  destroy() {
    this.generation++;
    this.teardownHls();
    this.detach();
    this.audio.removeAttribute('src');
    this.listener = null;
  }
}
