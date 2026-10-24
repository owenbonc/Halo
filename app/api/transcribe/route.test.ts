import { beforeEach, expect, it, vi } from 'vitest';

const { findOneAndUpdate, transcribe } = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  transcribe: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ collections: async () => ({ callSessions: { findOneAndUpdate } }) }));
vi.mock('@/lib/transcribe', () => ({ transcribe }));

import { POST } from './route';

const request = (
  session?: string,
  audio: Blob | null = new Blob(['synthetic'], { type: 'audio/webm' }),
) => {
  const body = new FormData();
  if (audio) body.append('audio', audio, 'synthetic.webm');
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

it('rejects missing or oversized audio before using up the session or calling the provider', async () => {
  findOneAndUpdate.mockResolvedValue({ id: 's', used: false, recordedFixture: false });
  expect((await POST(request('s', null))).status).toBe(400);
  expect((await POST(request('s', new Blob([new Uint8Array(10 * 1024 * 1024 + 1)])))).status).toBe(
    400,
  );
  expect(transcribe).not.toHaveBeenCalled();
  expect(findOneAndUpdate).not.toHaveBeenCalled();
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

it('turns provider failures into a controlled error without leaking provider details', async () => {
  findOneAndUpdate.mockResolvedValue({ id: 's', used: false, recordedFixture: false });
  transcribe.mockRejectedValue(new Error('Synthetic private provider diagnostic'));
  const response = await POST(request('s'));
  expect(response.status).toBe(502);
  expect(await response.json()).toEqual({
    error: 'The recording could not be transcribed. Please try again.',
  });
});
