import type { ComponentProps } from 'react';
import { BAND_LABEL } from '@/lib/labels';
import type { Band } from '@/lib/types';
import { CircleCheck, OctagonAlert, TriangleAlert } from './icons';

export const BAND_TONE: Record<Band, { card: string; text: string; Icon: typeof CircleCheck }> = {
  strong: { card: 'border-danger bg-danger-soft', text: 'text-danger', Icon: OctagonAlert },
  some: { card: 'border-caution bg-caution-soft', text: 'text-caution', Icon: TriangleAlert },
  none: { card: 'border-clear bg-clear-soft', text: 'text-clear', Icon: CircleCheck },
};

// Colour is never the only signal: every band carries its icon and its words.
export function BandBadge({ band, className = 'text-2xl' }: { band: Band; className?: string }) {
  const { text, Icon } = BAND_TONE[band];
  return (
    <span className={`flex items-start gap-3 font-bold leading-snug ${text} ${className}`}>
      <Icon className="mt-0.5 size-[1.25em]" />
      <span>{BAND_LABEL[band].title}</span>
    </span>
  );
}

export function Card({
  tone,
  className = '',
  ...props
}: ComponentProps<'article'> & { tone?: Band }) {
  return (
    <article
      {...props}
      className={`rounded-2xl border-2 p-5 shadow-card ${tone ? BAND_TONE[tone].card : 'border-line bg-surface'} ${className}`}
    />
  );
}
