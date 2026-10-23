import { recordCall } from '@/lib/calls';
import { fail, readAudio } from '@/lib/http';
import { transcribe } from '@/lib/transcribe';

export async function POST(request: Request) {
  const audio = await readAudio(request);
  if (typeof audio === 'string') return fail(400, audio);
  try {
    const transcript = (await transcribe(audio)).trim();
    if (transcript.length < 10) return fail(422, "We didn't catch that. Try again, or call 159.");
    return Response.json(await recordCall('voice_note', transcript, 'Your voice note'), {
      status: 201,
    });
  } catch (error) {
    console.error('voice note failed', error);
    return fail(502, "We couldn't check that just now. Try again, or call 159 if you're worried.");
  }
}
