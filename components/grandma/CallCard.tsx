'use client';
import Link from 'next/link';
import { useId } from 'react';
import { BandBadge, Card } from '@/components/ui/band';
import { Panel, Pill } from '@/components/ui/Pill';
import { GUIDANCE } from '@/lib/guidance';
import { FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';

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

export function reassurance(call: CallView) {
  if (call.source === 'voice_note')
    return 'You told us about this call. You did the right thing by checking.';
  if (call.analysis.band === 'none') return 'We answered this call for you.';
  return 'We answered this call for you. You did the right thing by not answering it yourself.';
}

// The facts of one call. Sam's status, the action and read-aloud float in CallDock so they never scroll away.
export function CallCard({ call }: { call: CallView }) {
  const { analysis } = call;
  const warning = analysis.band !== 'none';
  const steps = analysis.nextSteps.map((id) => GUIDANCE[id]);
  const titleId = useId();

  // Entrances move but never fade: if a browser stops drawing frames, the card must still be readable.
  return (
    <Card
      tone={analysis.band}
      aria-labelledby={titleId}
      className="space-y-5 transition-transform duration-300 ease-out starting:translate-y-3 motion-reduce:transition-none"
    >
      <div className="flex flex-wrap gap-2">
        <Pill>{call.callerLabel}</Pill>
        <Pill className="tabular-nums">{when(call.createdAt)}</Pill>
      </div>
      <div className="space-y-3">
        <h2 id={titleId}>
          <BandBadge band={analysis.band} />
        </h2>
        {warning && <Pill tone={analysis.band}>{FAMILY_LABEL[analysis.family]}</Pill>}
        {warning && analysis.summary && <p>{analysis.summary}</p>}
      </div>
      <p>{reassurance(call)}</p>

      {steps.length > 0 && (
        <Panel>
          <h3 className="font-bold">What to do now</h3>
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-inset-2 font-bold text-ink tabular-nums"
                >
                  {i + 1}
                </span>
                <span>
                  <strong>{step.title}.</strong> {step.body}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {analysis.cues.length > 0 && (
        <Panel>
          <h3 className="font-bold">What the caller said that worried us</h3>
          <ul className="space-y-2">
            {analysis.cues.map((cue) => (
              <li key={cue} className="break-words rounded-chip bg-inset-2 px-4 py-2">
                “{cue}”
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </Card>
  );
}

// One row of the call history: band, scam type and when. Opens that call's full card.
export function CallRow({ call, newer }: { call: CallView; newer: boolean }) {
  const { analysis } = call;
  return (
    <li>
      <Link
        href={`/grandma/calls/${call.id}`}
        className="glass flex flex-col gap-3 rounded-card px-4 py-4 transition-[transform,background-color] duration-100 ease-out active:scale-[0.98]"
      >
        <BandBadge band={analysis.band} className="text-xl" />
        <span className="flex flex-wrap gap-2">
          {newer && <Pill tone="accent">Newer</Pill>}
          {analysis.band !== 'none' && (
            <Pill tone={analysis.band}>{FAMILY_LABEL[analysis.family]}</Pill>
          )}
          <Pill className="tabular-nums">{when(call.createdAt)}</Pill>
          {call.source === 'voice_note' && <Pill>Your voice note</Pill>}
        </span>
      </Link>
    </li>
  );
}
