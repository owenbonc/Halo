import { listCallViews, recordCall } from '@/lib/calls';
import { collections } from '@/lib/db';
import { fail, readJson } from '@/lib/http';
import { PostCallBody } from '@/lib/types';

export async function GET() {
  return Response.json(await listCallViews());
}

export async function POST(request: Request) {
  const body = await readJson(request, PostCallBody);
  if (!body.success) return fail(400, 'Expected { callSessionId, transcript, callerLabel }.');
  try {
    const { callSessions } = await collections();
    const now = Date.now();
    // Five minutes covers the bounded call and transcription without leaving unused sessions open.
    const session = await callSessions.findOneAndUpdate(
      {
        id: body.data.callSessionId,
        used: false,
        createdAt: {
          $gt: new Date(now - 5 * 60_000).toISOString(),
          $lte: new Date(now).toISOString(),
        },
      },
      { $set: { used: true } },
    );
    if (!session) return fail(403, 'Unknown, expired or already used call session.');
    // Caller-controlled labels must not smuggle a phone number or link onto her card.
    const call = await recordCall('screener', body.data.transcript, 'Unknown caller (demo)');
    return Response.json(call, { status: 201 });
  } catch {
    return fail(503, 'Delivery could not be confirmed. Check the Alerts page before another call.');
  }
}
