'use client';
import Link from 'next/link';
import { BAND_TONE, BandBadge, Card } from '@/components/ui/band';
import type { Phone } from '@/components/ui/icons';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';

/*
 * Theme trial (temporary): the tile layout of the Alerts card, fed the same facts and links as CallFace's ring.
 * Once a colourway is picked, this replaces the ring and the trial wiring goes.
 */
export type Segment = { href: string; Icon: typeof Phone; label: string; primary?: boolean };
export type Face = {
  call: CallView;
  time: string;
  warning: boolean;
  segments: Segment[];
  onOpen: () => void;
  titleId: string;
  status: string;
  statusBox: string;
  StatusIcon: typeof Phone;
};

// Warnings are a solid band with light text so they read as urgent; a green result stays a quiet tint.
const SOLID = {
  strong: 'border-danger bg-danger text-surface',
  some: 'border-caution bg-caution text-surface',
} as const;

// A verdict banner over chunky tiles, two by two.
export function TileFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  const { Icon } = BAND_TONE[band];
  return (
    <div className="space-y-4">
      {band === 'none' ? (
        <Card tone={band} aria-labelledby={f.titleId} className="space-y-2 rounded-sheet! p-5!">
          <p className="font-semibold text-ink-2 tabular-nums">{f.time}</p>
          <h2 id={f.titleId}>
            <BandBadge band={band} />
          </h2>
        </Card>
      ) : (
        <article
          aria-labelledby={f.titleId}
          className={`space-y-1.5 rounded-sheet border p-5 ${SOLID[band]}`}
        >
          <p className="font-semibold tabular-nums opacity-90">{f.time}</p>
          <h2
            id={f.titleId}
            className="flex items-start gap-3 text-[clamp(1.5rem,7.5vw,1.875rem)] font-bold leading-snug"
          >
            <Icon className="mt-0.5 size-[1.25em] shrink-0" />
            {BAND_LABEL[band].title}
          </h2>
          <p className="font-semibold">{FAMILY_LABEL[family]}</p>
        </article>
      )}
      <nav aria-label="What you can do" className="grid grid-cols-2 gap-3">
        {f.segments.map(({ href, Icon: I, label, primary }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-card p-3 text-center text-xl font-bold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${primary ? 'glass-accent text-on-accent' : 'glass text-ink'}`}
          >
            <I className="size-12" />
            {label}
          </Link>
        ))}
      </nav>
      {f.warning && (
        <p
          aria-live="polite"
          className={`flex items-start gap-3 rounded-chip border px-4 py-2 font-bold ${f.statusBox}`}
        >
          <f.StatusIcon className="mt-1 size-[1.1em] shrink-0" />
          {f.status}
        </p>
      )}
    </div>
  );
}
