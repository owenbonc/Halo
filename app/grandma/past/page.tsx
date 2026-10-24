'use client';
import { useState } from 'react';
import { CallRow } from '@/components/grandma/CallCard';
import { useGrandma } from '@/components/grandma/GrandmaData';
import { TopBar } from '@/components/grandma/TopBar';
import { Card } from '@/components/ui/band';
import type { CallView } from '@/lib/types';

const FILTERS: { id: string; label: string; keep: (c: CallView) => boolean }[] = [
  { id: 'all', label: 'All', keep: () => true },
  { id: 'strong', label: 'Strong warnings', keep: (c) => c.analysis.band === 'strong' },
  { id: 'some', label: 'Some warnings', keep: (c) => c.analysis.band === 'some' },
  { id: 'none', label: 'No warning signs', keep: (c) => c.analysis.band === 'none' },
  { id: 'voice', label: 'Voice notes', keep: (c) => c.source === 'voice_note' },
];

// The Past calls tab: the backlog of calls she has dealt with, and green calls she has opened, newest first.
export default function PastCallsPage() {
  const { past, calls, error } = useGrandma();
  const [filter, setFilter] = useState('all');
  const shown = past.filter(FILTERS.find((f) => f.id === filter)?.keep ?? (() => true));

  return (
    <section className="space-y-8">
      <TopBar title="Past calls" count={past.length} />
      {error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your calls right now. We'll keep trying.
        </p>
      )}
      {!calls && !error && <p role="status">Opening your calls…</p>}

      {past.length > 0 && (
        <fieldset className="flex min-w-0 flex-wrap gap-2">
          <legend className="sr-only">Show</legend>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-12 rounded-full px-4 font-semibold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${filter === f.id ? 'glass-accent text-on-accent' : 'glass text-ink-2'}`}
            >
              {f.label}
            </button>
          ))}
        </fieldset>
      )}

      {calls && shown.length === 0 && (
        <Card className="space-y-2">
          <h2 className="text-2xl font-bold">
            {past.length === 0 ? 'Nothing here yet' : 'None of these'}
          </h2>
          <p>
            {past.length === 0
              ? "When you've dealt with a call, it moves here so you can look back at it."
              : 'Try another filter, or All.'}
          </p>
        </Card>
      )}

      <ul className="space-y-3">
        {shown.map((call) => (
          <CallRow key={call.id} call={call} isNew={false} />
        ))}
      </ul>

      {/* Room to scroll clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
  );
}
