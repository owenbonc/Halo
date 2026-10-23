import type { z } from 'zod';

export const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function readJson<T>(request: Request, schema: z.ZodType<T>) {
  const body = await request.json().catch(() => undefined);
  return schema.safeParse(body);
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

// Returns the uploaded `audio` blob, or an error message for a 400.
export async function readAudio(request: Request): Promise<Blob | string> {
  const form = await request.formData().catch(() => undefined);
  const audio = form?.get('audio');
  if (!(audio instanceof Blob) || audio.size === 0)
    return 'Send the recording as form field "audio".';
  if (audio.size > MAX_AUDIO_BYTES) return 'Recording is too long.';
  return audio;
}
