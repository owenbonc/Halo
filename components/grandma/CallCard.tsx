'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BandBadge, Card } from '@/components/ui/band';
import { Check, Phone, Speaker, TriangleAlert } from '@/components/ui/icons';
import { GUIDANCE } from '@/lib/guidance';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import { speak } from '@/lib/recorder';
import type { AlertRecord, CallView } from '@/lib/types';

const ALERT_LINE: Record<AlertRecord['status'], (contact: string) => string> = {
  sent: (c) => `${c} has been told and asked to call you.`,
  acknowledged: (c) => `${c} is calling you now.`,
  escalated: (c) => `${c} hasn't replied yet. If you're worried, call 159.`,
};

const ALERT_STYLE: Record<AlertRecord['status'], { box: string; Icon: typeof Check }> = {
  sent: { box: 'border-line bg-surface', Icon: Check },
  acknowledged: { box: 'border-accent bg-accent-soft text-accent-strong text-2xl', Icon: Phone },
  escalated: { box: 'border-caution bg-caution-soft text-caution', Icon: TriangleAlert },
};

function when(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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

  const readAloud = () =>
    speak(
      [
        BAND_LABEL[analysis.band].title,
        warning && FAMILY_LABEL[analysis.family],
        analysis.summary,
        analysis.cues.length > 0 && `The caller said: ${analysis.cues.join('. ')}.`,
        steps.length > 0 && 'What to do now.',
        ...steps.map((s) => `${s.title}. ${s.body}`),
        status,
      ]
        .filter(Boolean)
        .join(' '),
    );

  return (
    <Card
      tone={analysis.band}
      className="space-y-5 transition duration-500 ease-out starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none"
    >
      <p className="text-lg text-ink-soft">
        {call.callerLabel} · {when(call.createdAt)}
      </p>
      <div className="space-y-2">
        <h2>
          <BandBadge band={analysis.band} className="text-3xl" />
        </h2>
        {warning && <p className="text-2xl font-semibold">{FAMILY_LABEL[analysis.family]}</p>}
      </div>
      <p>{reassurance(call)}</p>
      {analysis.summary && <p>{analysis.summary}</p>}

      {analysis.cues.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-bold">What the caller said that worried us</h3>
          <ul className="space-y-2">
            {analysis.cues.map((cue) => (
              <li key={cue} className="rounded-lg bg-surface/80 px-4 py-2 italic">
                “{cue}”
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-bold">What to do now</h3>
          <ol className="list-decimal space-y-3 pl-7 marker:font-bold">
            {steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}.</strong> {step.body}
              </li>
            ))}
          </ol>
        </section>
      )}

      <Button variant="secondary" onClick={readAloud}>
        <Speaker />
        Read it to me
      </Button>

      <div aria-live="polite">
        {call.alert && status ? (
          <AlertLine key={call.alert.status} status={call.alert.status} text={status} />
        ) : (
          warning &&
          (paused ? (
            <p className="text-lg text-ink-soft">
              Messages to {contact} are paused. You can turn them back on in Settings.
            </p>
          ) : (
            <AskButton callId={call.id} contact={contact} />
          ))
        )}
      </div>
    </Card>
  );
}

function AlertLine({ status, text }: { status: AlertRecord['status']; text: string }) {
  const { box, Icon } = ALERT_STYLE[status];
  return (
    <p
      className={`flex items-start gap-3 rounded-xl border-2 p-4 font-semibold transition duration-500 ease-out starting:scale-[0.97] starting:opacity-0 motion-reduce:transition-none ${box}`}
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
