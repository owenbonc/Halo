import { afterEach, expect, it, vi } from 'vitest';
import { startRecording } from './recorder';

afterEach(() => vi.unstubAllGlobals());

function microphone(getUserMedia?: () => Promise<unknown>) {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] };
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: getUserMedia ?? (async () => stream) },
  });
  return { stop, stream };
}

it('releases tracks when MediaRecorder construction fails', async () => {
  const { stop } = microphone();
  vi.stubGlobal(
    'MediaRecorder',
    class {
      constructor() {
        throw new Error('unsupported');
      }
    },
  );
  await expect(startRecording()).rejects.toThrow('unsupported');
  expect(stop).toHaveBeenCalledOnce();
});

it('releases a microphone whose permission resolves after cancellation', async () => {
  let resolve: (stream: unknown) => void = () => {};
  const { stream, stop } = microphone(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const controller = new AbortController();
  const pending = startRecording(controller.signal);
  controller.abort();
  resolve(stream);
  await expect(pending).rejects.toThrow('Cancelled');
  expect(stop).toHaveBeenCalledOnce();
});

it('stops once, returns one recording promise and releases tracks on cancellation', async () => {
  const { stop } = microphone();
  let stops = 0;
  vi.stubGlobal(
    'MediaRecorder',
    class {
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      start() {
        this.state = 'recording';
      }
      stop() {
        stops++;
        this.state = 'inactive';
        queueMicrotask(() => {
          this.ondataavailable?.({ data: new Blob(['synthetic']) });
          this.onstop?.();
        });
      }
    },
  );
  const recording = await startRecording();
  const first = recording.stop();
  expect(recording.stop()).toBe(first);
  expect(await (await first).text()).toBe('synthetic');
  expect(stops).toBe(1);
  recording.cancel();
  expect(stop).toHaveBeenCalled();
});
