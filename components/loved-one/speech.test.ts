import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { startSpeech } from './speech';

let utterance: SpeechSynthesisUtterance;
const speak = vi.fn();
const cancel = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', { speechSynthesis: { speak, cancel } });
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      constructor(text: string) {
        this.text = text;
        utterance = this as unknown as SpeechSynthesisUtterance;
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

it('uses British English and reports completion', () => {
  const ended = vi.fn();
  const failed = vi.fn();
  startSpeech('Synthetic call summary.', ended, failed);
  expect(utterance.text).toBe('Synthetic call summary.');
  expect(utterance.lang).toBe('en-GB');
  expect(utterance.rate).toBe(0.9);
  utterance.onend?.({} as SpeechSynthesisEvent);
  expect(ended).toHaveBeenCalledOnce();
  expect(failed).not.toHaveBeenCalled();
});
it('reports unavailable speech without throwing', () => {
  vi.stubGlobal('window', {});
  const failed = vi.fn();
  const stop = startSpeech('Synthetic summary.', vi.fn(), failed);
  expect(failed).toHaveBeenCalledOnce();
  expect(stop).not.toThrow();
});
it('reports browser permission/voice failures only once', () => {
  const failed = vi.fn();
  startSpeech('Synthetic summary.', vi.fn(), failed);
  utterance.onerror?.({ error: 'not-allowed' } as SpeechSynthesisErrorEvent);
  utterance.onerror?.({ error: 'synthesis-failed' } as SpeechSynthesisErrorEvent);
  expect(failed).toHaveBeenCalledOnce();
});
it('handles synchronous synthesis failure', () => {
  speak.mockImplementationOnce(() => {
    throw new Error('Synthetic browser failure');
  });
  const failed = vi.fn();
  expect(() => startSpeech('Synthetic summary.', vi.fn(), failed)).not.toThrow();
  expect(failed).toHaveBeenCalledOnce();
});
it('ignores late completion and error events after Stop or navigation', () => {
  const ended = vi.fn();
  const failed = vi.fn();
  const stop = startSpeech('Synthetic summary.', ended, failed);
  stop();
  utterance.onend?.({} as SpeechSynthesisEvent);
  utterance.onerror?.({ error: 'canceled' } as SpeechSynthesisErrorEvent);
  expect(ended).not.toHaveBeenCalled();
  expect(failed).not.toHaveBeenCalled();
  expect(cancel).toHaveBeenCalledTimes(2);
});
