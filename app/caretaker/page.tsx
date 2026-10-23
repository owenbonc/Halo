'use client';
import { useState } from 'react';
import { BandLine } from '@/components/caretaker/BandLine';
import { LargeTitle, PollStatus, useAlerts } from '@/components/caretaker/Shell';
import { when } from '@/components/grandma/CallCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { Check, Phone } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { ABOVE_TAB_BAR } from '@/components/ui/TabBar';
import { FAMILY_LABEL } from '@/lib/labels';

const HOUR = 60 * 60_000;
const ENTER = 'transition-transform duration-200 ease-out motion-reduce:transition-none';

export default function AlertsPage() {
  const alerts = useAlerts();
  // Acknowledged here: shown as done straight away, before the next poll confirms it.
  const [done, setDone] = useState<string | null>(null);
  const [ack, setAck] = useState<{ id: string; failed: boolean } | null>(null);

  const open = alerts.data?.find((a) => a.status !== 'acknowledged' && a.id !== done);
  const latest = alerts.data?.[0];
  // The confirmation stays for an hour, like Grandma's warning card; after that the screen is calm again.
  const called =
    !open &&
    latest &&
    (latest.id === done ||
      (latest.status === 'acknowledged' && Date.now() - Date.parse(latest.createdAt) < HOUR))
      ? latest
      : null;
  const sending = !!open && ack?.id === open.id && !ack.failed;

  const call = async (id: string) => {
    setAck({ id, failed: false });
    const res = await fetch(`/api/alerts/${id}/ack`, { method: 'POST' }).catch(() => null);
    if (res?.ok) {
      setDone(id);
      setAck(null);
    } else setAck({ id, failed: true });
  };

  return (
    <section className={open ? 'pb-14' : undefined}>
      <LargeTitle>Alerts</LargeTitle>
      <PollStatus alerts={alerts} loading="Checking for alerts…" />
      <div aria-live="polite">
        {open ? (
          <Card
            key={open.id}
            tone={open.band}
            className={`space-y-3 ${ENTER} starting:translate-y-3`}
          >
            <BandLine band={open.band} className="text-[0.9375rem]" />
            <h2 className="text-[1.375rem] leading-tight font-bold">
              {open.elderName} got a call that looks like a scam. Please call her.
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={open.band} size="sm">
                {FAMILY_LABEL[open.family]}
              </Pill>
              <Pill size="sm" className="tabular-nums">
                {when(open.createdAt)}
              </Pill>
            </div>
            {open.summary && <p>{open.summary}</p>}
            {open.status === 'escalated' && (
              <p className="rounded-chip border border-inset-line bg-inset px-3 py-2 text-[0.9375rem] font-semibold">
                {open.elderName} has been told you haven't replied yet.
              </p>
            )}
          </Card>
        ) : called ? (
          <Card key={called.id} className={`space-y-1 ${ENTER} starting:translate-y-3`}>
            <h2 className="flex items-center gap-2 text-[1.0625rem] font-bold">
              <Check className="size-5 text-accent-ink" />
              You told {called.elderName} you're calling.
            </h2>
            <p className="text-[0.9375rem] text-ink-2">
              Her phone now says you're calling her. Alert from {when(called.createdAt)}.
            </p>
          </Card>
        ) : (
          alerts.data && (
            <Card className="space-y-1">
              <h2 className="text-[1.0625rem] font-bold">No alerts right now</h2>
              <p className="text-[0.9375rem] text-ink-2">
                If a call to her looks like a scam, you'll see it here straight away.
              </p>
            </Card>
          )
        )}
      </div>

      {open && (
        // Floats above the tab bar so the one action that matters stays in thumb reach.
        <div
          className={`fixed inset-x-0 z-20 mx-auto max-w-md space-y-2 px-4 ${ABOVE_TAB_BAR.md} ${ENTER} starting:translate-y-4`}
        >
          {ack?.id === open.id && ack.failed && (
            <p
              role="alert"
              className="rounded-chip bg-danger-soft px-4 py-2 text-[0.9375rem] font-semibold text-danger shadow-float"
            >
              That didn't send. Check your connection and try again.
            </p>
          )}
          <Button size="md" disabled={sending} onClick={() => call(open.id)}>
            <Phone className="size-5" />
            {sending ? 'Sending…' : 'I’m calling her now'}
          </Button>
        </div>
      )}
    </section>
  );
}
