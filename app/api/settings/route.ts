import { getSettings, saveSettings } from '@/lib/calls';
import { fail, readJson } from '@/lib/http';
import { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(await getSettings());
}

export async function PUT(request: Request) {
  const body = await readJson(request, Settings);
  if (!body.success) return fail(400, 'Invalid settings.');
  await saveSettings(body.data);
  return Response.json(body.data);
}
