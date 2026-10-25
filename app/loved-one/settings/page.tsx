'use client';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { AlertModeChoice, Choice, WhatTheySee } from '@/components/loved-one/Consent';
import { setTextSize, TEXT_SIZES, type TextSize, useTextSize } from '@/components/loved-one/prefs';
import { TopBar } from '@/components/loved-one/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { CircleCheck } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { ABOVE_TAB_BAR } from '@/components/ui/TabBar';
import type { Settings } from '@/lib/types';

type Save = 'idle' | 'saving' | 'saved' | 'failed';

export default function SettingsPage() {
  const textSize = useTextSize();
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
    <section className="space-y-6">
      <TopBar title="Settings" />
      {/* Pinned to the bottom so the confirmation shows next to whichever control was tapped. */}
      <p
        role="status"
        className={
          save === 'idle'
            ? 'sr-only'
            : `fixed inset-x-4 ${ABOVE_TAB_BAR} z-40 mx-auto max-w-md rounded-full px-6 py-4 text-center font-semibold shadow-float ${save === 'failed' ? 'bg-danger-soft text-danger' : 'bg-ink text-bg'}`
        }
      >
        {save === 'saving' && 'Saving…'}
        {save === 'saved' && 'Saved.'}
        {save === 'failed' && "That change didn't save. Try again."}
      </p>

      <NameSection name={settings.elderName} onChange={(elderName) => update({ elderName })} />

      <ContactSection settings={settings} onChange={update} />

      <BackupSection
        name={settings.backupContact?.name ?? ''}
        onChange={(name) => update({ backupContact: name ? { name } : null })}
      />

      <AlertModeChoice
        contact={contact}
        mode={settings.alertMode}
        onChange={(alertMode) => update({ alertMode })}
      />

      <Choice
        type="checkbox"
        checked={settings.paused}
        onChange={(checked) => update({ paused: checked })}
        title={`Pause messages to ${contact}`}
        hint={`While paused, ${contact} isn't told about any call.`}
      />

      <WhatTheySee contact={contact} mode={settings.alertMode} />

      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-3 text-2xl font-bold">Text size</legend>
        {(Object.keys(TEXT_SIZES) as TextSize[]).map((size) => (
          <Choice
            key={size}
            type="radio"
            name="text-size"
            checked={textSize === size}
            onChange={() => setTextSize(size)}
            title={TEXT_SIZES[size].label}
            hint={TEXT_SIZES[size].hint}
          />
        ))}
      </fieldset>

      <Link
        href="/setup"
        className="glass inline-flex min-h-12 items-center rounded-full px-5 font-semibold text-ink-2"
      >
        Set up this phone again
      </Link>
      {/* Room to scroll clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
  );
}

function BackupSection({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  const [value, setValue] = useState(name);
  const inputId = useId();
  const trimmed = value.trim();

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onChange(trimmed);
        }}
      >
        <label htmlFor={inputId} className="block text-2xl font-bold">
          Backup person (optional)
        </label>
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={40}
          autoComplete="off"
          placeholder="Their first name"
          className="min-h-14 w-full rounded-chip border border-line-strong bg-surface px-4 text-xl placeholder:text-ink-2"
        />
        {trimmed !== name && (
          <Button type="submit">{trimmed ? 'Save backup person' : 'Remove backup person'}</Button>
        )}
      </form>
    </Card>
  );
}

function NameSection({ name, onChange }: { name: string; onChange: (name: string) => void }) {
  const [value, setValue] = useState(name);
  const inputId = useId();
  const trimmed = value.trim();

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed && trimmed !== name) onChange(trimmed);
        }}
      >
        <label htmlFor={inputId} className="block text-2xl font-bold">
          Your name
        </label>
        <input
          id={inputId}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={40}
          required
          autoComplete="given-name"
          className="min-h-14 w-full rounded-chip border border-line-strong bg-surface px-4 text-xl"
        />
        {trimmed && trimmed !== name && <Button type="submit">Save my name</Button>}
      </form>
    </Card>
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
            className="min-h-14 w-full rounded-chip border border-line-strong bg-surface px-4 text-xl placeholder:text-ink-2"
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
        <Pill tone="accent">
          <CircleCheck />
          {contact.name}'s phone is checked and ready
        </Pill>
      ) : (
        <div className="space-y-3">
          <p>
            We send this code to {contact.name}'s phone. Ask {contact.name} to read it back to you.
          </p>
          <p className="text-4xl font-bold tracking-[0.3em] tabular-nums">{code}</p>
          <p className="text-ink-2">
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
