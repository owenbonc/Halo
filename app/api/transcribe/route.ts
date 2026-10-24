import { api } from '@/lib/auth';
import { HttpError, json, readAudio } from '@/lib/http';
import { ownedSession, transcribeCall } from '@/lib/submissions';

export async function POST(request: Request) {
  return api(request, ['caller'], async (device) => {
    const id = request.headers.get('x-call-session-id');
    if (!id || id.length > 100) throw new HttpError(400, 'Start a recorded call first.');
    await ownedSession(id, device.id);
    const audio = await readAudio(request);
    return json({ transcript: await transcribeCall(id, device.id, audio) });
  });
}
