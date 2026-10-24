'use client';
import { useEffect, useState } from 'react';
import { GUIDANCE } from '@/lib/guidance';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';
import { reassurance } from './CallCard';
import { SAM_LINE, samState } from './sam';

// Each part becomes its own sentence so the voice pauses between them.
const sentences = (parts: (string | false | null | undefined)[]) =>
  parts
    .filter((p): p is string => Boolean(p))
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
    .join(' ');

/** Everything on the call, in the order she would read it. */
export function readScript(call: CallView, contact: string, paused: boolean) {
  const { analysis } = call;
  const warning = analysis.band !== 'none';
  return sentences([
    BAND_LABEL[analysis.band].title,
    warning && FAMILY_LABEL[analysis.family],
    warning && analysis.summary,
    reassurance(call),
    warning && SAM_LINE[samState(call, paused)](contact),
    analysis.nextSteps.length > 0 && 'What to do now',
    ...analysis.nextSteps.map((id) => `${GUIDANCE[id].title}. ${GUIDANCE[id].body}`),
    analysis.cues.length > 0 && `The caller said: ${analysis.cues.join(', ')}`,
  ]);
}

export function useReadAloud() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => speechSynthesis.cancel(), []);
  const read = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  };
  const stop = () => {
    speechSynthesis.cancel();
    setSpeaking(false);
  };
  return { speaking, read, stop };
}
