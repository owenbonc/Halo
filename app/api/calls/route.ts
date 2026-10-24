import { api } from '@/lib/auth';
import { listCallViews } from '@/lib/calls';
import { fail, json, readJson } from '@/lib/http';
import { submitCall } from '@/lib/submissions';
import { PostCallBody } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return api(request, ['grandma'], async () => json(await listCallViews()));
}

export async function POST(request: Request) {
  return api(request, ['caller'], async (device) => {
    const body = await readJson(request, PostCallBody);
    if (!body.success) return fail(400, 'Expected { callSessionId, transcript, callerLabel }.');
    return json(await submitCall(body.data, device.id), { status: 201 });
  });
}
