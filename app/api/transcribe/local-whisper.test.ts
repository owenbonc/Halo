import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { transcribeLocally } from './local-whisper';

const audio = new Blob(['synthetic'], { type: 'audio/webm;codecs=opus' });
const fetcher = vi.fn();
beforeEach(() => {
  vi.stubEnv('HALO_LOCAL_MODEL_TOKEN', 'synthetic-unit-test-token-not-a-credential');
  vi.stubGlobal('fetch', fetcher);
  fetcher.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('sends the private token only to fixed loopback, with redirects disabled', async () => {
  fetcher.mockResolvedValue(Response.json({ transcript: ' Synthetic caller. ' }));
  expect(await transcribeLocally(audio)).toBe('Synthetic caller.');
  expect(fetcher).toHaveBeenCalledWith(
    'http://127.0.0.1:8767/transcribe',
    expect.objectContaining({
      method: 'POST',
      body: audio,
      redirect: 'error',
      headers: {
        Authorization: 'Bearer synthetic-unit-test-token-not-a-credential',
        'Content-Type': audio.type,
      },
    }),
  );
});
it('fails before network use when configuration or audio is invalid', async () => {
  vi.stubEnv('HALO_LOCAL_MODEL_TOKEN', '');
  await expect(transcribeLocally(audio)).rejects.toThrow('not configured');
  vi.stubEnv('HALO_LOCAL_MODEL_TOKEN', 'synthetic-unit-test-token-not-a-credential');
  await expect(transcribeLocally(new Blob([]))).rejects.toThrow('size');
  await expect(transcribeLocally(new Blob([new Uint8Array(10 * 1024 * 1024 + 1)]))).rejects.toThrow(
    'size',
  );
  expect(fetcher).not.toHaveBeenCalled();
});
it('preserves silence but rejects invalid, oversized or extra response fields', async () => {
  fetcher.mockResolvedValueOnce(Response.json({ transcript: '' }));
  expect(await transcribeLocally(audio)).toBe('');
  for (const body of [
    { transcript: 3 },
    { transcript: 'a'.repeat(20_001) },
    { transcript: 'x', token: 'private' },
  ]) {
    fetcher.mockResolvedValueOnce(Response.json(body));
    await expect(transcribeLocally(audio)).rejects.toThrow();
  }
  fetcher.mockResolvedValueOnce(new Response('a'.repeat(100_001)));
  await expect(transcribeLocally(audio)).rejects.toThrow('Invalid transcription response');
});
it('rejects an unavailable service without returning its error body', async () => {
  fetcher.mockResolvedValue(new Response('private diagnostic', { status: 401 }));
  await expect(transcribeLocally(audio)).rejects.toThrow('unavailable');
  fetcher.mockRejectedValue(new TypeError('connection refused'));
  await expect(transcribeLocally(audio)).rejects.toThrow();
});
it('bounds the complete response, including a stalled body, to 25 seconds', async () => {
  vi.useFakeTimers();
  fetcher.mockImplementation(
    async (_url, init) =>
      new Response(
        new ReadableStream({
          start(controller) {
            init.signal.addEventListener('abort', () => controller.error(new Error('aborted')), {
              once: true,
            });
          },
        }),
      ),
  );
  const result = transcribeLocally(audio);
  const assertion = expect(result).rejects.toThrow('aborted');
  await vi.advanceTimersByTimeAsync(25_000);
  await assertion;
});
it('forwards caller cancellation to the private service', async () => {
  const caller = new AbortController();
  fetcher.mockImplementation(
    async (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
      }),
  );
  const result = transcribeLocally(audio, caller.signal);
  const assertion = expect(result).rejects.toThrow('cancelled');
  caller.abort();
  await assertion;
});
