import { createAlert } from '@/lib/alerts';
import { api } from '@/lib/auth';
import { listSamAlerts } from '@/lib/calls';
import { fail, json, readJson } from '@/lib/http';
import { PostAlertBody } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return api(request, ['caretaker'], async (device) =>
    json(await listSamAlerts(device.recipientId as string)),
  );
}

export async function POST(request: Request) {
  return api(request, ['grandma'], async () => {
    const body = await readJson(request, PostAlertBody);
    if (!body.success) return fail(400, 'Expected { callId }.');
    return json(await createAlert(body.data.callId, 'user_tap'), { status: 201 });
  });
}
