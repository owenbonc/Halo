import { collections } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { scrubTranscript } from '@/lib/scrub';

export const dynamic = 'force-dynamic';

// Mum's "What they said": the whole call, with every number and link the caller gave taken out.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return api(request, ['grandma'], async () => {
    const { calls } = await collections();
    const call = await calls.findOne(
      { id: (await params).id },
      { projection: { _id: 0, transcript: 1 } },
    );
    if (!call) return fail(404, 'No such call.');
    return json({ transcript: scrubTranscript(call.transcript) });
  });
}

import { api } from '@/lib/auth';
