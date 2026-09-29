import {
  type EngineListener,
  type HlsLoader,
  HtmlAudioEngine,
} from '../engine';

type Cb = (event: string, data: any) => void;

class FakeHls {
  static instances: FakeHls[] = [];
  static supported = true;
  static isSupported() {
    return FakeHls.supported;
  }
  static Events = {
    MANIFEST_PARSED: 'hlsManifestParsed',
    LEVEL_SWITCHED: 'hlsLevelSwitched',
    ERROR: 'hlsError',
  };
  static ErrorTypes = {
    MEDIA_ERROR: 'mediaError',
    NETWORK_ERROR: 'networkError',
  };

  levels = [{ bitrate: 64_000 }, { bitrate: 32_000 }, { bitrate: 128_000 }];
  currentLevel = -1;
  source: string | null = null;
  media: HTMLMediaElement | null = null;
  destroyed = false;
  handlers = new Map<string, Cb>();
  constructor(public config: Record<string, unknown>) {
    FakeHls.instances.push(this);
  }
  on(event: string, cb: Cb) {
    this.handlers.set(event, cb);
  }
  emit(event: string, data: unknown = {}) {
    this.handlers.get(event)?.(event, data);
  }
  loadSource(url: string) {
    this.source = url;
  }
  attachMedia(media: HTMLMediaElement) {
    this.media = media;
  }
  recoverMediaError = vi.fn();
  destroy() {
    this.destroyed = true;
  }
}

const loader: HlsLoader = async () => FakeHls as never;

function makeAudio(nativeHls = false) {
  const audio = document.createElement('audio');
  audio.play = vi.fn().mockResolvedValue(undefined);
  audio.pause = vi.fn();
  audio.load = vi.fn();
  audio.canPlayType = vi.fn((type: string) =>
    nativeHls && type === 'application/vnd.apple.mpegurl' ? 'maybe' : '',
  ) as never;
  return audio;
}

function makeListener(): EngineListener &
  Record<string, ReturnType<typeof vi.fn>> {
  return {
    onTime: vi.fn(),
    onDuration: vi.fn(),
    onPlaying: vi.fn(),
    onPaused: vi.fn(),
    onWaiting: vi.fn(),
    onEnded: vi.fn(),
    onError: vi.fn(),
    onBitrate: vi.fn(),
  };
}

const HLS = {
  url: 'https://audio.jangubi.sn/audio-hls/x/1/master.m3u8?verify=abc',
  fallbackUrl: 'https://audio.jangubi.sn/audio-hls/x/1/audio.mp3?verify=abc',
  format: 'hls',
};

beforeEach(() => {
  FakeHls.instances = [];
  FakeHls.supported = true;
});

describe('HtmlAudioEngine', () => {
  it('lit un MP3 directement et applique la position de reprise aux métadonnées', () => {
    const audio = makeAudio();
    const engine = new HtmlAudioEngine(audio, loader);
    engine.load(
      { url: 'https://x.test/a.mp3', format: 'mp3' },
      { startAt: 42, autoplay: true },
    );
    expect(audio.src).toBe('https://x.test/a.mp3');
    expect(audio.play).toHaveBeenCalled();
    audio.dispatchEvent(new Event('loadedmetadata'));
    expect(audio.currentTime).toBe(42);
    expect(FakeHls.instances).toHaveLength(0);
  });

  it('Safari : utilise le HLS natif sans charger hls.js', () => {
    const audio = makeAudio(true);
    const engine = new HtmlAudioEngine(audio, loader);
    engine.load(HLS, { startAt: 0, autoplay: false });
    expect(audio.src).toBe(HLS.url);
    expect(audio.play).not.toHaveBeenCalled();
    expect(FakeHls.instances).toHaveLength(0);
    expect(engine.supportsQuality()).toBe(false);
  });

  it('ailleurs : hls.js avec startPosition, lecture au manifeste, qualité choisie', async () => {
    const audio = makeAudio();
    const listener = makeListener();
    const engine = new HtmlAudioEngine(audio, loader);
    engine.setListener(listener);
    engine.setQuality('economie');
    engine.load(HLS, { startAt: 112, autoplay: true });
    await vi.waitFor(() => expect(FakeHls.instances).toHaveLength(1));
    const hls = FakeHls.instances[0];
    expect(hls.config.startPosition).toBe(112);
    expect(hls.source).toBe(HLS.url);
    expect(hls.media).toBe(audio);

    hls.emit(FakeHls.Events.MANIFEST_PARSED);
    expect(hls.currentLevel).toBe(1); // 32 kb/s
    expect(audio.play).toHaveBeenCalled();
    expect(engine.supportsQuality()).toBe(true);

    engine.setQuality('haute');
    expect(hls.currentLevel).toBe(2);
    engine.setQuality('auto');
    expect(hls.currentLevel).toBe(-1);

    hls.emit(FakeHls.Events.LEVEL_SWITCHED, { level: 2 });
    expect(listener.onBitrate).toHaveBeenLastCalledWith(128);
  });

  it('erreur réseau fatale : bascule sur le MP3 de secours', async () => {
    const audio = makeAudio();
    const listener = makeListener();
    const engine = new HtmlAudioEngine(audio, loader);
    engine.setListener(listener);
    engine.load(HLS, { startAt: 0, autoplay: true });
    await vi.waitFor(() => expect(FakeHls.instances).toHaveLength(1));
    const hls = FakeHls.instances[0];
    hls.emit(FakeHls.Events.ERROR, { fatal: true, type: 'networkError' });
    expect(hls.destroyed).toBe(true);
    expect(audio.src).toBe(HLS.fallbackUrl);
    expect(listener.onError).not.toHaveBeenCalled();
  });

  it('erreur média fatale : tente la récupération hls.js', async () => {
    const audio = makeAudio();
    const engine = new HtmlAudioEngine(audio, loader);
    engine.load(HLS, { startAt: 0, autoplay: false });
    await vi.waitFor(() => expect(FakeHls.instances).toHaveLength(1));
    FakeHls.instances[0].emit(FakeHls.Events.ERROR, {
      fatal: true,
      type: 'mediaError',
    });
    expect(FakeHls.instances[0].recoverMediaError).toHaveBeenCalled();
  });

  it('un nouveau chargement annule le précédent (pas de flux fantôme)', async () => {
    const audio = makeAudio();
    const engine = new HtmlAudioEngine(audio, loader);
    engine.load(HLS, { startAt: 0, autoplay: true });
    engine.load(
      { url: 'https://x.test/b.mp3' },
      { startAt: 0, autoplay: true },
    );
    await Promise.resolve();
    await Promise.resolve();
    expect(FakeHls.instances).toHaveLength(0);
    expect(audio.src).toBe('https://x.test/b.mp3');
  });

  it('relaie les événements du <audio> au store', () => {
    const audio = makeAudio();
    const listener = makeListener();
    const engine = new HtmlAudioEngine(audio, loader);
    engine.setListener(listener);
    audio.dispatchEvent(new Event('playing'));
    audio.dispatchEvent(new Event('pause'));
    audio.dispatchEvent(new Event('ended'));
    audio.dispatchEvent(new Event('timeupdate'));
    expect(listener.onPlaying).toHaveBeenCalled();
    expect(listener.onPaused).toHaveBeenCalled();
    expect(listener.onEnded).toHaveBeenCalled();
    expect(listener.onTime).toHaveBeenCalled();
    engine.setRate(1.25);
    expect(audio.playbackRate).toBe(1.25);
    engine.destroy();
    audio.dispatchEvent(new Event('playing'));
    expect(listener.onPlaying).toHaveBeenCalledTimes(1);
  });
});
