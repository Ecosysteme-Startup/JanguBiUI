import type {
  AudioEngine,
  EngineListener,
  EngineSource,
  LoadOptions,
} from '../engine';
import type { Quality } from '../types';

/**
 * Moteur simulé : même interface que `HtmlAudioEngine`, sans `<audio>`.
 * `load` avec `autoplay` émet `onPlaying` ; `finish()` simule la fin de piste.
 */
export class FakeEngine implements AudioEngine {
  listener: EngineListener | null = null;
  loads: { source: EngineSource; options: LoadOptions }[] = [];
  position = 0;
  playing = false;
  rate = 1;
  volume = 1;
  muted = false;
  quality: Quality = 'auto';
  volumeHistory: number[] = [];
  destroyed = false;

  setListener(listener: EngineListener | null) {
    this.listener = listener;
  }
  load(source: EngineSource, options: LoadOptions) {
    this.loads.push({ source, options });
    this.position = options.startAt;
    this.playing = false;
    if (options.autoplay) void this.play();
  }
  async play() {
    this.playing = true;
    this.listener?.onPlaying();
  }
  pause() {
    const was = this.playing;
    this.playing = false;
    if (was) this.listener?.onPaused();
  }
  seek(seconds: number) {
    this.position = seconds;
    this.listener?.onTime(seconds);
  }
  setRate(rate: number) {
    this.rate = rate;
  }
  setVolume(volume: number) {
    this.volume = volume;
    this.volumeHistory.push(volume);
  }
  setMuted(muted: boolean) {
    this.muted = muted;
  }
  setQuality(quality: Quality) {
    this.quality = quality;
  }
  supportsQuality() {
    return true;
  }
  destroy() {
    this.destroyed = true;
  }

  /** Avance la lecture (timeupdate). */
  tick(seconds: number) {
    this.position = seconds;
    this.listener?.onTime(seconds);
  }
  /** Fin de la piste. */
  finish() {
    this.playing = false;
    this.listener?.onPaused();
    this.listener?.onEnded();
  }
  get lastLoad() {
    return this.loads[this.loads.length - 1];
  }
}
