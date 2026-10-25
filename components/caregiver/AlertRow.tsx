import { BandLine } from '@/components/caregiver/BandLine';
import { when } from '@/components/loved-one/CallCard';
import { Check } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { FAMILY_LABEL } from '@/lib/labels';
import type { SamAlert } from '@/lib/types';

function StatusPill({ status }: { status: SamAlert['status'] }) {
  if (status === 'acknowledged')
    return (
      <Pill tone="accent" size="sm" className="shrink-0">
        <Check className="size-4" />
        You called
      </Pill>
    );
  return (
    <Pill size="sm" className="shrink-0">
      {status === 'escalated' ? 'Not answered' : 'Sent'}
    </Pill>
  );
}

// One row of an inset alert list: band, scam type, time and Sam's status.
export function AlertRow({ alert }: { alert: SamAlert }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-0.5">
        <BandLine band={alert.band} className="text-[0.8125rem]" />
        <p className="font-semibold leading-snug break-words">{FAMILY_LABEL[alert.family]}</p>
        <p className="text-[0.8125rem] text-ink-2 tabular-nums">{when(alert.createdAt)}</p>
      </div>
      <StatusPill status={alert.status} />
    </li>
  );
}
