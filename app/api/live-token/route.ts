import { z } from 'zod';
import { api } from '@/lib/auth';
import { reserveBudget } from '@/lib/budget';
import { collections, ensureIndexes } from '@/lib/db';
import { fail, json } from '@/lib/http';
import type { LiveToken } from '@/lib/types';
import { LIVE_MODEL, mintLiveToken } from './token';

export const dynamic = 'force-dynamic';
const Mode = z.enum(['live', 'recorded']);

export async function POST(request: Request) {
  return api(request, ['caller'], async (device) => {
    const url = new URL(request.url);
    const mode = Mode.safeParse(url.searchParams.get('mode') ?? 'live');
    if (!mode.success) {
      return fail(400, 'Unknown call mode.');
    }
    if (process.env.DEMO_FALLBACK === '1')
      return fail(
        503,
        'The fixed sample fallback is not available. Turn it off to use live analysis.',
      );
    await reserveBudget('token');
    await ensureIndexes();
    try {
      const { callSessions } = await collections();
      const recorded = mode.data === 'recorded';
      const token = recorded ? null : await mintLiveToken();
      const callSessionId = crypto.randomUUID();
      await callSessions.insertOne({
        id: callSessionId,
        ownerId: device.id,
        status: 'open',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60_000),
        cleanupAt: new Date(Date.now() + 10 * 60_000),
      });
      const body: LiveToken = {
        token,
        callSessionId,
        model: recorded ? null : LIVE_MODEL,
        recordedFixture: false,
      };
      return json(body, { status: 201 });
    } catch {
      return json(
        { error: 'Could not start the call. Try the recorded message option or try again.' },
        { status: 503 },
      );
    }
  });
}
