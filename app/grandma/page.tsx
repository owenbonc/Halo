'use client';
import Link from 'next/link';
import { useState } from 'react';
import { GUIDANCE } from '@/lib/guidance';
import { BAND_LABEL, FAMILY_LABEL } from '@/lib/labels';
import { speak, startRecording } from '@/lib/recorder';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';

function alertLine(call: CallView, contact: string): string | null {
  switch (call.alert?.status) {
    case 'sent':
      return `${contact} has been told.`;
    case 'acknowledged':
      return `${contact} is calling you.`;
    case 'escalated':
      return `${contact} hasn't replied. If you're worried, call 159.`;
    default:
      return null;
  }
}

function CallCard({ call, contact }: { call: CallView; contact: string }) {
  const { analysis } = call;
  const band = BAND_LABEL[analysis.band];
  const steps = analysis.nextSteps.map((id) => GUIDANCE[id]);
  const status = alertLine(call, contact);
  const readAloud = () =>
    speak(
      [band.title, analysis.summary, ...steps.map((s) => `${s.title}. ${s.body}`), status ?? '']
        .filter(Boolean)
        .join(' '),
    );

  return (
    <article className={`space-y-4 rounded-2xl border-4 p-5 ${band.tone}`}>
      <p className="text-sm text-stone-600">{call.callerLabel}</p>
      <h2 className="text-2xl font-semibold">
        <span aria-hidden="true">{band.icon} </span>
        {band.title}
      </h2>
      {analysis.band !== 'none' && <p className="font-medium">{FAMILY_LABEL[analysis.family]}</p>}
      <p>{analysis.summary}</p>
      {analysis.cues.length > 0 && (
        <ul className="space-y-1">
          {analysis.cues.map((cue) => (
            <li key={cue}>“{cue}”</li>
          ))}
        </ul>
      )}
      <ol className="space-y-3">
        {steps.map((step) => (
          <li key={step.title}>
            <strong>{step.title}.</strong> {step.body}
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={readAloud}
        className="w-full rounded-xl border-2 border-stone-800 bg-white p-4"
      >
        Read it to me
      </button>
      {status ? (
        <p className="rounded-xl bg-white p-4 font-medium" role="status">
          {status}
        </p>
      ) : (
        analysis.band !== 'none' && <AskButton callId={call.id} contact={contact} />
      )}
    </article>
  );
}

function AskButton({ callId, contact }: { callId: string; contact: string }) {
  const [busy, setBusy] = useState(false);
  const ask = async () => {
    setBusy(true);
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId }),
    });
    setBusy(false);
  };
  return (
    <button
      type="button"
      onClick={ask}
      disabled={busy}
      className="w-full rounded-xl bg-stone-900 p-4 text-white"
    >
      Ask {contact} to call me
    </button>
  );
}

function VoiceNote() {
  const [recording, setRecording] = useState<{ stop: () => Promise<Blob> } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const start = async () => {
    setMessage(null);
    try {
      setRecording(await startRecording());
    } catch {
      setMessage('I need the microphone to listen. Check your browser settings.');
    }
  };
  const stop = async () => {
    if (!recording) return;
    const audio = await recording.stop();
    setRecording(null);
    setMessage('Checking…');
    const form = new FormData();
    form.append('audio', audio);
    const res = await fetch('/api/voice-note', { method: 'POST', body: form });
    setMessage(
      res.ok ? null : ((await res.json()).error ?? 'Something went wrong. Call 159 if worried.'),
    );
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={recording ? stop : start}
        className="w-full rounded-2xl border-2 border-stone-800 bg-white p-5 text-left"
      >
        {recording ? 'Stop and check' : 'Check a call I answered'}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default function GrandmaPage() {
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const contact = settings.data?.contact.name ?? 'your person';
  const latest = calls.data?.[0];

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Your calls</h1>
      {calls.error && <p role="alert">{calls.error}</p>}
      {latest ? <CallCard call={latest} contact={contact} /> : <p>No screened calls yet.</p>}
      <VoiceNote />
      <nav className="flex justify-between text-base underline">
        <Link href="/grandma/setup">Setup</Link>
        <Link href="/?switch">Switch role</Link>
      </nav>
    </section>
  );
}
