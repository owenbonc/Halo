'use client';
import Link from 'next/link';
import { type ReactNode, useId } from 'react';
import { Button } from '@/components/ui/Button';
import { BAND_TONE, BandBadge, Card } from '@/components/ui/band';
import { Check, ListChecks, Phone, Quote, Speaker } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { Band, CallView } from '@/lib/types';
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

type Segment = { href: string; Icon: typeof Phone; label: string; primary?: boolean };

// Each segment's icon and words sit in the middle of the segment, nudged clear of the verdict circle.
// The bottom quarters put their words above the icon, so the wider line stays clear of the ring's curve.
const QUARTER = [
  'flex-col pr-[10%] pb-[14%]',
  'flex-col pl-[10%] pb-[14%]',
  'flex-col-reverse pr-[10%] pt-[16%]',
  'flex-col-reverse pl-[10%] pt-[16%]',
];
const HALF = ['pr-[44%]', 'pl-[44%]'];

/*
 * Her buttons as a ring around the verdict: four quarters on a warning call, two halves on a green one.
 * The ring grows with her text size up to the screen's width; icons and words scale with the ring (cqw)
 * so they stay inside their segment.
 */
function ActionRing({
  band,
  segments,
  onOpen,
}: {
  band: Band;
  segments: Segment[];
  onOpen: () => void;
}) {
  const quarters = segments.length === 4;
  const { card, text, Icon } = BAND_TONE[band];
  return (
    <nav
      aria-label="What you can do"
      className="@container relative mx-auto aspect-square w-full max-w-[21rem]"
    >
      <div
        className={`grid size-full gap-[2cqw] [clip-path:circle(50%)] ${quarters ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2'}`}
      >
        {segments.map(({ href, Icon: SegmentIcon, label, primary }, i) => (
          <Link
            key={href}
            href={href}
            onClick={onOpen}
            className={`flex items-center justify-center gap-[1cqw] text-center font-bold leading-tight transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${quarters ? QUARTER[i] : `flex-col ${HALF[i]}`} ${primary ? 'glass-accent text-on-accent' : 'glass text-ink'}`}
          >
            <SegmentIcon className="size-[14cqw]" />
            <span className="text-[max(5.6cqw,0.95rem)]">{label}</span>
          </Link>
        ))}
      </div>
      {/* The full verdict sits under the ring as the card's heading, so screen readers skip this copy. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-[29%] flex flex-col items-center justify-center gap-[0.5cqw] rounded-full border-2 text-center font-bold leading-tight shadow-[0_0_0_2cqw_var(--color-bg)] ${card} ${text}`}
      >
        <Icon className="size-[12cqw]" />
        <span className="px-[3cqw] text-[4.6cqw]">{BAND_LABEL[band].short}</span>
      </div>
    </nav>
  );
}

/*
 * The card in front of her: the time, her buttons as a ring around the verdict, then the verdict in full,
 * the scam type and Sam's status. Nothing to read past and no scrolling at Standard text.
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
  const segments: Segment[] = [
    ...(warning
      ? [
          { href: `${base}/sam`, Icon: Phone, label: `Get ${contact}`, primary: true },
          { href: `${base}/help`, Icon: ListChecks, label: 'What to do', primary: true },
        ]
      : []),
    { href: `${base}/said`, Icon: Quote, label: 'Their words' },
    { href: `${base}/read`, Icon: Speaker, label: 'Read aloud' },
  ];

  // Entrances move but never fade: if a browser stops drawing frames, the card must still be readable.
  return (
    <div className="space-y-2.5">
      <div
        key={call.id}
        className="space-y-2.5 transition-transform duration-300 ease-out starting:translate-y-3 motion-reduce:transition-none"
      >
        <p className="text-center font-semibold text-ink-2 tabular-nums">
          {when(call.createdAt)}
          {call.source === 'voice_note' && ' · Your voice note'}
        </p>
        <ActionRing band={analysis.band} segments={segments} onOpen={onOpen} />
        <Card tone={analysis.band} aria-labelledby={titleId} className="space-y-2 p-4!">
          <h2 id={titleId}>
            <BandBadge band={analysis.band} className="text-[clamp(1.25rem,6vw,1.5rem)]" />
          </h2>
          {warning && (
            <p className={`font-semibold ${BAND_TONE[analysis.band].text}`}>
              {FAMILY_LABEL[analysis.family]}
            </p>
          )}
          {warning ? (
            <p
              aria-live="polite"
              className={`flex items-start gap-3 rounded-chip border px-4 py-1.5 font-bold ${box}`}
            >
              <Icon className="mt-1 size-[1.1em]" />
              {SAM_LINE[sam](contact)}
            </p>
          ) : (
            <p>{reassurance(call)}</p>
          )}
        </Card>
      </div>

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
