export class CallError extends Error {}
export class AccessCodeError extends CallError {}

export async function callRequest(
  url: string,
  init: RequestInit,
  timeout: number,
  signal?: AbortSignal,
) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    // Keep cancellation and the deadline active until the response body is consumed.
    const data: unknown = response.ok ? await response.json() : null;
    return { ok: response.ok, status: response.status, data };
  } finally {
    controller.abort();
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
