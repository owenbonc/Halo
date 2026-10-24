import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MAX_RECORDING_BYTES, RecordedCall } from './recorded-call';

class Recorder {
  static current: Recorder;
  static finalSize = 16;
  constructor() {
    Recorder.current = this;
  }
  state = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable?: (e: { data: Blob }) => void;
  onstop?: () => void;
  onerror?: () => void;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob([new Uint8Array(Recorder.finalSize)]) });
    this.onstop?.();
  }
}
beforeEach(() => {
  Recorder.finalSize = 16;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('records only after explicit start and submits once while releasing the microphone', async () => {
  vi.stubGlobal('MediaRecorder', Recorder);
  vi.stubGlobal('window', {});
  const stop = vi.fn();
  const stream = { active: true, getTracks: () => [{ stop }] } as unknown as MediaStream;
  const fetcher = vi.fn().mockResolvedValue(Response.json({ transcript: 'A synthetic caller.' }));
  vi.stubGlobal('fetch', fetcher);
  const call = new RecordedCall(stream, 'synthetic-session', vi.fn());
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
    'synthetic-session',
    vi.fn(),
  );
  call.start();
  await expect(call.finish()).rejects.toThrow('could not be transcribed');
  call.dispose();
});

it.each([MAX_RECORDING_BYTES, MAX_RECORDING_BYTES + 1])(
  'bounds incremental audio at %i bytes before upload',
  async (size) => {
    Recorder.finalSize = 0;
    vi.stubGlobal('MediaRecorder', Recorder);
    vi.stubGlobal('window', {});
    const fetcher = vi.fn().mockResolvedValue(Response.json({ transcript: 'Synthetic caller.' }));
    vi.stubGlobal('fetch', fetcher);
    const stop = vi.fn();
    const ended = vi.fn();
    const call = new RecordedCall(
      { active: true, getTracks: () => [{ stop }] } as unknown as MediaStream,
      'synthetic-session',
      ended,
    );
    call.start();
    const half = MAX_RECORDING_BYTES / 2;
    Recorder.current.ondataavailable?.({ data: new Blob([new Uint8Array(half)]) });
    Recorder.current.ondataavailable?.({ data: new Blob([new Uint8Array(size - half)]) });
    if (size > MAX_RECORDING_BYTES) {
      expect(stop).toHaveBeenCalled();
      expect(ended).toHaveBeenCalledOnce();
      expect(Recorder.current.state).toBe('inactive');
      await expect(call.finish()).rejects.toThrow('too large');
      expect(fetcher).not.toHaveBeenCalled();
    } else {
      expect(await call.finish()).toBe('Caller: Synthetic caller.');
      expect(fetcher).toHaveBeenCalledOnce();
      expect(ended).not.toHaveBeenCalled();
    }
    call.dispose();
  },
);

it('rejects empty recordings before transcription', async () => {
  Recorder.finalSize = 0;
  vi.stubGlobal('MediaRecorder', Recorder);
  vi.stubGlobal('window', {});
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const call = new RecordedCall(
    { active: true, getTracks: () => [{ stop() {} }] } as unknown as MediaStream,
    'synthetic-session',
    vi.fn(),
  );
  call.start();
  await expect(call.finish()).rejects.toThrow('No audio');
  expect(fetcher).not.toHaveBeenCalled();
  call.dispose();
});

it.each(['timeout', 'cancel'] as const)(
  'settles a stalled recorder on %s without uploading',
  async (reason) => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'MediaRecorder',
      class extends Recorder {
        stop() {
          this.state = 'inactive';
        }
      },
    );
    vi.stubGlobal('window', {});
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const stop = vi.fn();
    const ended = vi.fn();
    const call = new RecordedCall(
      { active: true, getTracks: () => [{ stop }] } as unknown as MediaStream,
      'synthetic-session',
      ended,
    );
    call.start();
    const result = expect(call.finish()).rejects.toThrow(
      reason === 'timeout' ? 'could not finish' : 'Aborted',
    );
    expect(stop).toHaveBeenCalled();
    if (reason === 'cancel') call.dispose();
    await vi.advanceTimersByTimeAsync(5000);
    await result;
    Recorder.current.ondataavailable?.({ data: new Blob(['late synthetic audio']) });
    Recorder.current.onstop?.();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetcher).not.toHaveBeenCalled();
    expect(ended).toHaveBeenCalledTimes(reason === 'timeout' ? 1 : 0);
    call.dispose();
  },
);

it('accepts a final chunk arriving after three seconds, within the bounded wait', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'MediaRecorder',
    class extends Recorder {
      stop() {
        this.state = 'inactive';
        setTimeout(() => {
          this.ondataavailable?.({ data: new Blob(['delayed synthetic audio']) });
          this.onstop?.();
        }, 3000);
      }
    },
  );
  vi.stubGlobal('window', {});
  const fetcher = vi.fn().mockResolvedValue(Response.json({ transcript: 'Synthetic caller.' }));
  vi.stubGlobal('fetch', fetcher);
  const stop = vi.fn();
  const ended = vi.fn();
  const call = new RecordedCall(
    { active: true, getTracks: () => [{ stop }] } as unknown as MediaStream,
    'synthetic-session',
    ended,
  );
  call.start();
  const result = call.finish();
  expect(stop).toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(3000);
  expect(await result).toBe('Caller: Synthetic caller.');
  expect(fetcher).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(3000);
  expect(ended).not.toHaveBeenCalled();
  call.dispose();
});

it('does not start a failed recorder even if its stream still reports active', async () => {
  vi.stubGlobal('MediaRecorder', Recorder);
  vi.stubGlobal('window', {});
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const ended = vi.fn();
  const call = new RecordedCall(
    { active: true, getTracks: () => [{ stop() {} }] } as unknown as MediaStream,
    'synthetic-session',
    ended,
  );
  Recorder.current.onerror?.();
  expect(() => call.start()).toThrow('Call cancelled');
  expect(Recorder.current.state).toBe('inactive');
  expect(ended).toHaveBeenCalledOnce();
  expect(fetcher).not.toHaveBeenCalled();
  call.dispose();
});
