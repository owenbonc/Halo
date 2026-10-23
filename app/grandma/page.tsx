'use client';
import { CallCard, CallRow } from '@/components/grandma/CallCard';
import { CallDock } from '@/components/grandma/CallDock';
import { useGrandma } from '@/components/grandma/GrandmaData';
import { TopBar } from '@/components/grandma/TopBar';
import { VoiceNote } from '@/components/grandma/VoiceNote';
import { Card } from '@/components/ui/band';
import { Pill } from '@/components/ui/Pill';
import { BAND_LABEL } from '@/lib/labels';

// The New tab: calls she hasn't dealt with yet. The most urgent is open in full; the rest wait below it.
export default function NewCallsPage() {
  const { untouched, calls, error, contact, paused } = useGrandma();
  const [first, ...rest] = untouched;

  return (
    <section className="space-y-10">
      <TopBar title="New calls" count={untouched.length} />
      <p className="sr-only" aria-live="polite">
        {first ? `Newest call: ${BAND_LABEL[first.analysis.band].title}` : ''}
      </p>
      {error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your latest calls right now. We'll keep trying.
        </p>
      )}
      {!calls && !error && <p role="status">Checking for calls…</p>}

      {first ? (
        <CallCard key={first.id} call={first} done={false} />
      ) : (
        calls && (
          <Card className="space-y-2">
            <h2 className="text-2xl font-bold">You're all caught up</h2>
            <p>
              When a number you don't know rings, we'll answer it and tell you here what we found.
              Calls you've dealt with are in Past calls.
            </p>
          </Card>
        )
      )}

      {rest.length > 0 && (
        <section className="space-y-4" aria-labelledby="also-new">
          <div className="flex items-center justify-between gap-3">
            <h2 id="also-new" className="text-2xl font-bold">
              Also new
            </h2>
            <Pill className="tabular-nums">{rest.length}</Pill>
          </div>
          <ul className="space-y-3">
            {rest.map((call) => (
              <CallRow key={call.id} call={call} isNew />
            ))}
          </ul>
        </section>
      )}

      <VoiceNote />

      {/* Room to scroll the last item clear of the floating dock and tab bar. */}
      <div
        aria-hidden="true"
        className={!first ? 'h-24' : first.analysis.band === 'none' ? 'h-44' : 'h-80'}
      />
      {first && <CallDock call={first} contact={contact} paused={paused} />}
    </section>
  );
}
