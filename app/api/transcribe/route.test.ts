import { beforeEach, expect, it, vi } from 'vitest';
import { POST } from './route';

const { transcribe } = vi.hoisted(() => ({ transcribe: vi.fn() }));
vi.mock('@/lib/transcribe', () => ({ transcribe }));
beforeEach(() => vi.clearAllMocks());

const request = (audio?: Blob) => {
  const form = new FormData();
  if (audio) form.append('audio', audio, 'synthetic.wav');
  return new Request('https://demo.test/api/transcribe', { method: 'POST', body: form });
};

it('rejects missing or oversized audio before contacting the provider', async () => {
  expect((await POST(request())).status).toBe(400);
  expect((await POST(request(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)])))).status).toBe(400);
  expect(transcribe).not.toHaveBeenCalled();
});

it('returns the real transcription through the existing contract', async () => {
  transcribe.mockResolvedValue('This is a synthetic caller.');
  const response = await POST(request(new Blob(['synthetic audio'], { type: 'audio/wav' })));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ transcript: 'This is a synthetic caller.' });
});

it('turns provider failures into a controlled error without leaking provider details', async () => {
  transcribe.mockRejectedValue(new Error('Synthetic private provider diagnostic'));
  const response = await POST(request(new Blob(['synthetic audio'])));
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({
    error: 'The recording could not be transcribed. Please try again.',
  });
});
