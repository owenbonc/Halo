'use client';
import { CallRow } from '@/components/loved-one/CallCard';
import { useLovedOne } from '@/components/loved-one/LovedOneData';
import { useOpened } from '@/components/loved-one/prefs';
import { TopBar } from '@/components/loved-one/TopBar';
import { VoiceNote } from '@/components/loved-one/VoiceNote';
import { Card } from '@/components/ui/band';

// Other calls: every warning call she hasn't dealt with yet, most important first.
export default function OtherCallsPage() {
  const { others, calls, error } = useLovedOne();
  const opened = useOpened();

  return (
    <section className="space-y-8">
      <TopBar title="Other calls" count={others.length} back />
      {error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your calls right now. We'll keep trying.
        </p>
      )}
      {!calls && !error && <p role="status">Opening your calls…</p>}
      {calls && others.length === 0 && (
        <Card className="space-y-2">
          <h2 className="text-2xl font-bold">No worrying calls waiting</h2>
          <p>Calls you've dealt with are in Past calls.</p>
        </Card>
      )}
      <ul className="space-y-3">
        {others.map((call) => (
          <CallRow key={call.id} call={call} isNew={!opened.includes(call.id)} />
        ))}
      </ul>
      <VoiceNote />
      {/* Room to scroll the last item clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
  );
}
