import type { ComponentProps } from 'react';
import type { Band } from '@/lib/types';
import { BAND_TONE } from './band';

const TONE = {
  neutral: 'border-inset-line bg-inset text-ink-2',
  accent: 'border-accent-ink/30 bg-accent-soft text-accent-ink',
};

// A small rounded label for one fact (caller, time, scam type, status). Not a button.
// Radius is half the one-line height, so it is a true pill on one line and still tidy when it wraps.
export function Pill({
  tone = 'neutral',
  className = '',
  ...props
}: ComponentProps<'span'> & { tone?: keyof typeof TONE | Band }) {
  const colours =
    tone === 'neutral' || tone === 'accent'
      ? TONE[tone]
      : `border-current bg-inset ${BAND_TONE[tone].text}`;
  return (
    <span
      {...props}
      className={`inline-flex min-h-10 items-center gap-2 rounded-[1.25rem] border px-4 py-1 font-semibold leading-tight ${colours} ${className}`}
    />
  );
}

// A panel that groups one chunk: white on a plain card, a deeper tint inside a warning card.
export function Panel({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={`space-y-3 rounded-card border border-inset-line bg-inset p-4 ${className}`}
    />
  );
}
