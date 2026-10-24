import { collections } from '@/lib/db';
import { fail } from '@/lib/http';
import { scrubTranscript } from '@/lib/scrub';

// Mum's "What they said": the whole call, with every number and link the caller gave taken out.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { calls } = await collections();
  const call = await calls.findOne(
    { id: (await params).id },
    { projection: { _id: 0, transcript: 1 } },
  );
  if (!call) return fail(404, 'No such call.');
  return Response.json({ transcript: scrubTranscript(call.transcript) });
}
