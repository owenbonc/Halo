import { z } from 'zod';
import { collections } from '@/lib/db';
import type { LiveToken } from '@/lib/types';
import { accessStatus, reserveCallBudget } from './guard';
import { LIVE_MODEL, mintLiveToken } from './token';

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
  const access = accessStatus(request);
  if (access !== 200)
    return Response.json(
      {
        error:
          access === 401
            ? 'Enter the demo access code to call.'
            : 'Demo calling is not configured yet.',
      },
      { status: access, headers },
    );
  try {
    const { callSessions } = await collections();
    const retryAfter = await reserveCallBudget(callSessions.db);
    if (retryAfter)
      return Response.json(
        { error: 'Call limit reached. Please try again later.' },
        { status: 429, headers: { ...headers, 'Retry-After': String(retryAfter) } },
      );
    // The fallback serves the preset sample instead of a live call or a real transcription.
    const recordedFixture = process.env.DEMO_FALLBACK === '1';
    const recorded = mode.data === 'recorded' || recordedFixture;
    const token = recorded ? null : await mintLiveToken();
    const callSessionId = crypto.randomUUID();
    await callSessions.insertOne({
      id: callSessionId,
      used: false,
      createdAt: new Date().toISOString(),
      recordedFixture,
    });
    const body: LiveToken = {
      token,
      callSessionId,
      model: recorded ? null : LIVE_MODEL,
      recordedFixture,
    };
    return Response.json(body, { status: 201, headers });
  } catch (error) {
    console.error('live token failed', error);
    return Response.json(
      { error: 'Could not start the call. Try the recorded message option or try again.' },
      { status: 503, headers },
    );
  }
}
