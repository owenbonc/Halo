'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { Disconnect } from '@/components/Disconnect';
import { AlertModeChoice, Choice, WhatTheySee } from '@/components/grandma/Consent';
import { ConnectedDevices } from '@/components/grandma/Devices';
import { setTextSize, TEXT_SIZES, type TextSize, useTextSize } from '@/components/grandma/prefs';
import { TopBar } from '@/components/grandma/TopBar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { ABOVE_TAB_BAR } from '@/components/ui/TabBar';
import { sessionFetch } from '@/lib/client-session';
import { Settings } from '@/lib/types';

type Save = 'idle' | 'saving' | 'saved' | 'failed';

export default function SettingsPage() {
  const textSize = useTextSize();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [save, setSave] = useState<Save>('idle');
  const tag = useRef<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    sessionFetch('/api/settings', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error();
        tag.current = res.headers.get('etag');
        return res.json();
      })
      .then((body) => setSettings(Settings.parse(body)))
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
    if (saving.current || !tag.current) return;
    saving.current = true;
    const next = { ...settings, ...patch };
    setSave('saving');
    const res = await sessionFetch('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', 'if-match': tag.current },
      body: JSON.stringify(next),
    }).catch(() => null);
    try {
      if (!res?.ok) throw new Error();
      setSettings(Settings.parse(await res.json()));
      tag.current = res.headers.get('etag');
      setSave('saved');
    } catch {
      setSave('failed');
      const current = await sessionFetch('/api/settings', { cache: 'no-store' }).catch(() => null);
      if (current?.ok) {
        tag.current = current.headers.get('etag');
        setSettings(Settings.parse(await current.json()));
      }
    } finally {
      saving.current = false;
    }
  };
  const contact = settings.contact.name;

  return (
    <section className="space-y-10">
      <TopBar title="Settings" />
      {/* Pinned to the bottom so the confirmation shows next to whichever control was tapped. */}
      <p
        role="status"
        className={
          save === 'idle'
            ? 'sr-only'
            : `fixed inset-x-4 ${ABOVE_TAB_BAR.lg} z-40 mx-auto max-w-md rounded-full px-6 py-4 text-center font-semibold shadow-float ${save === 'failed' ? 'bg-danger text-surface' : 'bg-ink text-bg'}`
        }
      >
        {save === 'saving' && 'Saving…'}
        {save === 'saved' && 'Saved.'}
        {save === 'failed' &&
          "That change didn't save. Settings were refreshed; check them before trying again."}
      </p>

      <fieldset disabled={save === 'saving'} className="min-w-0 space-y-10">
        <NameSection
          key={settings.elderName}
          name={settings.elderName}
          onChange={(elderName) => update({ elderName })}
        />

        <ContactSection key={settings.contact.name} settings={settings} onChange={update} />

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
      </fieldset>
      <ConnectedDevices />

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

      <Disconnect />
      <Link
        href="/?switch"
        className="glass inline-flex min-h-12 items-center rounded-full px-5 font-semibold text-ink-2"
      >
        Switch role
      </Link>
      {/* Room to scroll clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
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
      <p>
        Use Connected caretaker phones below to invite or disconnect a device. Choosing someone else
        disconnects every caretaker phone and cancels outstanding invitations.
      </p>
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
