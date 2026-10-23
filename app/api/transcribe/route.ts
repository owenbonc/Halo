import { fail, readAudio } from '@/lib/http';
import { transcribe } from '@/lib/transcribe';

export async function POST(request: Request) {
  const audio = await readAudio(request);
  if (typeof audio === 'string') return fail(400, audio);
  return Response.json({ transcript: await transcribe(audio) });
}
