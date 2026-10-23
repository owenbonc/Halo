'use client';
import Link from 'next/link';
import { CallCard } from '@/components/grandma/CallCard';
import { VoiceNote } from '@/components/grandma/VoiceNote';
import { Card } from '@/components/ui/band';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

export default function GrandmaPage() {
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const contact = settings.data?.contact.name ?? 'your person';
  const latest = calls.data?.[0];

  return (
    <section className="space-y-10">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold">Your calls</h1>
        <Link href="/grandma/setup" className="text-lg font-semibold text-accent underline">
          Settings
        </Link>
      </header>
      {calls.error && (
        <p role="alert" className="font-semibold text-danger">
          {calls.error}
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
      <Link href="/?switch" className="block text-lg text-ink-soft underline">
        Switch role
      </Link>
    </section>
  );
}
