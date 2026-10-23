'use client';
import { useParams } from 'next/navigation';
import { CallCard } from '@/components/grandma/CallCard';
import { CallDock } from '@/components/grandma/CallDock';
import { useGrandma } from '@/components/grandma/GrandmaData';
import { TopBar } from '@/components/grandma/TopBar';

// One call, opened from New or Past calls.
export default function CallPage() {
  const { id } = useParams<{ id: string }>();
  const { calls, error, done, contact, paused } = useGrandma();
  const call = calls?.find((c) => c.id === id);

  return (
    <section className="space-y-10">
      <TopBar title="Call" link={{ href: '/grandma/past', label: 'Past calls' }} />
      {error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your calls right now. We'll keep trying.
        </p>
      )}
      {!calls && !error && <p role="status">Opening the call…</p>}
      {calls && !call && <p>This call is no longer in your list.</p>}
      {call && (
        <>
          <CallCard call={call} done={done.includes(call.id)} />
          <div aria-hidden="true" className={call.analysis.band === 'none' ? 'h-44' : 'h-80'} />
          <CallDock call={call} contact={contact} paused={paused} />
        </>
      )}
    </section>
  );
}
