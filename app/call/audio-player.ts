/**
 * Adapted from Google LLC's Live API Web Console audio-streamer.ts (Copyright 2024).
 * Apache-2.0; license in ./licenses/google-audio.txt.
 * https://github.com/google-gemini/live-api-web-console/blob/main/src/lib/audio-streamer.ts
 * Changes: bounded queue, short interruption fade, per-call disposal and volume control.
 */
import { decodePcm } from './protocol';

export class AudioPlayer {
  private gain: GainNode;
  private sources = new Set<AudioBufferSourceNode>();
  private scheduled = 0;
  private volume = 0.85;
  constructor(private context: AudioContext) {
    this.gain = context.createGain();
    this.gain.gain.value = this.volume;
    this.gain.connect(context.destination);
  }
  get remainingMs() {
    return Math.max(0, (this.scheduled - this.context.currentTime) * 1000);
  }
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.gain.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.02);
  }
  play(data: string, completed?: () => void) {
    const samples = decodePcm(data);
    if (this.remainingMs + samples.length / 24 > 15_000)
      throw new Error('Audio queue exceeded its limit');
    const buffer = this.context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    this.sources.add(source);
    source.onended = () => {
      const played = this.sources.delete(source);
      source.disconnect();
      if (played) completed?.();
    };
    // A small initial buffer absorbs network jitter without adding delay to each chunk.
    this.scheduled = Math.max(
      this.scheduled,
      this.context.currentTime + (this.sources.size === 1 ? 0.1 : 0),
    );
    source.start(this.scheduled);
    this.scheduled += buffer.duration;
  }
  stop() {
    const now = this.context.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setValueAtTime(this.gain.gain.value, now);
    this.gain.gain.linearRampToValueAtTime(0, now + 0.015);
    for (const source of this.sources) source.stop(now + 0.02);
    this.sources.clear();
    this.scheduled = 0;
    this.gain.gain.setValueAtTime(this.volume, now + 0.025);
  }
  dispose() {
    this.stop();
    this.gain.disconnect();
  }
}

export async function testSpeaker() {
  const context = new AudioContext();
  try {
    await context.resume();
    for (const [offset, frequency] of [
      [0, 440],
      [0.18, 554.37],
    ] as const) {
      const tone = context.createOscillator(),
        gain = context.createGain();
      const start = context.currentTime + offset;
      tone.type = 'sine';
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      tone.connect(gain);
      gain.connect(context.destination);
      tone.start(start);
      tone.stop(start + 0.22);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    await context.close();
  }
}
