import { collections } from '@/lib/db';
import type { LiveToken } from '@/lib/types';

export const dynamic = 'force-dynamic';

// shortcut: no Gemini Live token yet (token and model are null); slice A mints the real one here.
export async function POST() {
  const { callSessions } = await collections();
  const callSessionId = crypto.randomUUID();
  await callSessions.insertOne({
    id: callSessionId,
    used: false,
    createdAt: new Date().toISOString(),
  });
  const body: LiveToken = { token: null, callSessionId, model: null };
  return Response.json(body, { status: 201 });
}
