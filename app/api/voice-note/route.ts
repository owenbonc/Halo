import { z } from 'zod';
import { api, hash } from '@/lib/auth';
import { collections, ensureIndexes } from '@/lib/db';
import { fail, json, readAudio } from '@/lib/http';
import { ownedSession, submitCall, transcribeCall } from '@/lib/submissions';
import { CallRecord } from '@/lib/types';

export async function POST(request: Request) {
  return api(request, ['grandma'], async (device) => {
    const key = z.uuid().safeParse(request.headers.get('x-voice-note-id'));
    if (!key.success) return fail(400, 'Start a voice note first.');
    const audio = await readAudio(request);
    await ensureIndexes();
    const id = hash(`${device.id}:${key.data}`);
    const { callSessions, calls } = await collections();
    await callSessions.updateOne(
      { id },
      {
        $setOnInsert: {
          id,
          ownerId: device.id,
          status: 'open',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60_000),
          cleanupAt: new Date(Date.now() + 10 * 60_000),
        },
      },
      { upsert: true },
    );
    const current = await ownedSession(id, device.id);
    if (current.status === 'completed')
      return json(CallRecord.parse(await calls.findOne({ id: current.resultId })), { status: 201 });
    const transcript = await transcribeCall(id, device.id, audio);
    if (transcript.length < 10) return fail(422, "We didn't catch that. Try again, or call 159.");
    return json(
      await submitCall(
        { callSessionId: id, transcript, callerLabel: 'Your voice note' },
        device.id,
        'voice_note',
      ),
      { status: 201 },
    );
  });
}
