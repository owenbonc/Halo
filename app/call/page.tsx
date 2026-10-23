'use client';
import { useState } from 'react';
import { speak, startRecording } from '@/lib/recorder';
import { SCREENER_CLOSING, SCREENER_OPENING } from '@/lib/screener-prompt';
import type { LiveToken } from '@/lib/types';

type Phase = 'idle' | 'listening' | 'sending' | 'done' | 'error';

// Recorded line: the skeleton's screener. Slice A replaces the middle with a Gemini Live conversation.
export default function CallPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<{ id: string; stop: () => Promise<Blob> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const call = async () => {
    setError(null);
    try {
      const res = await fetch('/api/live-token', { method: 'POST' });
      const token = (await res.json()) as LiveToken;
      speak(SCREENER_OPENING);
      const recording = await startRecording();
      setSession({ id: token.callSessionId, stop: recording.stop });
      setPhase('listening');
    } catch {
      setError('Could not start the call. Check the microphone permission.');
      setPhase('error');
    }
  };

  const hangUp = async () => {
    if (!session) return;
    setPhase('sending');
    speak(SCREENER_CLOSING);
    const form = new FormData();
    form.append('audio', await session.stop());
    const { transcript } = (await (
      await fetch('/api/transcribe', { method: 'POST', body: form })
    ).json()) as {
      transcript: string;
    };
    const res = await fetch('/api/calls', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        callSessionId: session.id,
        transcript,
        callerLabel: 'Unknown caller (demo)',
      }),
    });
    setSession(null);
    setPhase(res.ok ? 'done' : 'error');
    if (!res.ok) setError('The call could not be passed on.');
  };

  return (
    <section className="space-y-6 text-center">
      <p className="rounded-full bg-stone-200 px-4 py-1 text-base">Simulated call for the demo</p>
      <h1 className="text-3xl font-semibold">Grandma</h1>
      {phase === 'listening' ? (
        <button
          type="button"
          onClick={hangUp}
          className="w-full rounded-full bg-red-700 p-6 text-white"
        >
          Hang up
        </button>
      ) : (
        <button
          type="button"
          onClick={call}
          disabled={phase === 'sending'}
          className="w-full rounded-full bg-green-700 p-6 text-white"
        >
          {phase === 'sending' ? 'Passing it on…' : 'Call Grandma'}
        </button>
      )}
      {phase === 'done' && <p role="status">Passed to Grandma.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
