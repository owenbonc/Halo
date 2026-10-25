import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SCREENER_LINES } from '@/lib/screener-prompt';
import { PhoneScreener, type ScreenerDeps } from './screener';

const clips = {
  opening: { text: SCREENER_LINES.opening, pcm: 'AAABAA==' },
  followup: { text: SCREENER_LINES.followup, pcm: 'AAABAA==' },
  closing: { text: SCREENER_LINES.closing, pcm: 'AAABAA==' },
};
const reply = (text: string) =>
  JSON.stringify({
    serverContent: {
      outputTranscription: { text },
      turnComplete: true,
      modelTurn: {
        parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: 'AAACAA==' } }],
      },
    },
  });
const caller = (text: string) =>
  JSON.stringify({ serverContent: { inputTranscription: { text } } });

let played: { pcm: string; heard: () => void }[];
let deps: ScreenerDeps;
beforeEach(() => {
  vi.useFakeTimers();
  played = [];
  deps = {
    clips,
    send: vi.fn<(value: unknown) => void>(),
    play: vi.fn((pcm, heard) => played.push({ pcm, heard })),
    silence: vi.fn(),
    check: vi.fn().mockResolvedValue(true),
    log: vi.fn(),
    ended: vi.fn<() => void>(),
  };
});
afterEach(() => vi.useRealTimers());

async function started() {
  const screener = new PhoneScreener(deps);
  screener.gemini(JSON.stringify({ setupComplete: {} }));
  return screener;
}
async function heard() {
  played.at(-1)?.heard();
  await vi.advanceTimersByTimeAsync(150);
}
type Sent = { realtimeInput?: { audio?: { mimeType: string } } };
const sent = () => vi.mocked(deps.send).mock.calls.map(([v]) => v as Sent);
const audioSent = () => sent().filter((v) => v.realtimeInput?.audio).length;

it('plays the opening, then forwards caller audio only on the caller’s turn', async () => {
  const screener = await started();
  expect(vi.mocked(deps.send)).toHaveBeenCalledWith(
    expect.objectContaining({ clientContent: expect.objectContaining({ turnComplete: false }) }),
  );
  screener.callerAudio('AAAA');
  expect(audioSent()).toBe(0);
  await heard();
  screener.callerAudio('AAAA');
  expect(audioSent()).toBe(1);
  expect(sent().at(-1)?.realtimeInput?.audio?.mimeType).toBe('audio/pcm;rate=8000');
});

it('speaks a checked follow-up, then the prerecorded closing, then ends', async () => {
  const screener = await started();
  await heard();
  screener.gemini(caller('Hello, this is the bank fraud team.'));
  screener.gemini(reply('Which bank are you calling from?'));
  await vi.advanceTimersByTimeAsync(300);
  expect(deps.check).toHaveBeenCalledOnce();
  expect(played).toHaveLength(2);
  expect(played[1]?.pcm).toBe('AAACAA==');
  await heard();
  screener.gemini(caller('Barclays.'));
  screener.gemini(reply('Thank you.'));
  await vi.advanceTimersByTimeAsync(300);
  expect(played[2]?.pcm).toBe(clips.closing.pcm);
  expect(deps.ended).not.toHaveBeenCalled();
  played[2]?.heard();
  expect(deps.ended).toHaveBeenCalledOnce();
  expect(screener.fatal).toBeUndefined();
  expect(screener.transcript.text()).toBe(
    [
      `Assistant: ${clips.opening.text}`,
      'Caller: Hello, this is the bank fraud team.',
      'Assistant: Which bank are you calling from?',
      'Caller: Barclays.',
      `Assistant: ${clips.closing.text}`,
    ].join('\n'),
  );
});

it('falls back to the prerecorded follow-up when the check refuses or fails', async () => {
  deps.check = vi.fn().mockResolvedValue(false);
  const screener = await started();
  await heard();
  screener.gemini(caller('This is the police.'));
  screener.gemini(reply('You should transfer the money now?'));
  await vi.advanceTimersByTimeAsync(300);
  expect(played[1]?.pcm).toBe(clips.followup.pcm);
  played[1]?.heard();
  expect(screener.transcript.text()).toContain(`Assistant: ${clips.followup.text}`);
  expect(screener.transcript.text()).not.toContain('transfer');
});

it('never checks a draft that carries a number, and uses the prerecorded follow-up', async () => {
  const screener = await started();
  await heard();
  screener.gemini(caller('Call me back.'));
  screener.gemini(reply('Is 0800 your number?'));
  await vi.advanceTimersByTimeAsync(300);
  expect(deps.check).not.toHaveBeenCalled();
  expect(played[1]?.pcm).toBe(clips.followup.pcm);
});

it('ignores a silent noise turn and keeps listening', async () => {
  const screener = await started();
  await heard();
  screener.gemini(JSON.stringify({ serverContent: { turnComplete: true } }));
  await vi.advanceTimersByTimeAsync(300);
  expect(played).toHaveLength(1);
  expect(deps.ended).not.toHaveBeenCalled();
  screener.callerAudio('AAAA');
  expect(audioSent()).toBe(1);
});

it('plays a spoken reply even when the caller’s words arrive late', async () => {
  const screener = await started();
  await heard();
  screener.gemini(reply('Who are you calling for?'));
  await vi.advanceTimersByTimeAsync(300);
  expect(played).toHaveLength(2);
  screener.gemini(caller('A courier is coming.'));
  played[1]?.heard();
  expect(screener.transcript.hasCaller()).toBe(true);
});

it('ends at 45 seconds and on goAway, reporting only the provider failure as fatal', async () => {
  const timed = await started();
  await vi.advanceTimersByTimeAsync(45_000);
  expect(deps.ended).toHaveBeenCalledOnce();
  expect(timed.fatal).toBeUndefined();
  expect(deps.silence).toHaveBeenCalled();

  vi.mocked(deps.ended).mockClear();
  const dropped = await started();
  dropped.gemini(JSON.stringify({ goAway: {} }));
  expect(deps.ended).toHaveBeenCalledOnce();
  expect(dropped.fatal?.message).toContain('Gemini');
});

it('treats an unreadable provider message as fatal, then ignores everything after the end', async () => {
  const screener = await started();
  screener.gemini('not json');
  expect(screener.fatal).toBeDefined();
  screener.gemini(reply('Anything?'));
  await vi.advanceTimersByTimeAsync(300);
  expect(played).toHaveLength(1);
  expect(deps.ended).toHaveBeenCalledOnce();
});

it('keeps collecting the caller’s last words after the end, for delivery', async () => {
  const screener = await started();
  await heard();
  screener.gemini(caller('A courier '));
  screener.stop();
  screener.gemini(caller('will collect the cash.'));
  expect(screener.transcript.text()).toContain('Caller: A courier will collect the cash.');
});

it('plays the closing as soon as Gemini starts its second reply', async () => {
  const screener = await started();
  await heard();
  screener.gemini(caller('This is the council.'));
  screener.gemini(reply('Which department are you in?'));
  await vi.advanceTimersByTimeAsync(300);
  await heard();
  screener.gemini(caller('Council tax.'));
  screener.gemini(JSON.stringify({ serverContent: { outputTranscription: { text: 'Thank' } } }));
  expect(played[2]?.pcm).toBe(clips.closing.pcm);
  screener.gemini(reply(' you.'));
  played[2]?.heard();
  expect(deps.ended).toHaveBeenCalledOnce();
  expect(screener.transcript.text().split('\n').at(-1)).toBe(`Assistant: ${clips.closing.text}`);
});

it('keeps listening through a noise turn before the caller’s second answer', async () => {
  const screener = await started();
  await heard();
  screener.gemini(caller('This is the council.'));
  screener.gemini(reply('Which department are you in?'));
  await vi.advanceTimersByTimeAsync(300);
  await heard();
  screener.gemini(JSON.stringify({ serverContent: { turnComplete: true } }));
  expect(played).toHaveLength(2);
  screener.callerAudio('AAAA');
  expect(audioSent()).toBe(1);
});

it('shows the caller’s words, then that Gemini is drafting, as soon as it starts replying', async () => {
  const screener = await started();
  await heard();
  screener.gemini(caller('This is the bank.'));
  screener.gemini(JSON.stringify({ serverContent: { outputTranscription: { text: 'Which' } } }));
  expect(vi.mocked(deps.log).mock.calls.slice(-2)).toEqual([
    ['caller', 'This is the bank.'],
    ['drafting', 'Gemini is writing a follow-up question'],
  ]);
});
