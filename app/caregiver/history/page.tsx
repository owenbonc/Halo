'use client';
import { BandLine } from '@/components/caregiver/BandLine';
import { LargeTitle, PollStatus, useAlerts } from '@/components/caregiver/Shell';
import { when } from '@/components/loved-one/CallCard';
import { Card } from '@/components/ui/band';
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

export default function HistoryPage() {
  const alerts = useAlerts();
  const all = alerts.data ?? [];

  return (
    <section>
      <LargeTitle>History</LargeTitle>
      <PollStatus alerts={alerts} loading="Loading your alerts…" />
      {alerts.data &&
        (all.length === 0 ? (
          <Card className="space-y-1">
            <h2 className="text-[1.0625rem] font-bold">No alerts yet</h2>
            <p className="text-[0.9375rem] text-ink-2">
              Every alert you get is kept here, newest first.
            </p>
          </Card>
        ) : (
          <section aria-labelledby="all-alerts">
            <h2
              id="all-alerts"
              className="mb-2 px-1 font-sans text-[0.8125rem] font-semibold tracking-normal text-ink-2"
            >
              Alerts · <span className="tabular-nums">{all.length}</span>
            </h2>
            {/* One grouped list, like an iOS inset list: the Card look with a hairline between rows. */}
            <ul className="divide-y divide-line rounded-card border border-line bg-surface">
              {all.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <BandLine band={a.band} className="text-[0.8125rem]" />
                    <p className="font-semibold leading-snug break-words">
                      {FAMILY_LABEL[a.family]}
                    </p>
                    <p className="text-[0.8125rem] text-ink-2 tabular-nums">{when(a.createdAt)}</p>
                  </div>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </section>
  );
}
