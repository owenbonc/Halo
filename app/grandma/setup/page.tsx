'use client';
import Link from 'next/link';
import { type ReactNode, useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { Check, CircleCheck, Cross } from '@/components/ui/icons';
import type { Settings } from '@/lib/types';

type Save = 'idle' | 'saving' | 'saved' | 'failed';

export default function SetupPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [save, setSave] = useState<Save>('idle');

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSettings)
      .catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed)
    return (
      <p role="alert" className="font-semibold text-danger">
        Settings didn't load. Check the internet connection and open this page again.
      </p>
    );
  if (!settings) return <p role="status">Loading your settings…</p>;

  // Every change saves straight away, so there's no Save button to forget.
  const update = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSave('saving');
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => null);
    setSave(res?.ok ? 'saved' : 'failed');
  };
  const contact = settings.contact.name;

  return (
    <section className="space-y-10 pb-24">
      <header className="space-y-2">
        <Link
          href="/grandma"
          className="inline-flex min-h-12 items-center font-semibold text-accent underline"
        >
          Back to your calls
        </Link>
        <h1 className="text-3xl font-bold">Your settings</h1>
      </header>
      {/* Pinned to the bottom so the confirmation shows next to whichever control was tapped. */}
      <p
        role="status"
        className={
          save === 'idle'
            ? 'sr-only'
            : `fixed inset-x-4 bottom-4 z-10 mx-auto max-w-md rounded-xl p-4 font-semibold shadow-card ${save === 'failed' ? 'bg-danger text-white' : 'bg-ink text-paper'}`
        }
      >
        {save === 'saving' && 'Saving…'}
        {save === 'saved' && 'Saved.'}
        {save === 'failed' && "That change didn't save. Try again."}
      </p>

      <ContactSection settings={settings} onChange={update} />

      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-3 text-2xl font-bold">When should {contact} be told?</legend>
        <Choice
          type="radio"
          name="mode"
          checked={settings.alertMode === 'ask_first'}
          onChange={() => update({ alertMode: 'ask_first' })}
          title="Ask me first"
          hint={`Only when I tap “Ask ${contact} to call me”.`}
        />
        <Choice
          type="radio"
          name="mode"
          checked={settings.alertMode === 'auto_strong'}
          onChange={() => update({ alertMode: 'auto_strong' })}
          title={`Tell ${contact} automatically when it's serious`}
          hint={`For strong warning signs, ${contact} is told straight away.`}
        />
      </fieldset>

      <Choice
        type="checkbox"
        checked={settings.paused}
        onChange={(checked) => update({ paused: checked })}
        title={`Pause messages to ${contact}`}
        hint={`While paused, ${contact} isn't told about any call.`}
      />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">What {contact} sees</h2>
        <List
          icon={<Check className="mt-1 size-6 text-clear" />}
          heading={`${contact} will see`}
          items={[
            'That a call worried us, and the kind of scam it looked like',
            'A request to call you',
            ...(settings.alertMode === 'auto_strong' ? ['A one-line summary of the call'] : []),
          ]}
        />
        <List
          icon={<Cross className="mt-1 size-6 text-danger" />}
          heading={`${contact} will never see`}
          items={[
            'What was said, word for word',
            'Recordings of any call',
            'Calls that showed no warning signs',
          ]}
        />
      </section>
    </section>
  );
}

function ContactSection({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(settings.contact.name);
  const [code] = useState(() => String(1000 + Math.floor(Math.random() * 9000)));
  const inputId = useId();
  const { contact } = settings;

  if (editing)
    return (
      <Card>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = name.trim();
            if (!trimmed) return;
            onChange({ contact: { name: trimmed, verified: false } });
            setEditing(false);
          }}
        >
          <label htmlFor={inputId} className="block text-2xl font-bold">
            Who should we tell?
          </label>
          <input
            id={inputId}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
            autoComplete="off"
            placeholder="Their first name"
            className="min-h-14 w-full rounded-xl border-2 border-ink/70 bg-surface px-4 text-xl placeholder:text-ink-soft"
          />
          <Button type="submit">Save</Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      </Card>
    );

  return (
    <Card className="space-y-4">
      <h2 className="text-2xl font-bold">Your person: {contact.name}</h2>
      {contact.verified ? (
        <p className="flex items-center gap-3 font-semibold text-clear">
          <CircleCheck />
          {contact.name}'s phone is checked and ready.
        </p>
      ) : (
        <div className="space-y-3">
          <p>
            We send this code to {contact.name}'s phone. Ask {contact.name} to read it back to you.
          </p>
          <p className="text-4xl font-bold tracking-[0.3em] tabular-nums">{code}</p>
          <p className="text-ink-soft">
            In this demo the code is shown here instead of by text message.
          </p>
          <Button onClick={() => onChange({ contact: { ...contact, verified: true } })}>
            {contact.name} read it back correctly
          </Button>
        </div>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setName(contact.name);
          setEditing(true);
        }}
      >
        Choose someone else
      </Button>
    </Card>
  );
}

function Choice({
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
      className={`flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors duration-150 has-focus-visible:outline-3 has-focus-visible:outline-accent ${checked ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-7 shrink-0 accent-accent focus-visible:outline-none"
      />
      <span className="min-w-0 break-words hyphens-auto">
        <span className="block font-bold">{title}</span>
        <span className="block text-ink-soft">{hint}</span>
      </span>
    </label>
  );
}

function List({ icon, heading, items }: { icon: ReactNode; heading: string; items: string[] }) {
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
