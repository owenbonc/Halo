import { createAlert } from '@/lib/alerts';
import { getSettings, listSamAlerts } from '@/lib/calls';
import { collections } from '@/lib/db';
import { fail, readJson } from '@/lib/http';
import { PostAlertBody } from '@/lib/types';

export async function GET() {
  return Response.json(await listSamAlerts());
}

export async function POST(request: Request) {
  const body = await readJson(request, PostAlertBody);
  if (!body.success) return fail(400, 'Expected { callId }.');
  const { calls } = await collections();
  if (!(await calls.findOne({ id: body.data.callId }))) return fail(404, 'No such call.');
  // Pause is the loved one's consent choice: while paused, nobody is told, whoever asks.
  const settings = await getSettings();
  if (settings.paused) return fail(409, 'Messages are paused.');
  return Response.json(await createAlert(body.data.callId, 'user_tap', settings.alertMode), {
    status: 201,
  });
}
