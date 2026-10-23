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
export function BandBadge({
  band,
  className = 'text-[clamp(1.5rem,7.5vw,1.875rem)]',
}: {
  band: Band;
  className?: string;
}) {
  const { text, Icon } = BAND_TONE[band];
  // The green title carries a caveat sentence; it stays visible but reads as a second line.
  const [headline, ...caveat] = BAND_LABEL[band].title.split('. ');
  return (
    <span className={`flex items-start gap-3 font-bold leading-snug ${text} ${className}`}>
      <Icon className="mt-0.5 size-[1.25em]" />
      <span className="min-w-0 break-words">
        {caveat.length > 0 ? `${headline}.` : headline}
        {caveat.length > 0 && (
          <span className="mt-1 block text-[0.7em] font-semibold">{caveat.join('. ')}</span>
        )}
      </span>
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
      className={`rounded-card border p-5 ${tone ? BAND_TONE[tone].card : 'border-line bg-surface'} ${className}`}
    />
  );
}
