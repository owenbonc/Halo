'use client';
import { useState } from 'react';
import { AlertRow } from '@/components/caregiver/AlertRow';
import { AlertSound } from '@/components/caregiver/AlertSound';
import { BandLine } from '@/components/caregiver/BandLine';
import { PollStatus, useAlerts } from '@/components/caregiver/Shell';
import { when } from '@/components/loved-one/CallCard';
import { TopBar } from '@/components/loved-one/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { Check, Phone } from '@/components/ui/icons';
import { ABOVE_TAB_BAR } from '@/components/ui/TabBar';
import { FAMILY_LABEL } from '@/lib/labels';

const HOUR = 60 * 60_000;
const ENTER = 'transition-transform duration-200 ease-out motion-reduce:transition-none';

export default function AlertsPage() {
  const alerts = useAlerts();
  // Acknowledged here: shown as done straight away, before the next poll confirms it.
  const [done, setDone] = useState<ReadonlySet<string>>(new Set());
  const [ack, setAck] = useState<{ id: string; failed: boolean } | null>(null);

  // Newest first: the top one is the card, the rest are listed under it.
  const waiting = alerts.data?.filter((a) => a.status !== 'acknowledged' && !done.has(a.id)) ?? [];
  const [open, ...earlier] = waiting;
  const latest = alerts.data?.[0];
  // The confirmation stays for an hour; after that the screen is calm again.
  const called =
    !open &&
    latest &&
    (done.has(latest.id) ||
      (latest.status === 'acknowledged' && Date.now() - Date.parse(latest.createdAt) < HOUR))
      ? latest
      : null;
  const sending = !!open && ack?.id === open.id && !ack.failed;

  // One call covers every alert still waiting, so they're all acknowledged together.
  const call = async (id: string, ids: string[]) => {
    setAck({ id, failed: false });
    const sent = await Promise.all(
      ids.map(async (each) => {
        const res = await fetch(`/api/alerts/${each}/ack`, { method: 'POST' }).catch(() => null);
        return res?.ok ? each : null;
      }),
    );
    const ok = sent.filter((each) => each !== null);
    setDone((prev) => new Set([...prev, ...ok]));
    // The tab badge counts from the poll, so fetch now rather than leave it stale until the next tick.
    alerts.refresh();
    setAck(ok.length === ids.length ? null : { id, failed: true });
  };

  return (
    <section className={`space-y-4 ${open ? 'pb-20' : ''}`}>
      <TopBar title="Alerts" />
      <PollStatus alerts={alerts} loading="Checking for alerts…" />
      <AlertSound />
      <div aria-live="polite">
        {open ? (
          <Card
            key={open.id}
            tone={open.band}
            className={`space-y-3 ${ENTER} starting:translate-y-3`}
          >
            <BandLine band={open.band} className="text-[0.9375rem]" />
            <h2 className="text-[1.625rem] leading-tight font-bold tracking-[-0.02em]">
              {open.elderName} got a call that looks like a scam. Please call {open.elderName}.
            </h2>
            <p className="text-[0.9375rem]">
              <span className="font-semibold">{FAMILY_LABEL[open.family]}</span>
              <span className="text-ink-2 tabular-nums">
                {' · '}
                <span className="whitespace-nowrap">{when(open.createdAt)}</span>
              </span>
            </p>
            {open.summary && <p>{open.summary}</p>}
            {open.status === 'escalated' && (
              <p className="rounded-chip border border-inset-line bg-inset px-3 py-2 text-[0.9375rem] font-semibold">
                You haven’t contacted {open.elderName} yet.
              </p>
            )}
          </Card>
        ) : called ? (
          <Card key={called.id} className={`space-y-1 ${ENTER} starting:translate-y-3`}>
            <h2 className="flex items-center gap-2 text-[1.0625rem] font-bold">
              <Check className="size-5 text-accent-ink" />
              You told {called.elderName} you’re calling.
            </h2>
            <p className="text-[0.9375rem] text-ink-2">
              {called.elderName}’s phone now says you’re calling. Alert from{' '}
              {when(called.createdAt)}.
            </p>
          </Card>
        ) : (
          alerts.data && (
            <Card className="space-y-1">
              <h2 className="text-[1.0625rem] font-bold">No alerts right now</h2>
              <p className="text-[0.9375rem] text-ink-2">
                If a call looks like a scam, you’ll see it here straight away.
              </p>
            </Card>
          )
        )}
      </div>

      {open && earlier.length > 0 && (
        <section aria-labelledby="earlier-alerts" className="pt-2">
          <h2
            id="earlier-alerts"
            className="mb-2 px-1 font-sans text-[0.8125rem] font-semibold tracking-normal text-ink-2"
          >
            Earlier alerts · <span className="tabular-nums">{earlier.length}</span>
          </h2>
          <ul className="divide-y divide-line rounded-card border border-line bg-surface">
            {earlier.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </ul>
          <p className="mt-2 px-1 text-[0.9375rem] text-ink-2">One call covers these too.</p>
        </section>
      )}

      {open && (
        // Floats above the tab bar so the one action that matters stays in thumb reach.
        <div
          className={`fixed inset-x-0 z-20 mx-auto max-w-md space-y-2 px-4 ${ABOVE_TAB_BAR} ${ENTER} starting:translate-y-4`}
        >
          {ack?.id === open.id && ack.failed && (
            <p
              role="alert"
              className="rounded-chip bg-danger-soft px-4 py-2 text-[0.9375rem] font-semibold text-danger shadow-float"
            >
              That didn’t send. Check your connection and try again.
            </p>
          )}
          <Button
            size="md"
            disabled={sending}
            onClick={() =>
              call(
                open.id,
                waiting.map((a) => a.id),
              )
            }
          >
            <Phone className="size-5" />
            {sending ? 'Sending…' : `I’m calling ${open.elderName} now`}
          </Button>
        </div>
      )}
    </section>
  );
}
