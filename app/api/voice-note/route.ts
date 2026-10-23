import { recordCall } from '@/lib/calls';
import { fail, readAudio } from '@/lib/http';
import { transcribe } from '@/lib/transcribe';
import { allowVoiceNote, clientKey, uploadSizeError } from './guard';

export async function POST(request: Request) {
  const tooBig = uploadSizeError(request.headers.get('content-length'));
  if (tooBig) return fail(tooBig.status, tooBig.error);
  // Transcription is billable, so cap how often one phone can send notes.
  if (!allowVoiceNote(clientKey(request)))
    return fail(
      429,
      "That's a lot of notes in a row. Wait a minute, or call 159 if you're worried.",
    );
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
