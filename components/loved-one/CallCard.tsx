'use client';
import Link from 'next/link';
import { type ReactNode, useId } from 'react';
import { Button } from '@/components/ui/Button';
import { BAND_TONE, BandBadge, Card } from '@/components/ui/band';
import { Check, ListChecks, Phone, Quote, Speaker } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';
import { useLovedOne } from './LovedOneData';
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

type Tile = { href: string; Icon: typeof Phone; label: string; primary?: boolean };

// Warnings are a solid band with white text so they read as urgent; a green result stays a quiet tint.
const SOLID = {
  strong: 'border-danger bg-danger text-surface',
  some: 'border-caution bg-caution text-surface',
} as const;

/*
 * The card in front of her: the verdict as a banner, her buttons as big tiles two by two (Get Sam and What to do
 * in solid navy on a warning call), then Sam's status. Nothing to read past and no scrolling at Standard text.
 */
export function CallFace({ call, footer }: { call: CallView; footer?: ReactNode }) {
  const { contact, paused, done, open } = useLovedOne();
  const { band, family } = call.analysis;
  const sam = samState(call, paused);
  const { box, Icon: SamIcon } = SAM_STYLE[sam];
  const { Icon } = BAND_TONE[band];
  const base = `/loved-one/calls/${call.id}`;
  const titleId = useId();
  const time = `${when(call.createdAt)}${call.source === 'voice_note' ? ' · Your voice note' : ''}`;
  const tiles: Tile[] = [
    ...(band !== 'none'
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
        className="space-y-4 transition-transform duration-300 ease-out starting:translate-y-3 motion-reduce:transition-none"
      >
        {band === 'none' ? (
          <Card tone={band} aria-labelledby={titleId} className="space-y-2 rounded-sheet! p-5!">
            <p className="font-semibold text-ink-2 tabular-nums">{time}</p>
            <h2 id={titleId}>
              <BandBadge band={band} />
            </h2>
            <p>{reassurance(call)}</p>
          </Card>
        ) : (
          <article
            aria-labelledby={titleId}
            className={`space-y-1.5 rounded-sheet border p-5 ${SOLID[band]}`}
          >
            <p className="font-semibold tabular-nums opacity-90">{time}</p>
            <h2
              id={titleId}
              className="flex items-start gap-3 text-[clamp(1.5rem,7.5vw,1.875rem)] font-bold leading-snug"
            >
              <Icon className="mt-0.5 size-[1.25em] shrink-0" />
              {BAND_LABEL[band].title}
            </h2>
            <p className="font-semibold">{FAMILY_LABEL[family]}</p>
          </article>
        )}
        <nav aria-label="What you can do" className="grid grid-cols-2 gap-3">
          {tiles.map(({ href, Icon: TileIcon, label, primary }) => (
            <Link
              key={href}
              href={href}
              onClick={() => open(call.id)}
              className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-card p-3 text-center text-xl font-bold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${primary ? 'glass-accent text-on-accent' : 'glass text-ink'}`}
            >
              <TileIcon className="size-12" />
              {label}
            </Link>
          ))}
        </nav>
        {band !== 'none' && (
          <p
            aria-live="polite"
            className={`flex items-start gap-3 rounded-chip border px-4 py-2 font-bold ${box}`}
          >
            <SamIcon className="mt-1 size-[1.1em] shrink-0" />
            {SAM_LINE[sam](contact)}
          </p>
        )}
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
        href={`/loved-one/calls/${call.id}`}
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
