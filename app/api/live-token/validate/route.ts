import { z } from 'zod';
import { NativeStage, NativeText } from '@/app/call/native-speech';
import { collections } from '@/lib/db';
import { accessStatus } from '../guard';
import { claimNativeReply } from '../native-session';
import { checkReply } from './check';

const Input = z.object({ sessionId: z.uuid(), stage: NativeStage, text: NativeText }).strict();
const answer = (status: number, valid = false) =>
  Response.json(
    { valid },
    {
      status,
      headers: { 'Cache-Control': 'no-store' },
    },
  );

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return answer(403);
  const access = accessStatus(request);
  if (access !== 200) return answer(access);
  if (!request.body) return answer(400);
  const reader = request.body.getReader();
  let timedOut = false;
  const deadline = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, 5000);
  let bytes = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 4096) {
        await reader.cancel();
        return answer(413);
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    if (timedOut) return answer(408);
  } catch {
    return answer(400);
  } finally {
    clearTimeout(deadline);
    reader.releaseLock();
  }
  let input: z.infer<typeof Input>;
  try {
    input = Input.parse(JSON.parse(text));
  } catch {
    return answer(400);
  }
  try {
    const { callSessions } = await collections();
    const now = Date.now();
    const session = await callSessions.findOne({
      id: input.sessionId,
      used: false,
      recordedFixture: false,
      createdAt: { $gte: new Date(now - 120_000).toISOString(), $lte: new Date(now).toISOString() },
    });
    const voice =
      session && (await claimNativeReply(callSessions.db, input.sessionId, input.stage, now));
    if (!voice) return answer(403);
    // Each short check is claimed once, even when the provider fails; no billable retry loop.
    const valid = await checkReply(input.text, input.stage, voice, request.signal);
    return answer(valid ? 200 : 422, valid);
  } catch {
    return answer(502);
  }
}
