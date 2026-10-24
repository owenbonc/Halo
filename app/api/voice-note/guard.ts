// The recording cap from lib/http, plus room for the multipart wrapping around it.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 + 64 * 1024;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

// Checked from the header, before the body is buffered, so an oversized upload never reaches memory.
export function uploadSizeError(
  contentLength: string | null,
): { status: number; error: string } | null {
  const bytes = Number(contentLength);
  if (contentLength === null || !Number.isFinite(bytes) || bytes <= 0)
    return { status: 411, error: 'Send the recording with its length.' };
  if (bytes > MAX_UPLOAD_BYTES)
    return { status: 413, error: 'That recording is too long. Try a shorter one.' };
  return null;
}

// shortcut: per-server-instance memory, so limits reset on cold start and aren't shared across instances; move to an Atlas counter before real users.
const recent = new Map<string, number[]>();

/** True if this client may send another voice note now; records the attempt when it may. */
export function allowVoiceNote(client: string, now = Date.now()): boolean {
  const times = (recent.get(client) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) {
    recent.set(client, times);
    return false;
  }
  times.push(now);
  recent.set(client, times);
  return true;
}

export function clientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}
