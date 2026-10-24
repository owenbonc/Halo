import cases from '@/data/test-cases.json';
import { collections } from '@/lib/db';
import { fail, readAudio } from '@/lib/http';
import { transcribe } from '@/lib/transcribe';

// The preset sample is the stage police call, so the fallback tells the same story as the live demo.
const PRESET = (cases.find((c) => c.id === 'demo-police-courier')?.transcript ?? '')
  .split('\n')
  .filter((line) => line.startsWith('Caller: '))
  .map((line) => line.slice('Caller: '.length))
  .join(' ');

export async function POST(request: Request) {
  const { callSessions } = await collections();
  // One transcription per unused session from /api/live-token, which holds the access code and budget.
  const session = await callSessions.findOneAndUpdate(
    { id: request.headers.get('x-call-session-id') ?? '', used: false, transcribed: { $ne: true } },
    { $set: { transcribed: true } },
  );
  if (!session) return fail(403, 'Unknown or already used call session.');
  const audio = await readAudio(request);
  if (typeof audio === 'string') return fail(400, audio);
  return Response.json({ transcript: session.recordedFixture ? PRESET : await transcribe(audio) });
}
