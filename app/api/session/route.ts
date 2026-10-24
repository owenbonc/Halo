import { api, connectDevice, cookie, cookieName, hash, SessionInput } from '@/lib/auth';
import { collections } from '@/lib/db';
import { fail, handle, json, readJson, sameOrigin } from '@/lib/http';

export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const body = await readJson(request, SessionInput);
    if (!body.success) return fail(400, 'Enter a role, device name and code.');
    const { token, device } = await connectDevice(body.data);
    // Re-pairing replaces this browser's previous session.
    const previous = request.headers
      .get('cookie')
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${cookieName()}=`))
      ?.slice(cookieName().length + 1);
    if (previous) await (await collections()).devices.deleteOne({ tokenHash: hash(previous) });
    return json(
      { role: device.role, expiresAt: device.expiresAt.toISOString() },
      { status: 201, headers: { 'Set-Cookie': cookie(token) } },
    );
  });
}

export async function GET(request: Request) {
  return api(request, ['grandma', 'caretaker', 'caller'], async (device) =>
    json({ role: device.role, expiresAt: device.expiresAt.toISOString() }),
  );
}

export async function DELETE(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    const token = request.headers
      .get('cookie')
      ?.split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${cookieName()}=`))
      ?.slice(cookieName().length + 1);
    if (token) await (await collections()).devices.deleteOne({ tokenHash: hash(token) });
    return json({ signedOut: true }, { headers: { 'Set-Cookie': cookie('', 0) } });
  });
}
