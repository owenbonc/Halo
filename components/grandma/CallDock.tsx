'use client';
import { useEffect, useState } from 'react';
import { Button, buttonClass } from '@/components/ui/Button';
import { Check, Phone, Speaker, TriangleAlert } from '@/components/ui/icons';
import { GUIDANCE } from '@/lib/guidance';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';
import { reassurance } from './CallCard';

// Each part becomes its own sentence so the voice pauses between them.
const sentences = (parts: (string | false | null | undefined)[]) =>
  parts
    .filter((p): p is string => Boolean(p))
    .map((p) => (/[.!?]$/.test(p) ? p : `${p}.`))
    .join(' ');

function useReadAloud() {
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

type SamState = 'unsent' | 'paused' | 'sent' | 'acknowledged' | 'escalated';

const SAM_LINE: Record<SamState, (c: string) => string> = {
  unsent: (c) => `${c} hasn't been told yet.`,
  paused: (c) => `Messages to ${c} are paused.`,
  sent: (c) => `${c} has been told and asked to call you.`,
  acknowledged: (c) => `${c} is calling you.`,
  escalated: (c) => `${c} hasn't replied. Call 159.`,
};

// Lavender while Sam is on it; white with a red edge when Sam hasn't replied (red text fails on lavender).
const SAM_STYLE: Record<SamState, { box: string; Icon: typeof Check }> = {
  unsent: { box: 'border-line bg-surface text-ink', Icon: Phone },
  paused: { box: 'border-line bg-surface text-ink-2', Icon: Phone },
  sent: { box: 'border-accent-strong bg-accent text-on-accent', Icon: Check },
  acknowledged: { box: 'border-accent-strong bg-accent text-on-accent', Icon: Phone },
  escalated: { box: 'border-danger bg-surface text-danger', Icon: TriangleAlert },
};

/*
 * Floats over the bottom of Grandma's screen, in thumb reach, like bulk's "your party" card: what Sam knows,
 * the one action that matters (ask Sam, or call 159), and read-aloud. Inside the phone frame on the laptop.
 */
export function CallDock({
  call,
  contact,
  paused,
}: {
  call: CallView;
  contact: string;
  paused: boolean;
}) {
  const { analysis } = call;
  const warning = analysis.band !== 'none';
  const steps = analysis.nextSteps.map((id) => GUIDANCE[id]);
  const voice = useReadAloud();
  const [asked, setAsked] = useState<'idle' | 'sending' | 'failed'>('idle');

  const sam: SamState = call.alert?.status ?? (paused ? 'paused' : 'unsent');
  const call159 = analysis.band === 'strong' && sam !== 'acknowledged';
  const askSam = sam === 'unsent';

  const script = sentences([
    BAND_LABEL[analysis.band].title,
    warning && FAMILY_LABEL[analysis.family],
    warning && analysis.summary,
    reassurance(call),
    warning && SAM_LINE[sam](contact),
    steps.length > 0 && 'What to do now',
    ...steps.map((s) => `${s.title}. ${s.body}`),
    analysis.cues.length > 0 && `The caller said: ${analysis.cues.join(', ')}`,
  ]);

  const ask = async () => {
    setAsked('sending');
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId: call.id }),
    }).catch(() => null);
    // On success the 2-second poll brings the alert, which turns this into "Sam has been told".
    setAsked(res?.ok ? 'idle' : 'failed');
  };

  const { box, Icon } = SAM_STYLE[sam];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md px-4 pb-[max(1rem,var(--safe-bottom))]">
      <div className="pointer-events-auto space-y-3 transition-transform duration-300 ease-out starting:translate-y-4 motion-reduce:transition-none">
        {warning && (
          <section
            aria-live="polite"
            aria-label={`${contact} and next steps`}
            className={`space-y-3 rounded-card border p-4 shadow-float ${box}`}
          >
            <p
              key={sam}
              className="flex items-start gap-3 text-xl font-bold transition-transform duration-200 ease-out starting:scale-[0.97] motion-reduce:transition-none"
            >
              <Icon className="mt-1 size-[1.1em]" />
              {SAM_LINE[sam](contact)}
            </p>
            {askSam && (
              <Button onClick={ask} disabled={asked === 'sending'}>
                <Phone />
                {asked === 'sending' ? `Telling ${contact}…` : `Ask ${contact} to call me`}
              </Button>
            )}
            {asked === 'failed' && (
              <p role="alert" className="font-semibold text-danger">
                That didn't send. Try again, or call {contact} or 159 yourself.
              </p>
            )}
            {call159 && (
              <a
                href="tel:159"
                className={`${buttonClass(askSam || sam === 'escalated' || sam === 'paused' ? 'primary' : 'secondary')}`}
              >
                <Phone />
                Call 159
              </a>
            )}
          </section>
        )}
        <Button
          variant="secondary"
          onClick={() => (voice.speaking ? voice.stop() : voice.read(script))}
        >
          <Speaker />
          {voice.speaking ? 'Stop reading' : 'Read it to me'}
        </Button>
      </div>
    </div>
  );
}
