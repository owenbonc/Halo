'use client';
import { useEffect, useId, useState } from 'react';
import { Button, buttonClass } from '@/components/ui/Button';
import { BandBadge, Card } from '@/components/ui/band';
import { Check, Phone, Speaker, TriangleAlert } from '@/components/ui/icons';
import { GUIDANCE } from '@/lib/guidance';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { AlertRecord, CallView } from '@/lib/types';

const ALERT_LINE: Record<AlertRecord['status'], (contact: string) => string> = {
  sent: (c) => `${c} has been told and asked to call you.`,
  acknowledged: (c) => `${c} is calling you.`,
  escalated: (c) => `${c} hasn't replied. Call 159.`,
};

const ALERT_STYLE: Record<AlertRecord['status'], { box: string; Icon: typeof Check }> = {
  sent: { box: 'bg-surface', Icon: Check },
  acknowledged: { box: 'bg-accent text-on-accent text-2xl', Icon: Phone },
  escalated: { box: 'bg-surface text-danger', Icon: TriangleAlert },
};

export function when(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return date.toDateString() === new Date().toDateString()
    ? `Today at ${time}`
    : `${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} at ${time}`;
}

function reassurance(call: CallView) {
  if (call.source === 'voice_note')
    return 'You told us about this call. You did the right thing by checking.';
  if (call.analysis.band === 'none') return 'We answered this call for you.';
  return 'We answered this call for you. You did the right thing by not answering it yourself.';
}

// Each part becomes its own sentence so the voice pauses between them.
const sentences = (parts: (string | false | null)[]) =>
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

export function CallCard({
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
  const status = call.alert && ALERT_LINE[call.alert.status](contact);
  const voice = useReadAloud();
  const titleId = useId();
  // 159 is the one action she can take herself; once Sam is calling, it would only compete.
  const call159 =
    analysis.band === 'strong' && (call.alert ? call.alert.status !== 'acknowledged' : paused);

  const script = sentences([
    BAND_LABEL[analysis.band].title,
    warning && FAMILY_LABEL[analysis.family],
    warning && analysis.summary,
    reassurance(call),
    status,
    steps.length > 0 && 'What to do now',
    ...steps.map((s) => `${s.title}. ${s.body}`),
    analysis.cues.length > 0 && `The caller said: ${analysis.cues.join(', ')}`,
  ]);

  // Entrances move but never fade: if a browser stops drawing frames, the card must still be readable.
  return (
    <Card
      tone={analysis.band}
      aria-labelledby={titleId}
      className="space-y-5 transition duration-500 ease-out starting:translate-y-3 motion-reduce:transition-none"
    >
      <p className="text-ink-2 tabular-nums">
        {call.callerLabel} · {when(call.createdAt)}
      </p>
      <div className="space-y-2">
        <h2 id={titleId}>
          <BandBadge band={analysis.band} />
        </h2>
        {warning && <p className="text-2xl font-semibold">{FAMILY_LABEL[analysis.family]}</p>}
        {warning && analysis.summary && <p>{analysis.summary}</p>}
      </div>
      <p>{reassurance(call)}</p>

      <div aria-live="polite" className="space-y-3">
        {call.alert && status ? (
          <AlertLine key={call.alert.status} status={call.alert.status} text={status} />
        ) : (
          warning &&
          (paused ? (
            <p className="text-ink-2">
              Messages to {contact} are paused. You can turn them back on in Settings.
            </p>
          ) : (
            <AskButton callId={call.id} contact={contact} />
          ))
        )}
        {call159 && (
          <a href="tel:159" className={buttonClass('primary')}>
            <Phone />
            Call 159
          </a>
        )}
      </div>

      <Button
        variant="secondary"
        onClick={() => (voice.speaking ? voice.stop() : voice.read(script))}
      >
        <Speaker />
        {voice.speaking ? 'Stop reading' : 'Read it to me'}
      </Button>

      {steps.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">What to do now</h3>
          <ol className="list-decimal space-y-3 pl-7 marker:font-bold">
            {steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}.</strong> {step.body}
              </li>
            ))}
          </ol>
        </div>
      )}

      {analysis.cues.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold">What the caller said that worried us</h3>
          <ul className="space-y-2">
            {analysis.cues.map((cue) => (
              <li key={cue} className="break-words rounded-chip bg-surface/80 px-4 py-2">
                “{cue}”
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function AlertLine({ status, text }: { status: AlertRecord['status']; text: string }) {
  const { box, Icon } = ALERT_STYLE[status];
  return (
    <p
      className={`flex items-start gap-3 rounded-chip p-4 font-semibold transition duration-500 ease-out starting:scale-[0.97] motion-reduce:transition-none ${box}`}
    >
      <Icon className="mt-1 size-[1.1em]" />
      {text}
    </p>
  );
}

function AskButton({ callId, contact }: { callId: string; contact: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const ask = async () => {
    setState('sending');
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId }),
    }).catch(() => null);
    setState(res?.ok ? 'sent' : 'failed');
  };
  // The poll replaces this with the alert's real status within two seconds.
  if (state === 'sent') return <AlertLine status="sent" text={ALERT_LINE.sent(contact)} />;
  return (
    <div className="space-y-2">
      <Button onClick={ask} disabled={state === 'sending'}>
        <Phone />
        {state === 'sending' ? `Telling ${contact}…` : `Ask ${contact} to call me`}
      </Button>
      {state === 'failed' && (
        <p role="alert" className="font-semibold text-danger">
          That didn't send. Try again, or call {contact} or 159 yourself.
        </p>
      )}
    </div>
  );
}
