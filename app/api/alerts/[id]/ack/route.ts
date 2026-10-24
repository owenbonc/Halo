import { acknowledge } from '@/lib/alerts';
import { api } from '@/lib/auth';
import { fail, json } from '@/lib/http';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(request, ['caretaker'], async (device) => {
    const alert = await acknowledge((await params).id, device.recipientId as string);
    return alert ? json(alert) : fail(404, 'No such alert.');
  });
}
