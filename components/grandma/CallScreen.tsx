'use client';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import type { CallView } from '@/lib/types';
import { useGrandma } from './GrandmaData';
import { TopBar } from './TopBar';

// One screen about one call (/grandma/calls/[id]/…), always with a Back button.
export function CallScreen({
  title,
  children,
}: {
  title: string;
  children: (call: CallView) => ReactNode;
}) {
  const { id } = useParams<{ id: string }>();
  const { calls, error } = useGrandma();
  const call = calls?.find((c) => c.id === id);

  return (
    <section className="space-y-8">
      <TopBar title={title} back />
      {error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your calls right now. We'll keep trying.
        </p>
      )}
      {!calls && !error && <p role="status">Opening the call…</p>}
      {calls && !call && <p>This call is no longer in your list.</p>}
      {call && children(call)}
      {/* Room to scroll the last item clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
  );
}
