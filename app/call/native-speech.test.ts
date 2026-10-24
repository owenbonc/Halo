import { afterEach, expect, it, vi } from 'vitest';
import { NativeReply, validateNativeReply } from './native-speech';

const response = (text: string) => ({
  outputTranscription: { text, finished: true },
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
  expect(reply.take()).toEqual({ stage: 'followup', text, pcm: 'AAABAA==' });
});

it('requires both completed audio turn and finished transcription, then limits to two replies', () => {
  const reply = new NativeReply();
  reply.add({ ...response('Please explain.'), outputTranscription: { text: 'Please explain.' } });
  expect(reply.ready).toBe(false);
  expect(() => reply.take()).toThrow('incomplete');
  reply.add({ outputTranscription: { finished: true } });
  expect(reply.take().stage).toBe('followup');
  reply.add(response('Thank you.'));
  expect(reply.take().stage).toBe('closing');
  reply.add(response('Another question.'));
  expect(() => reply.take()).toThrow('incomplete');
});

it.each(['Ring ０８００', 'Use bank.example', 'visit https://evil.test', 'x@y', 'Hello\u202e'])(
  'rejects destination-like or hidden content before checking: %s',
  (text) => {
    const reply = new NativeReply();
    reply.add(response(text));
    expect(() => reply.take()).toThrow('could not be checked');
  },
);

it('bounds combined chunks, text and audio format before playback', () => {
  const long = new NativeReply();
  expect(() => long.add(response('a'.repeat(501)))).toThrow('too long');
  const format = new NativeReply();
  expect(() =>
    format.add({
      modelTurn: { parts: [{ inlineData: { mimeType: 'audio/mp3', data: 'AAABAA==' } }] },
    }),
  ).toThrow('format');
  const audio = new NativeReply();
  const chunk = {
    modelTurn: {
      parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAAA'.repeat(80_000) } }],
    },
  };
  audio.add(chunk);
  audio.add(chunk);
  expect(() => audio.add(chunk)).toThrow('too long');
  expect(() => new NativeReply().add({ interrupted: true })).toThrow('interrupted');
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
