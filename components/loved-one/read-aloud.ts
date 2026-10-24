'use client';
import { useEffect, useRef, useState } from 'react';
import { GUIDANCE } from '@/lib/guidance';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';
import { reassurance } from './CallCard';
import { SAM_LINE, samState } from './sam';
import { startSpeech } from './speech';

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
    analysis.summary.trim(),
    reassurance(call),
    warning && SAM_LINE[samState(call, paused)](contact),
    analysis.nextSteps.length > 0 && 'What to do now',
    ...analysis.nextSteps.map((id) => `${GUIDANCE[id].title}. ${GUIDANCE[id].body}`),
    analysis.cues.length > 0 && `The caller said: ${analysis.cues.join(', ')}`,
  ]);
}

export function useReadAloud() {
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancel = useRef<() => void>(() => {});
  useEffect(() => () => cancel.current(), []);
  const read = (text: string) => {
    cancel.current();
    setError(null);
    setSpeaking(true);
    cancel.current = startSpeech(
      text,
      () => setSpeaking(false),
      () => {
        setSpeaking(false);
        setError(
          'Read-aloud could not start. Try “Read it again”, or read the words on this screen.',
        );
      },
    );
  };
  const stop = () => {
    cancel.current();
    setSpeaking(false);
  };
  return { speaking, error, read, stop };
}
