import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SCREENER_LINES } from '@/lib/screener-prompt';
import { LiveCall } from './live-call';
import { submitCall } from './submit-call';

const clips = {
  opening: { text: SCREENER_LINES.opening, pcm: 'AAABAA==' },
  followup: { text: SCREENER_LINES.followup, pcm: 'AAABAA==' },
  closing: { text: SCREENER_LINES.closing, pcm: 'AAABAA==' },
};
const sources: { onended?: () => void; stop: ReturnType<typeof vi.fn> }[] = [];
let capturePort: { postMessage: ReturnType<typeof vi.fn>; onmessage?: (event: unknown) => void };

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
  createBuffer: vi.fn(() => ({ copyToChannel: vi.fn(), duration: 1 })),
  createBufferSource: vi.fn(() => {
    const source = { ...node, start: vi.fn(), stop: vi.fn() };
    sources.push(source);
    return source;
  }),
  close: vi.fn().mockResolvedValue(undefined),
};
const stream = { getTracks: () => [track] };
let ended = vi.fn<() => void>();
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  sources.length = 0;
  ended = vi.fn<() => void>();
  vi.stubGlobal('WebSocket', Socket);
  vi.stubGlobal(
    'AudioWorkletNode',
    class {
      port = { postMessage: vi.fn() };
      constructor() {
        capturePort = this.port;
      }
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
    clips,
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
      outputTranscription: { text: SCREENER_LINES.opening },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(150);
  sources.at(-1)?.onended?.();
  await vi.advanceTimersByTimeAsync(150);
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: "Thank you, I'll pass that on." },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(150);
  expect(ended).not.toHaveBeenCalled();
  sources.at(-1)?.onended?.();
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
    clips,
  );
  const starting = call.start('auth_tokens/test', 'test-model');
  Socket.current.message({ setupComplete: {} });
  await vi.advanceTimersByTimeAsync(0);
  Socket.current.onclose?.();
  const finishing = expect(call.finish()).rejects.toThrow('interrupted');
  const rejected = expect(starting).rejects.toThrow('Call cancelled');
  loaded();
  await rejected;
  expect(context.createMediaStreamSource).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(2000);
  await finishing;
});

it('plays only Kokoro, ignores noise interruptions and discards stale capture frames', async () => {
  const call = await connect();
  const frame = (generation: number) =>
    capturePort.onmessage?.({
      data: { generation, samples: new Float32Array([0.5, -0.5]) },
    });
  frame(0);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('realtimeInput'))).toBe(false);
  Socket.current.message({
    serverContent: {
      modelTurn: {
        parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAABAA==' } }],
      },
      outputTranscription: { text: SCREENER_LINES.opening },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(150);
  expect(sources).toHaveLength(1);
  expect(call.transcript.text()).toBe('');
  Socket.current.message({ serverContent: { interrupted: true } });
  await vi.advanceTimersByTimeAsync(0);
  expect(sources[0]?.stop).not.toHaveBeenCalled();
  sources[0]?.onended?.();
  expect(call.transcript.text()).toContain(SCREENER_LINES.opening);
  await vi.advanceTimersByTimeAsync(150);
  const generation = capturePort.postMessage.mock.calls.at(-1)?.[0].generation;
  frame(generation - 1);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('"audio"'))).toBe(false);
  frame(generation);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('"audio"'))).toBe(true);
  call.dispose();
});

it('collects a late output fragment and does not log a cancelled clip as spoken', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: SCREENER_LINES.opening.slice(0, 20) },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(500);
  expect(ended).not.toHaveBeenCalled();
  expect(sources).toHaveLength(0);
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: SCREENER_LINES.opening.slice(20) },
    },
  });
  await vi.advanceTimersByTimeAsync(100);
  expect(sources).toHaveLength(1);
  call.dispose();
  sources[0]?.onended?.();
  expect(call.transcript.text()).toBe('');
});

it('waits for a late first transcript after turnComplete, with a bounded timeout', async () => {
  const call = await connect();
  Socket.current.message({ serverContent: { turnComplete: true } });
  await vi.advanceTimersByTimeAsync(500);
  expect(sources).toHaveLength(0);
  Socket.current.message({
    serverContent: { outputTranscription: { text: SCREENER_LINES.opening } },
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(sources).toHaveLength(1);
  call.dispose();
  const second = await connect();
  Socket.current.message({ serverContent: { turnComplete: true } });
  await vi.advanceTimersByTimeAsync(3000);
  expect(ended).toHaveBeenCalledOnce();
  second.dispose();
});

it('pauses capture as soon as model generation begins, before the clip is ready', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: SCREENER_LINES.opening },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(0);
  sources[0]?.onended?.();
  await vi.advanceTimersByTimeAsync(150);
  expect(capturePort.postMessage.mock.calls.at(-1)?.[0].enabled).toBe(true);
  Socket.current.message({
    serverContent: {
      modelTurn: {
        parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAABAA==' } }],
      },
    },
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(capturePort.postMessage.mock.calls.at(-1)?.[0].enabled).toBe(false);
  expect(sources).toHaveLength(1);
  call.dispose();
});

it('ignores an empty noise turn but can play text arriving after a completion marker', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: SCREENER_LINES.opening },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(0);
  sources[0]?.onended?.();
  await vi.advanceTimersByTimeAsync(150);
  Socket.current.message({ serverContent: { turnComplete: true } });
  await vi.advanceTimersByTimeAsync(3500);
  expect(ended).not.toHaveBeenCalled();
  Socket.current.message({
    serverContent: { outputTranscription: { text: SCREENER_LINES.followup } },
  });
  await vi.advanceTimersByTimeAsync(0);
  expect(sources).toHaveLength(2);
  call.dispose();
});

it('never plays an unexpected model reply or submits it as assistant speech', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: {
      outputTranscription: { text: 'Send money immediately.' },
      turnComplete: true,
    },
  });
  await vi.advanceTimersByTimeAsync(150);
  expect(sources).toHaveLength(0);
  expect(ended).toHaveBeenCalledOnce();
  expect(call.transcript.text()).toBe('');
  call.dispose();
});

it.each(['close', 'error', 'goAway'] as const)(
  'does not submit partial speech after an unexpected %s and releases the microphone immediately',
  async (failure) => {
    const call = await connect();
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    Socket.current.message({ serverContent: { inputTranscription: { text: 'A courier will' } } });
    await vi.advanceTimersByTimeAsync(0);
    if (failure === 'close') Socket.current.onclose?.();
    if (failure === 'error') Socket.current.onerror?.();
    if (failure === 'goAway') Socket.current.message({ goAway: {} });
    await vi.advanceTimersByTimeAsync(0);
    expect(track.stop).toHaveBeenCalled();
    Socket.current.onclose?.();
    expect(ended).toHaveBeenCalledOnce();
    const result = expect(
      submitCall(call, 'synthetic-session', new AbortController().signal),
    ).rejects.toThrow('interrupted');
    await vi.advanceTimersByTimeAsync(2000);
    await result;
    expect(fetcher).not.toHaveBeenCalled();
  },
);

it('does not turn a deliberate hang-up into a failure when the socket closes during the drain', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: { inputTranscription: { text: 'A synthetic caller.' } },
  });
  await vi.advanceTimersByTimeAsync(0);
  const finished = call.finish();
  Socket.current.onclose?.();
  Socket.current.onerror?.();
  await vi.advanceTimersByTimeAsync(2000);
  expect(await finished).toBe('Caller: A synthetic caller.');
  expect(ended).not.toHaveBeenCalled();
});

it('keeps a completed Kokoro closing successful despite malformed late messages', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: { outputTranscription: { text: SCREENER_LINES.opening }, turnComplete: true },
  });
  await vi.advanceTimersByTimeAsync(0);
  sources[0]?.onended?.();
  await vi.advanceTimersByTimeAsync(150);
  Socket.current.message({
    serverContent: { inputTranscription: { text: 'A synthetic caller.' } },
  });
  Socket.current.message({
    serverContent: { outputTranscription: { text: SCREENER_LINES.closing }, turnComplete: true },
  });
  await vi.advanceTimersByTimeAsync(0);
  sources[1]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  Socket.current.onmessage?.({ data: 'malformed late provider message' });
  await vi.advanceTimersByTimeAsync(0);
  const result = call.finish();
  Socket.current.onmessage?.({ data: 'malformed message during drain' });
  await vi.advanceTimersByTimeAsync(2000);
  expect(await result).toContain(
    `Caller: A synthetic caller.\nAssistant: ${SCREENER_LINES.closing}`,
  );
});

it('preserves the first failure when late messages arrive', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: { inputTranscription: { text: 'A synthetic caller.' } },
  });
  await vi.advanceTimersByTimeAsync(0);
  Socket.current.onerror?.();
  Socket.current.onmessage?.({ data: 'malformed late provider message' });
  Socket.current.message({
    serverContent: { outputTranscription: { text: SCREENER_LINES.opening }, turnComplete: true },
  });
  await vi.advanceTimersByTimeAsync(0);
  const result = expect(call.finish()).rejects.toThrow('interrupted');
  await vi.advanceTimersByTimeAsync(2000);
  await result;
  expect(ended).toHaveBeenCalledOnce();
  expect(sources).toHaveLength(0);
});
