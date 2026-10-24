import { api } from '@/lib/auth';
import { saveSettings } from '@/lib/calls';
import { fail, json, readJson } from '@/lib/http';
import { household, settingsTag } from '@/lib/settings-store';
import { Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return api(request, ['grandma', 'caretaker'], async () => {
    const current = await household();
    return json(Settings.parse(current), { headers: { ETag: settingsTag(current) } });
  });
}

export async function PUT(request: Request) {
  return api(request, ['grandma'], async () => {
    const body = await readJson(request, Settings);
    if (!body.success) return fail(400, 'Invalid settings.');
    const saved = await saveSettings(body.data, request.headers.get('if-match'));
    return json(Settings.parse(saved), { headers: { ETag: settingsTag(saved) } });
  });
}
