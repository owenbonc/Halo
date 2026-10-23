import { recordCall } from '@/lib/calls';
import { fail, readAudio } from '@/lib/http';
import { transcribe } from '@/lib/transcribe';

export async function POST(request: Request) {
  const audio = await readAudio(request);
  if (typeof audio === 'string') return fail(400, audio);
  const transcript = (await transcribe(audio)).trim();
  if (transcript.length < 10) return fail(422, "I didn't catch that. Try again, or call 159.");
  return Response.json(await recordCall('voice_note', transcript, 'Your voice note'), {
    status: 201,
  });
}
