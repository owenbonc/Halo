import { z } from 'zod';
import { collections } from '@/lib/db';
import type { LiveToken } from '@/lib/types';
import { LIVE_MODEL, mintLiveToken } from './token';

export const dynamic = 'force-dynamic';
const Mode = z.enum(['live', 'recorded']);
const headers = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin) {
    return Response.json({ error: 'Start the call from this app.' }, { status: 403, headers });
  }
  const mode = Mode.safeParse(url.searchParams.get('mode') ?? 'live');
  if (!mode.success) {
    return Response.json({ error: 'Unknown call mode.' }, { status: 400, headers });
  }
  try {
    const recorded = mode.data === 'recorded' || process.env.DEMO_FALLBACK === '1';
    const token = recorded ? null : await mintLiveToken();
    const { callSessions } = await collections();
    const callSessionId = crypto.randomUUID();
    await callSessions.insertOne({
      id: callSessionId,
      used: false,
      createdAt: new Date().toISOString(),
    });
    const body: LiveToken = { token, callSessionId, model: recorded ? null : LIVE_MODEL };
    return Response.json(body, { status: 201, headers });
  } catch {
    return Response.json(
      { error: 'Could not start the call. Try the recorded message option or try again.' },
      { status: 503, headers },
    );
  }
}
