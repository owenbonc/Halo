import { expect, it, vi } from 'vitest';
import { AudioPlayer } from './audio-player';

function setup() {
  const sources: { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }[] = [];
  const gain = {
    gain: {
      value: 0.85,
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const context = {
    currentTime: 1,
    destination: {},
    createGain: () => gain,
    createBuffer: (_channels: number, length: number, rate: number) => ({
      duration: length / rate,
      copyToChannel: vi.fn(),
    }),
    createBufferSource: () => {
      const source = { start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
      sources.push(source);
      return source;
    },
  };
  return { player: new AudioPlayer(context as unknown as AudioContext), sources, gain };
}
const chunk = Buffer.alloc(4800).toString('base64');
it('buffers the first 100 ms and schedules contiguous audio chunks', () => {
  const { player, sources } = setup();
  player.play(chunk);
  player.play(chunk);
  expect(sources[0]?.start).toHaveBeenCalledWith(1.1);
  expect(sources[1]?.start.mock.calls[0]?.[0]).toBeCloseTo(1.2);
  expect(player.remainingMs).toBeCloseTo(300);
});
it('fades and stops queued sources on interruption', () => {
  const { player, sources, gain } = setup();
  player.play(chunk);
  player.stop();
  expect(sources[0]?.stop).toHaveBeenCalledWith(1.02);
  expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 1.015);
  expect(player.remainingMs).toBe(0);
});
it('bounds queued playback and volume', () => {
  const { player, gain } = setup();
  expect(() => player.play(Buffer.alloc(24_000 * 2 * 16).toString('base64'))).toThrow();
  player.setVolume(20);
  expect(gain.gain.setTargetAtTime).toHaveBeenCalledWith(1, 1, 0.02);
});
