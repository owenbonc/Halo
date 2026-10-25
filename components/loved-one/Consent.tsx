import type { ReactNode } from 'react';
import { Card } from '@/components/ui/band';
import { Check, Cross } from '@/components/ui/icons';
import type { Settings } from '@/lib/types';

/** Her two consent choices, shared by setup and Settings so she sees the same words in both. */
export function AlertModeChoice({
  contact,
  mode,
  onChange,
}: {
  contact: string;
  mode: Settings['alertMode'] | null;
  onChange: (mode: Settings['alertMode']) => void;
}) {
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-3 text-2xl font-bold">When should {contact} be told?</legend>
      <Choice
        type="radio"
        name="mode"
        checked={mode === 'ask_first'}
        onChange={() => onChange('ask_first')}
        title="Ask me first"
        hint={`Only when I tap “Ask ${contact} to call me”.`}
      />
      <Choice
        type="radio"
        name="mode"
        checked={mode === 'auto_strong'}
        onChange={() => onChange('auto_strong')}
        title={`Tell ${contact} automatically when it's serious`}
        hint={`For strong warning signs, ${contact} is told straight away.`}
      />
    </fieldset>
  );
}

export function WhatTheySee({
  contact,
  mode,
}: {
  contact: string;
  mode: Settings['alertMode'] | null;
}) {
  return (
    <Card className="space-y-4">
      <h2 className="text-2xl font-bold">What {contact} sees</h2>
      <List
        icon={<Check className="mt-1 size-6 text-accent-ink" />}
        heading={`${contact} will see`}
        items={[
          'That a call worried us, and the kind of scam it looked like',
          'A request to call you',
          ...(mode === 'auto_strong' ? ['A one-line summary of the call'] : []),
        ]}
      />
      <List
        icon={<Cross className="mt-1 size-6 text-ink-2" />}
        heading={`${contact} will never see`}
        items={[
          'What was said, word for word',
          'Recordings of any call',
          'Calls that showed no warning signs',
        ]}
      />
    </Card>
  );
}

export function Choice({
  type,
  name,
  checked,
  onChange,
  title,
  hint,
}: {
  type: 'radio' | 'checkbox';
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 rounded-card border p-4 transition-colors duration-150 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-ink ${checked ? 'border-accent-ink bg-accent-soft' : 'border-line-strong bg-surface'}`}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-7 shrink-0 accent-accent-ink focus-visible:outline-none"
      />
      <span className="min-w-0 break-words">
        <span className="block font-bold">{title}</span>
        <span className="block text-ink-2">{hint}</span>
      </span>
    </label>
  );
}

export function List({
  icon,
  heading,
  items,
}: {
  icon: ReactNode;
  heading: string;
  items: string[];
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-bold">{heading}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            {icon}
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
