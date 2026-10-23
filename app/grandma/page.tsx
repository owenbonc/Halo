'use client';
import Link from 'next/link';
import { CallCard } from '@/components/grandma/CallCard';
import { VoiceNote } from '@/components/grandma/VoiceNote';
import { Card } from '@/components/ui/band';
import { BAND_LABEL } from '@/lib/labels';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

export default function GrandmaPage() {
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const contact = settings.data?.contact.name ?? 'your person';
  const latest = calls.data?.[0];

  return (
    <section className="space-y-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Your calls</h1>
        <Link
          href="/grandma/setup"
          className="inline-flex min-h-12 items-center font-semibold text-accent underline"
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
      {latest ? (
        <CallCard
          key={latest.id}
          call={latest}
          contact={contact}
          paused={settings.data?.paused ?? false}
        />
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
      <Link href="/?switch" className="inline-flex min-h-12 items-center text-ink-soft underline">
        Switch role
      </Link>
    </section>
  );
}
