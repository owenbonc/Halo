import { acknowledge } from '@/lib/alerts';
import { fail } from '@/lib/http';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const alert = await acknowledge((await params).id);
  return alert ? Response.json(alert) : fail(404, 'No such alert.');
}
