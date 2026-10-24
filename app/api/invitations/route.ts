import { api, inviteCaretaker } from '@/lib/auth';
import { json } from '@/lib/http';

export async function POST(request: Request) {
  return api(request, ['grandma'], async (device) =>
    json(await inviteCaretaker(device.id), { status: 201 }),
  );
}
