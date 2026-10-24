import { api } from '@/lib/auth';
import { collections } from '@/lib/db';
import { json } from '@/lib/http';
import { Device } from '@/lib/server-schemas';
import { household } from '@/lib/settings-store';

export async function GET(request: Request) {
  return api(request, ['grandma'], async () => {
    const current = await household();
    const devices = await (await collections()).devices
      .find({ role: 'caretaker', recipientId: current.recipientId, expiresAt: { $gt: new Date() } })
      .toArray();
    return json(
      devices.map((raw) => {
        const device = Device.parse(raw);
        return {
          id: device.id,
          name: device.name,
          createdAt: device.createdAt,
          expiresAt: device.expiresAt.toISOString(),
        };
      }),
    );
  });
}
