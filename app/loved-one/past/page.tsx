'use client';
import { useState } from 'react';
import { CallRow } from '@/components/loved-one/CallCard';
import { useLovedOne } from '@/components/loved-one/LovedOneData';
import { TopBar } from '@/components/loved-one/TopBar';
import { Card } from '@/components/ui/band';
import type { CallView } from '@/lib/types';

const FILTERS: {
  id: string;
  label: string;
  keep: (c: CallView, done: string[]) => boolean;
}[] = [
  { id: 'all', label: 'All', keep: () => true },
  {
    id: 'waiting',
    label: 'Not dealt with',
    keep: (c, done) => c.analysis.band !== 'none' && !done.includes(c.id),
  },
  { id: 'strong', label: 'Strong warnings', keep: (c) => c.analysis.band === 'strong' },
  { id: 'some', label: 'Some warnings', keep: (c) => c.analysis.band === 'some' },
  { id: 'none', label: 'No warning signs', keep: (c) => c.analysis.band === 'none' },
  { id: 'voice', label: 'Voice notes', keep: (c) => c.source === 'voice_note' },
];

// The Past calls tab: every call, newest first, each warning call marked dealt with or not.
export default function PastCallsPage() {
  const { calls, done, error } = useLovedOne();
  const [filter, setFilter] = useState('all');
  const past = calls ?? [];
  const keep = FILTERS.find((f) => f.id === filter)?.keep ?? (() => true);
  const shown = past.filter((c) => keep(c, done));

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
        // One row that scrolls sideways, so the filters never push the calls down the screen.
        <fieldset className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <legend className="sr-only">Show</legend>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-12 shrink-0 whitespace-nowrap rounded-full px-4 font-semibold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] ${filter === f.id ? 'accent-outline text-on-accent' : 'glass text-ink-2'}`}
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
              ? 'Every call we answer for you is kept here, so you can look back at it.'
              : 'Try another filter, or All.'}
          </p>
        </Card>
      )}

      {/* One grouped list, like the caregiver's History: a card with a hairline between calls. */}
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {shown.map((call) => (
          <CallRow key={call.id} call={call} isNew={false} dealt={done.includes(call.id)} />
        ))}
      </ul>

      {/* Room to scroll clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
  );
}
