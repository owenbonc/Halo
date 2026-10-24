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
  const { callSessions } = await collections();
  // Single use: a call session from /api/live-token can post one transcript.
  const session = await callSessions.findOneAndUpdate(
    { id: body.data.callSessionId, used: false },
    { $set: { used: true } },
  );
  if (!session) return fail(403, 'Unknown or already used call session.');
  const call = await recordCall('screener', body.data.transcript, body.data.callerLabel);
  return Response.json(call, { status: 201 });
}
