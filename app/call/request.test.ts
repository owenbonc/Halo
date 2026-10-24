import { afterEach, expect, it, vi } from 'vitest';
import { callRequest } from './request';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it('does not issue a request after cancellation', async () => {
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const controller = new AbortController();
  controller.abort();
  await expect(
    callRequest('/api/live-token', { method: 'POST' }, 1000, controller.signal),
  ).rejects.toThrow('Aborted');
  expect(fetcher).not.toHaveBeenCalled();
});
it('aborts a hanging request at its deadline without AbortSignal.timeout', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url, init) =>
        new Promise((_resolve, reject) =>
          init.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        ),
    ),
  );
  const rejected = expect(callRequest('/test', {}, 1000)).rejects.toThrow('Aborted');
  await vi.advanceTimersByTimeAsync(1000);
  await rejected;
});
it('keeps the deadline active after headers while the body stalls', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn((_url, init) => {
      const body = new ReadableStream({
        start(controller) {
          init.signal.addEventListener('abort', () =>
            controller.error(new DOMException('Aborted', 'AbortError')),
          );
        },
      });
      return Promise.resolve(
        new Response(body, { headers: { 'Content-Type': 'application/json' } }),
      );
    }),
  );
  const rejected = expect(callRequest('/test', {}, 1000)).rejects.toThrow('Aborted');
  await vi.advanceTimersByTimeAsync(1000);
  await rejected;
});
