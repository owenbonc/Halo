import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LiveCall } from './live-call';

class Socket {
  static OPEN = 1;
  static current: Socket;
  readyState = 1;
  bufferedAmount = 0;
  onopen?: () => void;
  onmessage?: (e: { data: string }) => void;
  onclose?: () => void;
  onerror?: () => void;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
  });
  constructor() {
    Socket.current = this;
  }
  message(value: unknown) {
    this.onmessage?.({ data: JSON.stringify(value) });
  }
}
const track = { stop: vi.fn() };
const node = { connect: vi.fn(), disconnect: vi.fn() };
const context = {
  createGain: vi.fn(() => ({
    gain: {
      value: 0.85,
      cancelScheduledValues: vi.fn(),
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  currentTime: 0,
  sampleRate: 48000,
  destination: {},
  audioWorklet: { addModule: vi.fn().mockResolvedValue(undefined) },
  createMediaStreamSource: vi.fn(() => node),
  close: vi.fn().mockResolvedValue(undefined),
};
const stream = { getTracks: () => [track] };
let ended = vi.fn<() => void>();
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  ended = vi.fn<() => void>();
  vi.stubGlobal('WebSocket', Socket);
  vi.stubGlobal(
    'AudioWorkletNode',
    class {
      port = {};
      connect() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function connect() {
  const call = new LiveCall(
    context as unknown as AudioContext,
    stream as unknown as MediaStream,
    ended,
  );
  const starting = call.start('auth_tokens/test', 'test-model');
  Socket.current.onopen?.();
  Socket.current.message({ setupComplete: {} });
  await starting;
  return call;
}
it('stops the microphone immediately, drains final transcript, and finishes only once', async () => {
  const call = await connect();
  Socket.current.message({ serverContent: { inputTranscription: { text: 'A courier ' } } });
  await vi.advanceTimersByTimeAsync(0);
  const result = call.finish();
  const again = call.finish();
  expect(result).toBe(again);
  expect(track.stop).toHaveBeenCalled();
  Socket.current.message({ serverContent: { inputTranscription: { text: 'will collect cash.' } } });
  await vi.advanceTimersByTimeAsync(2000);
  expect(await result).toBe('Caller: A courier will collect cash.');
  expect(Socket.current.send.mock.calls.filter(([v]) => v.includes('audioStreamEnd'))).toHaveLength(
    1,
  );
  expect(Socket.current.close).toHaveBeenCalledOnce();
});
it('rejects silence instead of submitting only the assistant greeting', async () => {
  const call = await connect();
  Socket.current.message({ serverContent: { outputTranscription: { text: 'Hello' } } });
  await vi.advanceTimersByTimeAsync(0);
  const result = expect(call.finish()).rejects.toThrow('No caller speech');
  await vi.advanceTimersByTimeAsync(2000);
  await result;
});
it('requests hang-up when the assistant completes the closing', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: "Thank you, I'll pass that on." },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(1);
  expect(ended).toHaveBeenCalledOnce();
  call.dispose();
});
it('requests hang-up on network closure and cleans up on disposal', async () => {
  const call = await connect();
  Socket.current.onclose?.();
  expect(ended).toHaveBeenCalledOnce();
  call.dispose();
  expect(track.stop).toHaveBeenCalled();
  expect(context.close).toHaveBeenCalled();
});
it('does not start capture if disconnected while the worklet is loading', async () => {
  let loaded: () => void = () => {};
  context.audioWorklet.addModule.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        loaded = resolve;
      }),
  );
  const call = new LiveCall(
    context as unknown as AudioContext,
    stream as unknown as MediaStream,
    ended,
  );
  const starting = call.start('auth_tokens/test', 'test-model');
  Socket.current.message({ setupComplete: {} });
  await vi.advanceTimersByTimeAsync(0);
  Socket.current.onclose?.();
  const finishing = expect(call.finish()).rejects.toThrow('No caller speech');
  const rejected = expect(starting).rejects.toThrow('Call cancelled');
  loaded();
  await rejected;
  expect(context.createMediaStreamSource).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(2000);
  await finishing;
});
