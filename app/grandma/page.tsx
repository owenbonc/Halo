'use client';
import Link from 'next/link';
import { CallCard, CallRow } from '@/components/grandma/CallCard';
import { CallDock } from '@/components/grandma/CallDock';
import { TopBar } from '@/components/grandma/TopBar';
import { VoiceNote } from '@/components/grandma/VoiceNote';
import { Card } from '@/components/ui/band';
import { Pill } from '@/components/ui/Pill';
import { BAND_LABEL } from '@/lib/labels';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

export default function GrandmaPage() {
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const contact = settings.data?.contact.name ?? 'your person';
  const latest = calls.data?.[0];
  // A warning stays on top until Sam has called back, so a later harmless call can't hide it.
  const featured =
    calls.data?.find(
      (c) =>
        c.analysis.band !== 'none' &&
        c.alert?.status !== 'acknowledged' &&
        Date.now() - Date.parse(c.createdAt) < 60 * 60_000,
    ) ?? latest;
  const earlier = calls.data?.filter((c) => c !== featured) ?? [];

  return (
    <section className="space-y-10">
      <TopBar title="Your calls" link={{ href: '/grandma/setup', label: 'Settings' }} />
      <p className="sr-only" aria-live="polite">
        {latest ? `Newest call: ${BAND_LABEL[latest.analysis.band].title}` : ''}
      </p>
      {calls.error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your latest calls right now. We'll keep trying.
        </p>
      )}
      {!calls.data && !calls.error && <p role="status">Checking for calls…</p>}
      {featured ? (
        <CallCard key={featured.id} call={featured} />
      ) : (
        calls.data && (
          <Card className="space-y-2">
            <h2 className="text-2xl font-bold">No calls checked yet</h2>
            <p>
              When a number you don't know rings, we'll answer it and tell you here what we found.
            </p>
          </Card>
        )
      )}

      {earlier.length > 0 && (
        <section className="space-y-4" aria-labelledby="earlier-calls">
          <div className="flex items-center justify-between gap-3">
            <h2 id="earlier-calls" className="text-2xl font-bold">
              Earlier calls
            </h2>
            <Pill className="tabular-nums">{earlier.length}</Pill>
          </div>
          <ul className="space-y-3">
            {earlier.map((call) => (
              <CallRow
                key={call.id}
                call={call}
                newer={!!featured && call.createdAt > featured.createdAt}
              />
            ))}
          </ul>
        </section>
      )}

      <VoiceNote />
      <Link
        href="/?switch"
        className="glass inline-flex min-h-12 items-center rounded-full px-5 font-semibold text-ink-2"
      >
        Switch role
      </Link>

      {featured && (
        <>
          {/* Room to scroll the last item clear of the floating dock. */}
          <div aria-hidden="true" className={featured.analysis.band === 'none' ? 'h-16' : 'h-64'} />
          <CallDock call={featured} contact={contact} paused={settings.data?.paused ?? false} />
        </>
      )}
    </section>
  );
}
