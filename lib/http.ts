import type { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

export const privateHeaders = { 'Cache-Control': 'no-store', Vary: 'Cookie' };
export const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, { ...init, headers: { ...privateHeaders, ...init?.headers } });
export const fail = (status: number, error: string) => json({ error }, { status });

export function sameOrigin(request: Request) {
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    throw new HttpError(403, 'Start this action from this app.');
}

export async function handle(work: () => Promise<Response>) {
  try {
    return await work();
  } catch (error) {
    if (error instanceof HttpError)
      return json(
        { error: error.message },
        {
          status: error.status,
          headers: error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {},
        },
      );
    // Provider/database errors can contain credentials or caller content.
    console.error('Request failed.');
    return fail(503, 'The service is unavailable. Please try again.');
  }
}

async function boundedBody(request: Request, maximum: number): Promise<Uint8Array> {
  if (request.signal.aborted) throw new HttpError(408, 'Request cancelled.');
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maximum))
    throw new HttpError(413, 'Recording or request is too large.');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timedOut = false;
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  const timer = setTimeout(() => {
    timedOut = true;
    cancel();
  }, 30_000);
  request.signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      const next = await reader.read();
      if (timedOut || request.signal.aborted)
        throw new HttpError(408, 'Upload timed out or was cancelled.');
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maximum) throw new HttpError(413, 'Recording or request is too large.');
      chunks.push(next.value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', cancel);
    cancel();
    reader.releaseLock();
  }
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'Send JSON.');
  const bytes = await boundedBody(request, 128 * 1024);
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    body = undefined;
  }
  return schema.safeParse(body);
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const AUDIO_TYPES = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
]);

export async function readAudio(request: Request): Promise<Blob> {
  const type = request.headers.get('content-type') ?? '';
  if (!type.startsWith('multipart/form-data;'))
    throw new HttpError(415, 'Send an audio recording.');
  const bytes = await boundedBody(request, MAX_AUDIO_BYTES + 64 * 1024);
  const form = await new Response(bytes as BodyInit, { headers: { 'content-type': type } })
    .formData()
    .catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0)
    throw new HttpError(400, 'Send a recording as audio.');
  if (audio.size > MAX_AUDIO_BYTES) throw new HttpError(413, 'Recording is too long.');
  if (!AUDIO_TYPES.has((audio.type.split(';')[0] ?? '').toLowerCase()))
    throw new HttpError(415, 'Unsupported audio format.');
  return audio;
}
