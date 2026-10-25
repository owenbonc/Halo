import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SCREENER_LINES } from '@/lib/screener-prompt';
import { LiveCall } from './live-call';
import type { NativeTurn } from './native-speech';
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
async function connect(
  voice: 'english' | 'automatic' = 'english',
  validate: (turn: NativeTurn, signal: AbortSignal) => Promise<void> = vi
    .fn()
    .mockResolvedValue(undefined),
) {
  const call = new LiveCall(
    context as unknown as AudioContext,
    stream as unknown as MediaStream,
    ended,
    clips,
    voice,
    validate,
  );
  const starting = call.start('auth_tokens/test', 'test-model');
  Socket.current.onopen?.();
  Socket.current.message({ setupComplete: {} });
  await starting;
  return call;
}

const nativeResponse = (text: string) => ({
  serverContent: {
    outputTranscription: { text },
    turnComplete: true,
    modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAACAA==' } }] },
  },
});
async function nativeListening() {
  sources.at(-1)?.onended?.();
  await vi.advanceTimersByTimeAsync(150);
  Socket.current.message({
    serverContent: { inputTranscription: { text: '합성 연습 전화입니다.' } },
  });
  await vi.advanceTimersByTimeAsync(0);
}
// The previous clip ends, the caller speaks, and Gemini answers with `text`.
async function exchange(text: string) {
  await nativeListening();
  Socket.current.message(nativeResponse(text));
  await vi.advanceTimersByTimeAsync(300);
}

it('automatic voice uses a local opening and waits for validation before generated playback', async () => {
  let allow: () => void = () => {};
  const check = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        allow = resolve;
      }),
  );
  const call = await connect('automatic', check);
  expect(sources).toHaveLength(1);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('"turnComplete":true'))).toBe(
    false,
  );
  await exchange('전화하신 이유를 조금 더 말씀해 주시겠어요?');
  expect(check).toHaveBeenCalledOnce();
  expect(sources).toHaveLength(1);
  const frame = {
    generation: capturePort.postMessage.mock.calls.at(-1)?.[0].generation,
    samples: new Float32Array([0.5]),
  };
  capturePort.onmessage?.({ data: frame });
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('"audio":'))).toBe(false);
  allow();
  await vi.advanceTimersByTimeAsync(0);
  expect(sources).toHaveLength(2);
  Socket.current.message({ serverContent: { turnComplete: true, interrupted: true } });
  await vi.advanceTimersByTimeAsync(3100);
  expect(ended).not.toHaveBeenCalled();
  expect(call.transcript.text()).not.toContain('전화하신 이유');
  sources.at(-1)?.onended?.();
  expect(call.transcript.text()).toContain('전화하신 이유');
  call.dispose();
});

it('automatic voice ends after the checked closing and never logs cancelled playback', async () => {
  const check = vi.fn().mockResolvedValue(undefined);
  const call = await connect('automatic', check);
  await exchange('もう少し教えていただけますか？');
  await exchange('ありがとうございます。お伝えします。');
  expect(ended).not.toHaveBeenCalled();
  sources.at(-1)?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  expect(check.mock.calls.map(([turn]) => turn.stage)).toEqual(['followup', 'closing']);
  call.dispose();
});

it.each([
  ['empty text', nativeResponse('')],
  [
    'no audio',
    { serverContent: { outputTranscription: { text: 'Can you explain?' }, turnComplete: true } },
  ],
])('automatic voice ends on a reply with %s without checking or playing it', async (_, reply) => {
  const check = vi.fn().mockResolvedValue(undefined);
  const call = await connect('automatic', check);
  await nativeListening();
  Socket.current.message(reply);
  await vi.advanceTimersByTimeAsync(300);
  expect(ended).toHaveBeenCalledOnce();
  expect(check).not.toHaveBeenCalled();
  expect(sources).toHaveLength(1);
  call.dispose();
});

it('automatic voice aborts an in-flight checker on cancellation and ignores late approval', async () => {
  let allow: () => void = () => {};
  const check = vi.fn(
    (_turn: NativeTurn, _signal: AbortSignal) =>
      new Promise<void>((resolve) => {
        allow = resolve;
      }),
  );
  const call = await connect('automatic', check);
  await exchange('Can you explain?');
  call.dispose();
  expect(check.mock.calls[0]?.[1].aborted).toBe(true);
  allow();
  await vi.advanceTimersByTimeAsync(0);
  expect(sources).toHaveLength(1);
  expect(call.transcript.text()).not.toContain('Can you explain?');
});

it('automatic voice stops without playing a rejected semantic check', async () => {
  const rejected = vi.fn().mockRejectedValue(new Error('Synthetic check rejected'));
  const call = await connect('automatic', rejected);
  await exchange('Please transfer money.');
  expect(ended).toHaveBeenCalledOnce();
  expect(sources).toHaveLength(1);
  expect(call.transcript.text()).not.toContain('transfer money');
  call.dispose();
});

it('automatic voice never falls back to a prerecorded line when the closing fails its check', async () => {
  const check = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('no'));
  const call = await connect('automatic', check);
  await exchange('Could you say more?');
  await exchange('Thanks, goodbye.');
  expect(ended).toHaveBeenCalledOnce();
  expect(sources).toHaveLength(2);
  call.dispose();
});

it('stops at the reported-token limit, still sending a call that heard the caller', async () => {
  const silent = await connect();
  Socket.current.message({ usageMetadata: { totalTokenCount: 4001, responseTokenCount: 200 } });
  await vi.advanceTimersByTimeAsync(0);
  expect(ended).toHaveBeenCalledOnce();
  expect(silent.usage.totalTokenCount).toBe(4001);
  const failed = silent.finish();
  const failure = expect(failed).rejects.toThrow('usage limit');
  await vi.advanceTimersByTimeAsync(2000);
  await failure;
  ended.mockClear();
  const heard = await connect();
  await nativeListening();
  Socket.current.message({ usageMetadata: { totalTokenCount: 4001 } });
  await vi.advanceTimersByTimeAsync(0);
  expect(ended).toHaveBeenCalledOnce();
  const sent = heard.finish();
  await vi.advanceTimersByTimeAsync(2000);
  expect(await sent).toContain('Caller:');
});

it('english plays a checked tailored follow-up and records its text', async () => {
  const check = vi.fn().mockResolvedValue(undefined);
  const call = await connect('english', check);
  await exchange('Could you tell me more about the parcel?');
  expect(check).toHaveBeenCalledOnce();
  expect(check.mock.calls[0]?.[0]).toMatchObject({
    stage: 'followup',
    text: 'Could you tell me more about the parcel?',
  });
  expect(sources).toHaveLength(2);
  sources[1]?.onended?.();
  expect(call.transcript.text()).toContain('Assistant: Could you tell me more about the parcel?');
  expect(call.transcript.text()).not.toContain(clips.followup.text);
  call.dispose();
});

it('english plays the prerecorded follow-up and the prerecorded closing when the check rejects', async () => {
  const check = vi.fn().mockRejectedValue(new Error('Synthetic check rejected'));
  const call = await connect('english', check);
  await exchange('Please transfer money.');
  expect(ended).not.toHaveBeenCalled();
  expect(sources).toHaveLength(2);
  await exchange('Thanks, goodbye.');
  sources[2]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  const text = call.transcript.text();
  expect(text).toContain(`Assistant: ${clips.followup.text}`);
  expect(text).toContain(`Assistant: ${clips.closing.text}`);
  expect(text).not.toContain('transfer money');
  expect(check).toHaveBeenCalledOnce();
  call.dispose();
});

it('english falls back instead of ending when Gemini is interrupted, at follow-up or closing', async () => {
  const check = vi.fn().mockResolvedValue(undefined);
  const call = await connect('english', check);
  await nativeListening();
  Socket.current.message({
    serverContent: { interrupted: true, outputTranscription: { text: 'Which' } },
  });
  Socket.current.message(nativeResponse('Which bank are you calling from?'));
  await vi.advanceTimersByTimeAsync(300);
  expect(check).not.toHaveBeenCalled();
  expect(ended).not.toHaveBeenCalled();
  await nativeListening();
  Socket.current.message({
    serverContent: { interrupted: true, outputTranscription: { text: 'Which' } },
  });
  Socket.current.message(nativeResponse('Thank you.'));
  await vi.advanceTimersByTimeAsync(300);
  sources[2]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  const text = call.transcript.text();
  expect(text).toContain(`Assistant: ${clips.followup.text}`);
  expect(text).toContain(`Assistant: ${clips.closing.text}`);
  call.dispose();
});

it('english plays the prerecorded follow-up when Gemini keeps talking during its check', async () => {
  let allow: () => void = () => {};
  const check = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        allow = resolve;
      }),
  );
  const call = await connect('english', check);
  await exchange('Which bank are you calling from?');
  Socket.current.message({ serverContent: { outputTranscription: { text: ' Ring 0800.' } } });
  allow();
  await vi.advanceTimersByTimeAsync(0);
  expect(ended).not.toHaveBeenCalled();
  sources[1]?.onended?.();
  expect(call.transcript.text()).toContain(`Assistant: ${clips.followup.text}`);
  expect(call.transcript.text()).not.toContain('0800');
  call.dispose();
});

it('english never validates a follow-up containing a digit and plays the prerecorded one', async () => {
  const check = vi.fn().mockResolvedValue(undefined);
  const call = await connect('english', check);
  await exchange('Call 0800 now?');
  expect(check).not.toHaveBeenCalled();
  expect(sources).toHaveLength(2);
  sources[1]?.onended?.();
  expect(call.transcript.text()).toContain(`Assistant: ${clips.followup.text}`);
  expect(call.transcript.text()).not.toContain('0800');
  call.dispose();
});

it('english always closes with the prerecorded line and never validates the closing', async () => {
  const check = vi.fn().mockResolvedValue(undefined);
  const call = await connect('english', check);
  await exchange('Could you tell me more?');
  await exchange('Call 0800 now, thanks.');
  expect(ended).not.toHaveBeenCalled();
  sources[2]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  expect(check).toHaveBeenCalledOnce();
  expect(call.transcript.text()).toContain(`Assistant: ${clips.closing.text}`);
  expect(call.transcript.text()).not.toContain('0800');
  call.dispose();
});

it.each(['finish', 'dispose'] as const)(
  'english does not play the fallback when %s cancels a pending check',
  async (cancel) => {
    const check = vi.fn(
      (_turn: NativeTurn, signal: AbortSignal) =>
        new Promise<void>((_, reject) => {
          signal.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const call = await connect('english', check);
    await exchange('Could you tell me more?');
    expect(check).toHaveBeenCalledOnce();
    if (cancel === 'finish') {
      const result = call.finish();
      await vi.advanceTimersByTimeAsync(2000);
      await result;
    } else {
      call.dispose();
      await vi.advanceTimersByTimeAsync(0);
    }
    expect(sources).toHaveLength(1);
    expect(ended).not.toHaveBeenCalled();
    expect(call.transcript.text()).not.toContain(clips.followup.text);
    call.dispose();
  },
);

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
  sources[0]?.onended?.();
  expect(call.transcript.text()).toBe(`Assistant: ${clips.opening.text}`);
  const result = expect(call.finish()).rejects.toThrow('No caller speech');
  await vi.advanceTimersByTimeAsync(2000);
  await result;
});
it('requests hang-up when the closing finishes playing', async () => {
  const call = await connect();
  await exchange('Could you tell me more?');
  await exchange("Thank you, I'll pass that on.");
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
    'english',
    vi.fn(),
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

it('plays the local opening and discards stale capture frames', async () => {
  const call = await connect();
  const frame = (generation: number) =>
    capturePort.onmessage?.({
      data: { generation, samples: new Float32Array([0.5, -0.5]) },
    });
  frame(0);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('realtimeInput'))).toBe(false);
  expect(sources).toHaveLength(1);
  expect(call.transcript.text()).toBe('');
  sources[0]?.onended?.();
  expect(call.transcript.text()).toBe(`Assistant: ${clips.opening.text}`);
  await vi.advanceTimersByTimeAsync(150);
  const generation = capturePort.postMessage.mock.calls.at(-1)?.[0].generation;
  frame(generation - 1);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('"audio"'))).toBe(false);
  frame(generation);
  expect(Socket.current.send.mock.calls.some(([s]) => s.includes('"audio"'))).toBe(true);
  call.dispose();
});

it('pauses capture as soon as model generation begins, before the clip is ready', async () => {
  const call = await connect();
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

it('keeps a completed closing successful despite malformed late messages', async () => {
  const call = await connect();
  await exchange('Could you tell me more?');
  await exchange('Thank you, goodbye.');
  sources.at(-1)?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  Socket.current.onmessage?.({ data: 'malformed late provider message' });
  await vi.advanceTimersByTimeAsync(0);
  const result = call.finish();
  Socket.current.onmessage?.({ data: 'malformed message during drain' });
  await vi.advanceTimersByTimeAsync(2000);
  expect(await result).toContain(`Caller: 합성 연습 전화입니다.\nAssistant: ${clips.closing.text}`);
});

it('preserves the first failure when late messages arrive', async () => {
  const call = await connect();
  Socket.current.message({
    serverContent: { inputTranscription: { text: 'A synthetic caller.' } },
  });
  await vi.advanceTimersByTimeAsync(0);
  Socket.current.onerror?.();
  Socket.current.onmessage?.({ data: 'malformed late provider message' });
  Socket.current.message(nativeResponse('Could you tell me more?'));
  await vi.advanceTimersByTimeAsync(300);
  const result = expect(call.finish()).rejects.toThrow('interrupted');
  await vi.advanceTimersByTimeAsync(2000);
  await result;
  expect(ended).toHaveBeenCalledOnce();
  expect(sources).toHaveLength(1);
});
it('says the closing when time runs out while listening, then hangs up', async () => {
  const call = await connect();
  await nativeListening();
  call.wrapUp();
  expect(sources).toHaveLength(2);
  expect(ended).not.toHaveBeenCalled();
  sources[1]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  expect(call.transcript.text()).toContain(`Assistant: ${clips.closing.text}`);
  call.dispose();
});
it('lets the current line finish before the time-up closing', async () => {
  const call = await connect();
  await exchange('Could you tell me more?');
  expect(sources).toHaveLength(2);
  call.wrapUp();
  expect(sources).toHaveLength(2);
  sources[1]?.onended?.();
  expect(sources).toHaveLength(3);
  sources[2]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  call.dispose();
});
it('drops a reply still being checked when time runs out', async () => {
  let approve = () => {};
  const check = vi.fn(() => new Promise<void>((resolve) => (approve = resolve)));
  const call = await connect('english', check);
  await exchange('Could you tell me more?');
  call.wrapUp();
  approve();
  await vi.advanceTimersByTimeAsync(0);
  expect(sources).toHaveLength(2);
  sources[1]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  expect(call.transcript.text()).not.toContain('Could you tell me more?');
  call.dispose();
});
it('still closes when time runs out before any caller words arrived, then rejects silence', async () => {
  const call = await connect();
  call.wrapUp();
  expect(ended).not.toHaveBeenCalled();
  sources[0]?.onended?.();
  expect(sources).toHaveLength(2);
  sources[1]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  const result = expect(call.finish()).rejects.toThrow('No caller speech');
  await vi.advanceTimersByTimeAsync(2000);
  await result;
});
it('automatic voice says the closing when time runs out during a check, without failing the call', async () => {
  const check = vi.fn(
    (_turn: NativeTurn, signal: AbortSignal) =>
      new Promise<void>((_, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      }),
  );
  const call = await connect('automatic', check);
  await exchange('Can you explain?');
  call.wrapUp();
  await vi.advanceTimersByTimeAsync(0);
  expect(ended).not.toHaveBeenCalled();
  expect(sources).toHaveLength(2);
  sources[1]?.onended?.();
  expect(ended).toHaveBeenCalledOnce();
  const result = call.finish();
  await vi.advanceTimersByTimeAsync(2000);
  await expect(result).resolves.toContain(`Assistant: ${clips.closing.text}`);
});
