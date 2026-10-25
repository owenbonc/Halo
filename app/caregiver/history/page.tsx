'use client';
import { AlertRow } from '@/components/caregiver/AlertRow';
import { PollStatus, useAlerts } from '@/components/caregiver/Shell';
import { TopBar } from '@/components/loved-one/TopBar';
import { Card } from '@/components/ui/band';

export default function HistoryPage() {
  const alerts = useAlerts();
  const all = alerts.data ?? [];

  return (
    <section className="space-y-4">
      <TopBar title="History" count={all.length} />
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
          // One grouped list, like an iOS inset list: the Card look with a hairline between rows.
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {all.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </ul>
        ))}
    </section>
  );
}
