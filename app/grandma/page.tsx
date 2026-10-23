'use client';
import Link from 'next/link';
import { CallCard, when } from '@/components/grandma/CallCard';
import { VoiceNote } from '@/components/grandma/VoiceNote';
import { BandBadge, Card } from '@/components/ui/band';
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

  return (
    <section className="space-y-10">
      {/* Stays on screen as material; the card scrolls under it. */}
      <header className="material sticky top-0 z-10 -mx-4 flex items-center justify-between gap-4 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <h1 className="text-3xl font-bold">Your calls</h1>
        <Link
          href="/grandma/setup"
          className="inline-flex min-h-12 items-center rounded-full px-5 font-semibold glass text-ink"
        >
          Settings
        </Link>
      </header>
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
        <>
          <CallCard
            key={featured.id}
            call={featured}
            contact={contact}
            paused={settings.data?.paused ?? false}
          />
          {latest && latest !== featured && (
            <Card className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Pill>Newer call</Pill>
                <Pill className="tabular-nums">{when(latest.createdAt)}</Pill>
              </div>
              <BandBadge band={latest.analysis.band} className="text-xl" />
            </Card>
          )}
        </>
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
      <VoiceNote />
      <Link
        href="/?switch"
        className="inline-flex min-h-12 items-center rounded-full px-5 font-semibold glass text-ink-2"
      >
        Switch role
      </Link>
    </section>
  );
}
