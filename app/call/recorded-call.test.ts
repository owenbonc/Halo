import { afterEach, expect, it, vi } from 'vitest';
import { RecordedCall } from './recorded-call';

class Recorder {
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable?: (e: { data: Blob }) => void;
  onstop?: () => void;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['synthetic audio']) });
    this.onstop?.();
  }
}
afterEach(() => vi.unstubAllGlobals());
it('records only after explicit start and submits once while releasing the microphone', async () => {
  vi.stubGlobal('MediaRecorder', Recorder);
  vi.stubGlobal('window', {});
  const stop = vi.fn();
  const stream = { active: true, getTracks: () => [{ stop }] } as unknown as MediaStream;
  const fetcher = vi.fn().mockResolvedValue(Response.json({ transcript: 'A synthetic caller.' }));
  vi.stubGlobal('fetch', fetcher);
  const call = new RecordedCall(stream, vi.fn());
  call.start();
  const first = call.finish();
  expect(call.finish()).toBe(first);
  expect(await first).toBe('Caller: A synthetic caller.');
  expect(stop).toHaveBeenCalled();
  expect(fetcher).toHaveBeenCalledOnce();
  call.dispose();
});
it('reports transcription errors without claiming delivery', async () => {
  vi.stubGlobal('MediaRecorder', Recorder);
  vi.stubGlobal('window', {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
  const call = new RecordedCall(
    { active: true, getTracks: () => [{ stop() {} }] } as unknown as MediaStream,
    vi.fn(),
  );
  call.start();
  await expect(call.finish()).rejects.toThrow('could not be transcribed');
  call.dispose();
});
