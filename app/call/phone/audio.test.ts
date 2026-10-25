import { expect, it } from 'vitest';
import { decodeMulaw, encodeMulaw, geminiToPhone, phoneToGemini } from './audio';

it('matches the G.711 µ-law reference points', () => {
  expect(encodeMulaw(0)).toBe(0xff);
  expect(decodeMulaw(0xff)).toBe(0);
  expect(decodeMulaw(0x80)).toBe(32124);
  expect(decodeMulaw(0x00)).toBe(-32124);
  expect(encodeMulaw(32767)).toBe(0x80);
  expect(encodeMulaw(-32768)).toBe(0x00);
});

it('round-trips speech-level samples within µ-law’s step size', () => {
  for (const sample of [-20000, -3000, -100, 0, 57, 1200, 9000, 31000]) {
    const back = decodeMulaw(encodeMulaw(sample));
    expect(Math.abs(back - sample)).toBeLessThanOrEqual(Math.max(8, Math.abs(sample) / 16));
  }
});

it('turns a phone frame into 16-bit PCM at the same rate', () => {
  const frame = Buffer.from([0xff, 0x80, 0x00]).toString('base64');
  const pcm = Buffer.from(phoneToGemini(frame), 'base64');
  expect(pcm.length).toBe(6);
  expect([pcm.readInt16LE(0), pcm.readInt16LE(2), pcm.readInt16LE(4)]).toEqual([0, 32124, -32124]);
});

it('downsamples Gemini’s 24 kHz speech to 20 ms phone frames', () => {
  // One second of a 440 Hz tone at 24 kHz.
  const pcm = Buffer.alloc(24_000 * 2);
  for (let i = 0; i < 24_000; i += 1)
    pcm.writeInt16LE(Math.round(8000 * Math.sin((2 * Math.PI * 440 * i) / 24_000)), i * 2);
  const frames = geminiToPhone(pcm.toString('base64'));
  expect(frames).toHaveLength(50);
  const phone = Buffer.concat(frames.map((f) => Buffer.from(f, 'base64')));
  expect(phone.length).toBe(8_000);
  // The tone survives: the decoded 8 kHz signal still peaks near its original level.
  const peak = Math.max(...[...phone].map((b) => Math.abs(decodeMulaw(b))));
  expect(peak).toBeGreaterThan(7000);
  expect(peak).toBeLessThan(8600);
});
