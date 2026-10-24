import { BAND_TONE } from '@/components/ui/band';
import { BAND_LABEL } from '@/lib/labels';
import type { Band } from '@/lib/types';

// BandBadge at iPhone size: the band's icon and its words in one line, the caveat kept for the green band.
export function BandLine({ band, className = '' }: { band: Band; className?: string }) {
  const { text, Icon } = BAND_TONE[band];
  return (
    <span className={`flex items-start gap-1.5 leading-snug font-semibold ${text} ${className}`}>
      <Icon className="mt-[0.1em] size-[1.2em]" />
      <span className="min-w-0 break-words">{BAND_LABEL[band].title}</span>
    </span>
  );
}
