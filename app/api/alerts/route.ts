import { createAlert } from '@/lib/alerts';
import { listSamAlerts } from '@/lib/calls';
import { collections } from '@/lib/db';
import { fail, readJson } from '@/lib/http';
import { PostAlertBody } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await listSamAlerts());
}

export async function POST(request: Request) {
  const body = await readJson(request, PostAlertBody);
  if (!body.success) return fail(400, 'Expected { callId }.');
  const { calls } = await collections();
  if (!(await calls.findOne({ id: body.data.callId }))) return fail(404, 'No such call.');
  return Response.json(await createAlert(body.data.callId, 'user_tap'), { status: 201 });
}
