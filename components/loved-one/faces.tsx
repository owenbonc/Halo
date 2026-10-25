'use client';
import Link from 'next/link';
import { BAND_TONE, BandBadge, Card } from '@/components/ui/band';
import { ArrowRight, type Phone } from '@/components/ui/icons';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import type { CallView } from '@/lib/types';

/*
 * Theme trial (temporary): one layout of the Alerts card per direction, all fed the same facts and links by
 * CallFace. The losers are deleted after the pick, and the winner replaces CallFace's own layout.
 */
export type Segment = { href: string; Icon: typeof Phone; label: string; primary?: boolean };
export type Face = {
  call: CallView;
  time: string;
  warning: boolean;
  segments: Segment[];
  onOpen: () => void;
  titleId: string;
  reassurance: string;
  status: string;
  statusBox: string;
  StatusIcon: typeof Phone;
};

const press = 'transition-[transform,background-color] duration-100 ease-out active:scale-[0.97]';

function Status({ f, className = '' }: { f: Face; className?: string }) {
  return (
    <p
      aria-live="polite"
      className={`flex items-start gap-3 rounded-chip border px-4 py-2 font-bold ${f.statusBox} ${className}`}
    >
      <f.StatusIcon className="mt-1 size-[1.1em] shrink-0" />
      {f.status}
    </p>
  );
}

const headline = (f: Face) => BAND_LABEL[f.call.analysis.band].title.split('. ')[0] ?? '';

// Liberty print: a note to her. The verdict is a sentence; two big stacked buttons, the rest quieter.
export function NoteFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  const { text, Icon } = BAND_TONE[band];
  const primary = f.segments.filter((s) => s.primary);
  const rest = f.segments.filter((s) => !s.primary);
  return (
    <div className="space-y-4">
      <Card tone={band} aria-labelledby={f.titleId} className="space-y-3 p-6!">
        <p className="font-semibold text-ink-2 tabular-nums">{f.time}</p>
        <h2 id={f.titleId} className={`flex items-start gap-3 text-[2.1rem] ${text}`}>
          <Icon className="mt-1 size-9 shrink-0" />
          {f.warning ? `This call has ${headline(f).toLowerCase()}.` : `${headline(f)}.`}
        </h2>
        {f.warning ? (
          <p className="text-2xl font-semibold">{FAMILY_LABEL[family]}</p>
        ) : (
          <p className="font-semibold">This is not a guarantee.</p>
        )}
        {f.warning && <Status f={f} />}
      </Card>
      {primary.map(({ href, Icon: I, label }) => (
        <Link
          key={href}
          href={href}
          onClick={f.onOpen}
          className={`glass-accent flex min-h-18 items-center gap-4 rounded-control px-6 text-2xl font-bold text-on-accent ${press}`}
        >
          <I className="size-8" />
          {label}
        </Link>
      ))}
      <div className="flex gap-3">
        {rest.map(({ href, Icon: I, label }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className={`glass flex min-h-14 grow basis-0 items-center justify-center gap-2 rounded-control px-3 font-bold text-ink ${press}`}
          >
            <I className="size-6" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Cornishware: a rounded verdict banner over chunky kitchen tiles, two by two.
export function TileFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  return (
    <div className="space-y-4">
      <Card tone={band} aria-labelledby={f.titleId} className="space-y-2 rounded-sheet! p-5!">
        <p className="font-semibold text-ink-2 tabular-nums">{f.time}</p>
        <h2 id={f.titleId}>
          <BandBadge band={band} />
        </h2>
        {f.warning && <p className="font-semibold">{FAMILY_LABEL[family]}</p>}
      </Card>
      <nav aria-label="What you can do" className="grid grid-cols-2 gap-3">
        {f.segments.map(({ href, Icon: I, label, primary }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className={`flex aspect-square flex-col items-center justify-center gap-3 rounded-card p-3 text-center text-xl font-bold ${press} ${primary ? 'glass-accent text-on-accent' : 'glass text-ink'}`}
          >
            <I className="size-12" />
            {label}
          </Link>
        ))}
      </nav>
      {f.warning && <Status f={f} />}
    </div>
  );
}

// Departure board: a band strip with the time, then one full-width row per action, ruled like a board.
export function BoardFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  const { Icon } = BAND_TONE[band];
  const strip = { strong: 'bg-danger', some: 'bg-caution', none: 'bg-clear' }[band];
  return (
    <div className="space-y-4">
      <article
        aria-labelledby={f.titleId}
        className="overflow-hidden rounded-card border border-line-strong bg-surface"
      >
        <div className={`flex items-center justify-between gap-3 px-4 py-3 text-surface ${strip}`}>
          <h2 id={f.titleId} className="flex items-center gap-2 text-2xl font-bold">
            <Icon className="size-7" />
            {BAND_LABEL[band].circle}
          </h2>
          <span className="font-display text-2xl font-bold tabular-nums">
            {new Date(f.call.createdAt).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <dl className="divide-y divide-line">
          <div className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3">
            <dt className="text-base font-semibold text-ink-2 uppercase tracking-wide">Call</dt>
            <dd className="font-semibold">
              {f.warning ? FAMILY_LABEL[family] : BAND_LABEL[band].title}
            </dd>
          </div>
          {f.warning && (
            <div className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3">
              <dt className="text-base font-semibold text-ink-2 uppercase tracking-wide">Status</dt>
              <dd aria-live="polite" className="font-bold">
                {f.status}
              </dd>
            </div>
          )}
        </dl>
      </article>
      <nav
        aria-label="What you can do"
        className="divide-y divide-line overflow-hidden rounded-card border border-line-strong bg-surface"
      >
        {f.segments.map(({ href, Icon: I, label, primary }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className={`flex min-h-16 items-center gap-4 px-4 text-xl font-bold transition-colors duration-100 ${primary ? 'bg-accent text-on-accent' : 'text-ink active:bg-surface-2'}`}
          >
            <I className="size-7" />
            <span className="grow">{label}</span>
            <ArrowRight className="size-6" />
          </Link>
        ))}
      </nav>
    </div>
  );
}

// Conversation: Halo tells her what happened in messages, and her choices are the replies.
export function ChatFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  const { text } = BAND_TONE[band];
  const bubble = 'max-w-[88%] rounded-card rounded-bl-chip px-5 py-3';
  return (
    <div className="space-y-3">
      <p className="text-center text-base font-semibold text-ink-2 tabular-nums">{f.time}</p>
      <section aria-labelledby={f.titleId} className="space-y-2">
        <p className={`${bubble} border border-line bg-surface`}>{f.reassurance}</p>
        <div className={`${bubble} space-y-1 border ${BAND_TONE[band].card}`}>
          <h2 id={f.titleId} className="text-2xl">
            <BandBadge band={band} className="text-2xl" />
          </h2>
          {f.warning && <p className={`font-semibold ${text}`}>{FAMILY_LABEL[family]}</p>}
        </div>
        {f.warning && (
          <p aria-live="polite" className={`${bubble} border border-line bg-surface font-bold`}>
            {f.status}
          </p>
        )}
      </section>
      <nav aria-label="What you can do" className="flex flex-col items-end gap-2 pt-2">
        {f.segments.map(({ href, Icon: I, label, primary }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className={`flex min-h-14 items-center gap-3 rounded-card rounded-br-chip px-5 text-xl font-bold ${press} ${primary ? 'glass-accent text-on-accent' : 'glass text-ink'}`}
          >
            <I className="size-6" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// Big and bold: the verdict at poster size, one giant button for the thing that matters, the rest small.
export function BoldFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  const { text, Icon } = BAND_TONE[band];
  const [first, ...others] = f.segments;
  if (!first) return null;
  return (
    <div className="space-y-4">
      <section aria-labelledby={f.titleId} className="space-y-2 pt-2">
        <p className="font-semibold text-ink-2 tabular-nums">{f.time}</p>
        <Icon className={`size-14 ${text}`} />
        <h2 id={f.titleId} className={`text-[2.75rem] leading-[1.05] ${text}`}>
          {headline(f)}.
        </h2>
        <p className="text-2xl font-semibold">
          {f.warning ? FAMILY_LABEL[family] : 'This is not a guarantee.'}
        </p>
      </section>
      {f.warning && <Status f={f} />}
      <Link
        href={first.href}
        onClick={f.onOpen}
        className={`flex min-h-24 items-center justify-center gap-4 rounded-sheet text-3xl font-bold ${press} ${first.primary ? 'glass-accent text-on-accent' : 'glass text-ink'}`}
      >
        <first.Icon className="size-10" />
        {first.label}
      </Link>
      <nav aria-label="More you can do" className="grid grid-flow-col auto-cols-fr gap-2">
        {others.map(({ href, Icon: I, label }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className={`glass flex min-h-20 flex-col items-center justify-center gap-1 rounded-card px-1 text-center text-base font-bold text-ink ${press}`}
          >
            <I className="size-7" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

// iOS standard: a notification-style summary, then a grouped list of rows with chevrons.
export function ListFace({ f }: { f: Face }) {
  const { band, family } = f.call.analysis;
  return (
    <div className="space-y-5">
      <Card tone={band} aria-labelledby={f.titleId} className="space-y-1 p-4!">
        <p className="flex justify-between text-base font-semibold text-ink-2">
          <span>Halo</span>
          <span className="tabular-nums">{f.time}</span>
        </p>
        <h2 id={f.titleId}>
          <BandBadge band={band} className="text-2xl" />
        </h2>
        {f.warning && <p className="font-semibold">{FAMILY_LABEL[family]}</p>}
      </Card>
      <nav
        aria-label="What you can do"
        className="divide-y divide-line overflow-hidden rounded-card bg-surface"
      >
        {f.segments.map(({ href, Icon: I, label, primary }) => (
          <Link
            key={href}
            href={href}
            onClick={f.onOpen}
            className="flex min-h-15 items-center gap-4 px-4 text-xl transition-colors duration-100 active:bg-surface-2"
          >
            <span
              className={`flex size-9 items-center justify-center rounded-chip ${primary ? 'bg-accent text-on-accent' : 'bg-surface-2 text-ink'}`}
            >
              <I className="size-5" />
            </span>
            <span className={`grow ${primary ? 'font-bold' : 'font-semibold'}`}>{label}</span>
            <ArrowRight className="size-5 text-ink-3" />
          </Link>
        ))}
      </nav>
      {f.warning && <p className="px-4 text-lg font-semibold text-ink-2">{f.status}</p>}
    </div>
  );
}
