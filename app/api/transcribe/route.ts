import { fail, readAudio } from '@/lib/http';
import { transcribe } from '@/lib/transcribe';

export async function POST(request: Request) {
  const audio = await readAudio(request);
  if (typeof audio === 'string') return fail(400, audio);
  try {
    return Response.json({ transcript: await transcribe(audio) });
  } catch {
    return fail(502, 'The recording could not be transcribed. Please try again.');
  }
}
