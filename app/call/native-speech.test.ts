import { afterEach, expect, it, vi } from 'vitest';
import { NativeReply, validateNativeReply } from './native-speech';

const response = (text: string) => ({
  outputTranscription: { text },
  modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAABAA==' } }] },
  turnComplete: true,
});
afterEach(() => vi.unstubAllGlobals());

it.each([
  '전화하신 이유를 조금 더 말씀해 주시겠어요?',
  '可以再講多少少你打嚟嘅原因嗎？',
  '能再说说您打电话的原因吗？',
  'お電話の理由をもう少し教えていただけますか？',
  '¿Podría contarme un poco más sobre el motivo de su llamada?',
])('buffers Unicode transcription without pretending to detect its language: %s', (text) => {
  const reply = new NativeReply();
  reply.add(response(text));
  expect(reply.advance()).toEqual({ stage: 'followup', text, pcm: 'AAABAA==' });
});

it('is ready at turnComplete, then limits the call to two replies', () => {
  const reply = new NativeReply();
  reply.add({ ...response('Please explain.'), turnComplete: false });
  expect(reply.ready).toBe(false);
  reply.add({ turnComplete: true });
  expect(reply.ready).toBe(true);
  expect(reply.advance().stage).toBe('followup');
  reply.add(response('Thank you.'));
  expect(reply.advance().stage).toBe('closing');
  reply.add(response('Another question.'));
  expect(() => reply.advance()).toThrow('incomplete');
});

it('moves to the next stage even when a reply fails, and skips one unparsed', () => {
  const reply = new NativeReply();
  reply.add(response('Ring 0800 now?'));
  expect(() => reply.advance()).toThrow('could not be checked');
  expect(reply.stage).toBe('closing');
  reply.add(response('Call 0800 123.'));
  reply.skip();
  expect(() => reply.skip()).toThrow('incomplete');
});

it.each(['Ring ０８００', 'Use bank.example', 'visit https://evil.test', 'x@y', 'Hello\u202e'])(
  'rejects destination-like or hidden content before checking: %s',
  (text) => {
    const reply = new NativeReply();
    reply.add(response(text));
    expect(() => reply.advance()).toThrow('could not be checked');
  },
);

it('records an over-long, wrongly formatted or interrupted reply and fails it at its turn', () => {
  const long = new NativeReply();
  long.add(response('a'.repeat(501)));
  expect(() => long.advance()).toThrow('too long');
  const format = new NativeReply();
  format.add({
    modelTurn: { parts: [{ inlineData: { mimeType: 'audio/mp3', data: 'AAABAA==' } }] },
    turnComplete: true,
  });
  expect(() => format.advance()).toThrow('format');
  const audio = new NativeReply();
  const chunk = {
    modelTurn: {
      parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAAA'.repeat(80_000) } }],
    },
  };
  audio.add(chunk);
  audio.add(chunk);
  audio.add({ ...chunk, turnComplete: true });
  expect(audio.ready).toBe(true);
  expect(() => audio.advance()).toThrow('too long');
  const interrupted = new NativeReply();
  interrupted.add({ interrupted: true });
  interrupted.add(response('Which bank are you calling from?'));
  expect(() => interrupted.advance()).toThrow('interrupted');
  expect(interrupted.stage).toBe('closing');
});

it('requires an explicit positive checker response and never uploads buffered audio', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ valid: true }));
  vi.stubGlobal('fetch', fetcher);
  const turn = { stage: 'followup' as const, text: 'Please explain.', pcm: 'AAABAA==' };
  await validateNativeReply('test-session', 'test-code', turn, new AbortController().signal);
  const body = JSON.parse(fetcher.mock.calls[0]?.[1].body);
  expect(body).toEqual({ sessionId: 'test-session', stage: 'followup', text: 'Please explain.' });
  fetcher.mockResolvedValue(Response.json({ valid: false }));
  await expect(validateNativeReply('s', '', turn, new AbortController().signal)).rejects.toThrow(
    'could not be checked',
  );
});
