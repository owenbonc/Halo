import { afterEach, expect, it, vi } from 'vitest';
import { SCREENER_LINES } from '@/lib/screener-prompt';
import { decodePcm } from './protocol';
import { loadVoice } from './scripted-voice';
import { GET } from './voice/route';

const clips = await GET().json();

afterEach(() => vi.unstubAllGlobals());

it('loads bounded bundled clips that match the exact screening script', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(clips)));
  const loaded = await loadVoice(new AbortController().signal);
  for (const id of ['opening', 'followup', 'closing'] as const) {
    expect(loaded[id].text).toBe(SCREENER_LINES[id]);
    const samples = decodePcm(loaded[id].pcm);
    expect(samples.length).toBeGreaterThan(24_000);
    expect(samples.length).toBeLessThan(12 * 24_000);
    expect(samples.some((n) => Math.abs(n) > 0.01)).toBe(true);
  }
});

it('refuses mismatched cached audio and stops a cancelled voice load', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        ...clips,
        opening: { ...clips.opening, text: 'An old script' },
      }),
    ),
  );
  await expect(loadVoice(new AbortController().signal)).rejects.toThrow();
  const controller = new AbortController();
  controller.abort();
  await expect(loadVoice(controller.signal)).rejects.toThrow('Aborted');
});
