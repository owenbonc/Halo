'use client';
import { AlertRow } from '@/components/caregiver/AlertRow';
import { LargeTitle, PollStatus, useAlerts } from '@/components/caregiver/Shell';
import { Card } from '@/components/ui/band';

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
                <AlertRow key={a.id} alert={a} />
              ))}
            </ul>
          </section>
        ))}
    </section>
  );
}
