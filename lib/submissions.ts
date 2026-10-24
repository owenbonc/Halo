import type { z } from 'zod';
import { hash } from './auth';
import { reserveBudget } from './budget';
import { analyseBudgeted, persistCall } from './calls';
import { collections } from './db';
import { HttpError } from './http';
import { CallSession } from './server-schemas';
import { transcribe } from './transcribe';
import { CallRecord, type PostCallBody } from './types';

export async function ownedSession(id: string, ownerId: string) {
  const raw = await (await collections()).callSessions.findOne({ id, ownerId });
  if (!raw) throw new HttpError(403, 'Unknown call session.');
  const session = CallSession.parse(raw);
  if (
    session.cleanupAt.getTime() <= Date.now() ||
    (session.status !== 'completed' && session.expiresAt.getTime() <= Date.now())
  )
    throw new HttpError(410, 'This call session expired.');
  return session;
}

export async function submitCall(
  body: z.infer<typeof PostCallBody>,
  ownerId: string,
  source: CallRecord['source'] = 'screener',
): Promise<CallRecord> {
  const { callSessions, calls } = await collections();
  const initial = await ownedSession(body.callSessionId, ownerId);
  const payloadHash = hash(JSON.stringify([body.transcript, body.callerLabel]));
  if (initial.payloadHash && initial.payloadHash !== payloadHash)
    throw new HttpError(409, 'Retry with the original conversation.');
  if (initial.status === 'completed') {
    const saved = await calls.findOne({ id: initial.resultId });
    if (!saved) throw new HttpError(503, 'The saved call could not be loaded.');
    return CallRecord.parse(saved);
  }
  const leaseUntil = new Date(Date.now() + 90_000);
  const claimed = await callSessions.findOneAndUpdate(
    {
      id: initial.id,
      ownerId,
      status: { $ne: 'completed' },
      expiresAt: { $gt: new Date() },
      $and: [
        { $or: [{ payloadHash: { $exists: false } }, { payloadHash }] },
        { $or: [{ status: 'open' }, { leaseUntil: { $lte: new Date() } }] },
      ],
    },
    { $set: { payloadHash, status: 'processing', leaseUntil } },
    { returnDocument: 'after' },
  );
  if (!claimed) throw new HttpError(409, 'This call is still being saved. Retry shortly.', 2);
  try {
    const analysis = claimed.analysis ?? (await analyseBudgeted(body.transcript, source));
    await callSessions.updateOne({ id: initial.id, ownerId, leaseUntil }, { $set: { analysis } });
    const call = CallRecord.parse({
      id: initial.resultId ?? crypto.randomUUID(),
      source,
      createdAt: new Date().toISOString(),
      callerLabel: source === 'screener' ? 'Unknown caller (demo)' : 'Your voice note',
      transcript: body.transcript,
      analysis,
    });
    await persistCall(call, { id: initial.id, ownerId, leaseUntil });
    return call;
  } catch (error) {
    await callSessions.updateOne(
      { id: initial.id, ownerId, status: 'processing', leaseUntil },
      { $set: { status: 'open' }, $unset: { leaseUntil: '' } },
    );
    throw error;
  }
}

export async function transcribeCall(id: string, ownerId: string, audio: Blob): Promise<string> {
  const current = await ownedSession(id, ownerId);
  if (current.status !== 'open') throw new HttpError(409, 'This call is already being submitted.');
  const audioHash = hash(new Uint8Array(await audio.arrayBuffer()));
  if (current.audioHash && current.audioHash !== audioHash)
    throw new HttpError(409, 'Retry the original recording.');
  if (current.transcript) return current.transcript;
  const { callSessions } = await collections();
  const leaseUntil = new Date(Date.now() + 90_000);
  const claimed = await callSessions.findOneAndUpdate(
    {
      id,
      ownerId,
      status: 'open',
      $and: [
        { $or: [{ audioHash: { $exists: false } }, { audioHash }] },
        {
          $or: [
            { transcriptionLeaseUntil: { $exists: false } },
            { transcriptionLeaseUntil: { $lte: new Date() } },
          ],
        },
      ],
    },
    { $set: { audioHash, transcriptionLeaseUntil: leaseUntil } },
    { returnDocument: 'after' },
  );
  if (!claimed) throw new HttpError(409, 'This recording is still being transcribed.', 2);
  try {
    await reserveBudget('transcribe');
    let transcript: string;
    try {
      transcript = await transcribe(audio);
    } catch {
      throw new HttpError(502, 'The recording could not be transcribed. Please try again.');
    }
    if (!transcript.trim()) throw new HttpError(422, 'No speech was found. Please try again.');
    await callSessions.updateOne(
      { id, ownerId, transcriptionLeaseUntil: leaseUntil },
      { $set: { transcript } },
    );
    return transcript;
  } finally {
    await callSessions.updateOne(
      { id, ownerId, transcriptionLeaseUntil: leaseUntil },
      { $unset: { transcriptionLeaseUntil: '' } },
    );
  }
}
