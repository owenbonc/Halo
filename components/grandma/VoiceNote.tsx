'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { Mic } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { startRecording } from '@/lib/recorder';

type State =
  | { kind: 'idle'; message: string | null }
  | { kind: 'recording'; since: number; stop: () => Promise<Blob> }
  | { kind: 'checking' };

const minutes = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// No time limit: people may speak slowly. The server caps the upload size.
export function VoiceNote() {
  const [state, setState] = useState<State>({ kind: 'idle', message: null });
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (state.kind !== 'recording') return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [state.kind]);

  const start = async () => {
    try {
      const { stop } = await startRecording();
      setNow(Date.now());
      setState({ kind: 'recording', since: Date.now(), stop });
    } catch {
      setState({
        kind: 'idle',
        message:
          'We need the microphone to listen. Allow it in your browser settings, then try again.',
      });
    }
  };

  const finish = async () => {
    if (state.kind !== 'recording') return;
    const audio = await state.stop();
    setState({ kind: 'checking' });
    const form = new FormData();
    form.append('audio', audio);
    const res = await fetch('/api/voice-note', { method: 'POST', body: form }).catch(() => null);
    if (res?.ok) {
      setState({ kind: 'idle', message: 'Done. Your new card is at the top.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const error = await res
      ?.json()
      .then((b: { error?: string }) => b.error)
      .catch(() => undefined);
    setState({
      kind: 'idle',
      message:
        error ?? "We couldn't check that just now. Try again, or call 159 if you're worried.",
    });
  };

  return (
    <Card className="space-y-4">
      <h2 className="text-2xl font-bold">Did you answer a call yourself?</h2>
      <p className="text-ink-2">
        Tell us what the caller said, in your own words. Take as long as you need.
      </p>
      {state.kind === 'recording' ? (
        <>
          <p role="status">
            <Pill tone="accent" className="text-2xl">
              <span className="size-3 rounded-full bg-accent-ink motion-safe:animate-pulse" />
              Listening <span className="tabular-nums">{minutes(now - state.since)}</span>
            </Pill>
          </p>
          <Button onClick={finish}>I've finished, check it</Button>
        </>
      ) : (
        <Button variant="secondary" onClick={start} disabled={state.kind === 'checking'}>
          <Mic />
          {state.kind === 'checking' ? 'Checking what you said…' : 'Check a call I answered'}
        </Button>
      )}
      {state.kind === 'idle' && state.message && (
        <p role="status" className="font-semibold">
          {state.message}
        </p>
      )}
    </Card>
  );
}
