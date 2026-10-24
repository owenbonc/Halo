import { beforeEach, expect, it, vi } from 'vitest';

const { findOneAndUpdate, transcribe } = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  transcribe: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ collections: async () => ({ callSessions: { findOneAndUpdate } }) }));
vi.mock('@/lib/transcribe', () => ({ transcribe }));

import { POST } from './route';

const request = (session?: string) => {
  const body = new FormData();
  body.append('audio', new Blob(['synthetic'], { type: 'audio/webm' }));
  return new Request('https://demo.test/api/transcribe', {
    method: 'POST',
    headers: session ? { 'x-call-session-id': session } : {},
    body,
  });
};
beforeEach(() => {
  findOneAndUpdate.mockReset();
  transcribe.mockReset().mockResolvedValue('A synthetic caller.');
});

it('refuses audio without an unused call session, before calling Gemini', async () => {
  findOneAndUpdate.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(403);
  expect(findOneAndUpdate.mock.calls[0]?.[0]).toMatchObject({ used: false });
  expect(transcribe).not.toHaveBeenCalled();
});

it('serves the preset police call for a fixture session without calling Gemini', async () => {
  findOneAndUpdate.mockResolvedValue({ id: 's', used: false, recordedFixture: true });
  const { transcript } = await (await POST(request('s'))).json();
  expect(transcript).toContain('courier will collect');
  expect(transcript).not.toContain('Assistant:');
  expect(transcribe).not.toHaveBeenCalled();
});

it('transcribes the real recording for a live session', async () => {
  findOneAndUpdate.mockResolvedValue({ id: 's', used: false, recordedFixture: false });
  expect(await (await POST(request('s'))).json()).toEqual({ transcript: 'A synthetic caller.' });
});
