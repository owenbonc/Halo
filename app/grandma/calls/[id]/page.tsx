'use client';
import { useParams } from 'next/navigation';
import { CallCard } from '@/components/grandma/CallCard';
import { CallDock } from '@/components/grandma/CallDock';
import { TopBar } from '@/components/grandma/TopBar';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

// One past call, opened from the history list on /grandma.
export default function CallPage() {
  const { id } = useParams<{ id: string }>();
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const call = calls.data?.find((c) => c.id === id);

  return (
    <section className="space-y-10">
      <TopBar title="Call" link={{ href: '/grandma', label: 'Your calls' }} />
      {calls.error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your calls right now. We'll keep trying.
        </p>
      )}
      {!calls.data && !calls.error && <p role="status">Opening the call…</p>}
      {calls.data && !call && <p>This call is no longer in your list.</p>}
      {call && (
        <>
          <CallCard call={call} />
          <div aria-hidden="true" className={call.analysis.band === 'none' ? 'h-16' : 'h-64'} />
          <CallDock
            call={call}
            contact={settings.data?.contact.name ?? 'your person'}
            paused={settings.data?.paused ?? false}
          />
        </>
      )}
    </section>
  );
}
