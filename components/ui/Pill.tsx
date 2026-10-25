import type { ComponentProps } from 'react';
import type { Band } from '@/lib/types';
import { BAND_TONE } from './band';

const TONE = {
  neutral: 'border-inset-line bg-inset text-ink-2',
  accent: 'border-accent-ink/30 bg-accent-soft text-accent-ink',
};
// md: the loved one's size. sm: iPhone density, for the caregiver.
const SIZE = {
  md: 'min-h-10 items-center gap-2 rounded-[1.25rem] border px-4 py-1',
  sm: 'min-h-7 items-center gap-1.5 rounded-[0.875rem] border px-2.5 py-0.5 text-[0.8125rem]',
};

// A small rounded label for one fact (caller, time, scam type, status). Not a button.
// Radius is half the one-line height, so it is a true pill on one line and still tidy when it wraps.
export function Pill({
  tone = 'neutral',
  size = 'md',
  className = '',
  ...props
}: ComponentProps<'span'> & { tone?: keyof typeof TONE | Band; size?: keyof typeof SIZE }) {
  const colours =
    tone === 'neutral' || tone === 'accent'
      ? TONE[tone]
      : `border-current bg-inset ${BAND_TONE[tone].text}`;
  return (
    <span
      {...props}
      className={`inline-flex ${SIZE[size]} font-semibold leading-tight ${colours} ${className}`}
    />
  );
}
