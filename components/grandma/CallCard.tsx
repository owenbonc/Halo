'use client';
import Link from 'next/link';
import { type ReactNode, useId } from 'react';
import { Button } from '@/components/ui/Button';
import { BandBadge, Card } from '@/components/ui/band';
import { Check, ListChecks, Phone, Quote, Speaker } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';
import { useGrandma } from './GrandmaData';
import { markDone } from './prefs';
import { SAM_LINE, SAM_STYLE, samState } from './sam';

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

// A big button on the card face: icon and words, so she knows what each one does before she taps.
function Action({
  href,
  Icon,
  label,
  hint,
  primary,
  onOpen,
}: {
  href: string;
  Icon: typeof Phone;
  label: string;
  hint?: string;
  primary?: boolean;
  onOpen: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onOpen}
      className={`flex items-center rounded-card px-4 text-center font-bold leading-tight transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${primary ? 'glass-accent min-h-24 flex-col justify-center gap-2 py-3 text-xl text-on-accent' : 'glass min-h-14 justify-center gap-3 py-2 text-lg text-ink'}`}
    >
      <Icon className={primary ? 'size-9' : 'size-7'} />
      <span>
        {label}
        {hint && <span className="block text-base font-semibold">{hint}</span>}
      </span>
    </Link>
  );
}

/*
 * The card in front of her: the verdict, the scam type and Sam's status, then big buttons that each open
 * their own screen. Nothing to read past and no scrolling at Standard text.
 */
export function CallFace({ call, footer }: { call: CallView; footer?: ReactNode }) {
  const { contact, paused, done, open } = useGrandma();
  const { analysis } = call;
  const warning = analysis.band !== 'none';
  const sam = samState(call, paused);
  const { box, Icon } = SAM_STYLE[sam];
  const base = `/grandma/calls/${call.id}`;
  const titleId = useId();
  const onOpen = () => open(call.id);

  // Entrances move but never fade: if a browser stops drawing frames, the card must still be readable.
  return (
    <div className="space-y-3">
      <Card
        key={call.id}
        tone={analysis.band}
        aria-labelledby={titleId}
        className="space-y-3 transition-transform duration-300 ease-out starting:translate-y-3 motion-reduce:transition-none"
      >
        <div className="flex flex-wrap gap-2">
          <Pill className="tabular-nums">{when(call.createdAt)}</Pill>
          {call.source === 'voice_note' && <Pill>Your voice note</Pill>}
        </div>
        <h2 id={titleId}>
          <BandBadge band={analysis.band} />
        </h2>
        {warning && <Pill tone={analysis.band}>{FAMILY_LABEL[analysis.family]}</Pill>}
        {warning ? (
          <p
            aria-live="polite"
            className={`flex items-start gap-3 rounded-chip border px-4 py-2 font-bold ${box}`}
          >
            <Icon className="mt-1 size-[1.1em]" />
            {SAM_LINE[sam](contact)}
          </p>
        ) : (
          <p>{reassurance(call)}</p>
        )}
      </Card>

      <nav aria-label="What you can do" className="grid grid-cols-2 gap-3">
        {warning && (
          <>
            <Action
              primary
              href={`${base}/sam`}
              Icon={Phone}
              label={`Get ${contact}`}
              onOpen={onOpen}
            />
            <Action
              primary
              href={`${base}/help`}
              Icon={ListChecks}
              label="What to do"
              hint={analysis.band === 'strong' ? 'Call 159' : undefined}
              onOpen={onOpen}
            />
          </>
        )}
        <Action href={`${base}/said`} Icon={Quote} label="What they said" onOpen={onOpen} />
        <Action href={`${base}/read`} Icon={Speaker} label="Read it to me" onOpen={onOpen} />
      </nav>

      {done.includes(call.id) ? (
        <Pill tone="accent">
          <Check />
          You've dealt with this
        </Pill>
      ) : (
        <Button variant="secondary" size="md" onClick={() => markDone(call.id)}>
          <Check />
          I've dealt with this
        </Button>
      )}
      {footer}
    </div>
  );
}

// One row of a call list: band, scam type and when. Opens that call's full card.
export function CallRow({ call, isNew }: { call: CallView; isNew: boolean }) {
  const { analysis } = call;
  return (
    <li>
      <Link
        href={`/grandma/calls/${call.id}`}
        className="glass flex flex-col gap-3 rounded-card px-4 py-4 transition-[transform,background-color] duration-100 ease-out active:scale-[0.98]"
      >
        <BandBadge band={analysis.band} className="text-xl" />
        <span className="flex flex-wrap gap-2">
          {isNew && <Pill tone="accent">New</Pill>}
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
