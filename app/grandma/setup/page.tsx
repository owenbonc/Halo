'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Settings } from '@/lib/types';

export default function SetupPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then(setSettings);
  }, []);

  if (!settings) return <p>Loading…</p>;
  const contact = settings.contact.name;
  const update = (patch: Partial<Settings>) => {
    setSettings({ ...settings, ...patch });
    setSaved(false);
  };
  const save = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaved(true);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Your person: {contact}</h1>
      <p>
        {settings.contact.verified
          ? `${contact}'s phone is verified.`
          : `${contact} hasn't verified yet.`}
      </p>
      <fieldset className="space-y-3">
        <legend className="font-semibold">When should {contact} be told?</legend>
        <label className="flex gap-3">
          <input
            type="radio"
            name="mode"
            checked={settings.alertMode === 'ask_first'}
            onChange={() => update({ alertMode: 'ask_first' })}
          />
          Only when I tap “Ask {contact} to call me”
        </label>
        <label className="flex gap-3">
          <input
            type="radio"
            name="mode"
            checked={settings.alertMode === 'auto_strong'}
            onChange={() => update({ alertMode: 'auto_strong' })}
          />
          Tell {contact} automatically when it’s serious
        </label>
      </fieldset>
      <label className="flex gap-3">
        <input
          type="checkbox"
          checked={settings.paused}
          onChange={(e) => update({ paused: e.target.checked })}
        />
        Pause alerts to {contact}
      </label>
      <div>
        <h2 className="font-semibold">{contact} will see</h2>
        <p>
          That a call worried us, the kind of scam, and a request to call you. With automatic
          alerts, also one line about the call.
        </p>
        <h2 className="mt-3 font-semibold">{contact} will never see</h2>
        <p>Recordings, what was said word for word, or any bank details.</p>
      </div>
      <button
        type="button"
        onClick={save}
        className="w-full rounded-xl bg-stone-900 p-4 text-white"
      >
        Save
      </button>
      {saved && <p role="status">Saved.</p>}
      <Link href="/grandma" className="block text-base underline">
        Back to your calls
      </Link>
    </section>
  );
}
