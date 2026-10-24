import { api, revokeDevice } from '@/lib/auth';
import { json } from '@/lib/http';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(request, ['grandma'], async (device) => {
    await revokeDevice((await params).id, device.id);
    return json({ revoked: true });
  });
}
