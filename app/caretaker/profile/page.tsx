'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LargeTitle } from '@/components/caretaker/Shell';
import { Card } from '@/components/ui/band';
import { Check, Cross } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import type { Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

const MODE: Record<Settings['alertMode'], string> = {
  auto_strong: 'Automatically when it’s serious',
  ask_first: 'Only when she asks',
};

export default function ProfilePage() {
  // Grandma controls consent, so this page only reads; the poll picks up her changes.
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const s = settings.data;

  return (
    <section className="space-y-6">
      <LargeTitle>Profile</LargeTitle>
      {!s ? (
        settings.error ? (
          <p role="alert" className="text-[0.9375rem] font-semibold text-danger">
            {settings.error}
          </p>
        ) : (
          <p role="status" className="text-[0.9375rem] text-ink-2">
            Loading your profile…
          </p>
        )
      ) : (
        <>
          <Card className="space-y-2">
            <h2 className="text-[1.375rem] leading-tight font-bold">{s.contact.name}</h2>
            <p className="text-[0.9375rem] text-ink-2">{s.elderName}’s person</p>
            {s.contact.verified ? (
              <Pill tone="accent" size="sm">
                <Check className="size-4" />
                Phone checked
              </Pill>
            ) : (
              <Pill size="sm">Phone not checked yet</Pill>
            )}
          </Card>

          <Card className="space-y-3">
            <div>
              <p className="text-[0.8125rem] text-ink-2">How {s.elderName} tells you</p>
              <p className="font-semibold">{MODE[s.alertMode]}</p>
            </div>
            {s.paused && (
              <p className="rounded-chip border border-line-strong bg-surface-2 px-3 py-2 text-[0.9375rem] font-semibold">
                {s.elderName} has paused messages to you. You won’t be told about any call until she
                turns them back on.
              </p>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="text-[1.0625rem] font-bold">What you see</h2>
            <List
              icon={<Check className="mt-0.5 size-5 text-accent-ink" />}
              heading="You will see"
              items={[
                `That a call worried ${s.elderName}, and the kind of scam it looked like`,
                `A request to call ${s.elderName}`,
                ...(s.alertMode === 'auto_strong' ? ['A one-line summary of the call'] : []),
              ]}
            />
            <List
              icon={<Cross className="mt-0.5 size-5 text-ink-2" />}
              heading="You will never see"
              items={[
                'What was said, word for word',
                'Recordings of any call',
                'Calls that showed no warning signs',
              ]}
            />
            <p className="text-[0.8125rem] text-ink-2">
              {s.elderName} chooses these in her settings.
            </p>
          </Card>
        </>
      )}
      <Link
        href="/?switch"
        className="glass inline-flex min-h-11 items-center rounded-full px-4 text-[0.9375rem] font-semibold text-ink-2 transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        Switch role
      </Link>
    </section>
  );
}

function List({ icon, heading, items }: { icon: ReactNode; heading: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-sans text-[0.9375rem] font-semibold tracking-normal text-ink-2">
        {heading}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            {icon}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
