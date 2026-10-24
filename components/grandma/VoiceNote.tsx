'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { appScroller } from '@/components/ui/DeviceFrame';
import { Mic } from '@/components/ui/icons';
import { Pill } from '@/components/ui/Pill';
import { sessionFetch } from '@/lib/client-session';
import { startRecording } from '@/lib/recorder';
import { CallRecord } from '@/lib/types';
import { useGrandma } from './GrandmaData';

type State =
  | { kind: 'idle'; message: string | null }
  | { kind: 'starting' }
  | { kind: 'recording'; since: number; stop: () => Promise<Blob> }
  | { kind: 'checking' };

const minutes = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// No time limit: people may speak slowly. The server caps the upload size.
export function VoiceNote() {
  const { focus } = useGrandma();
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'idle', message: null });
  const [now, setNow] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const recorder = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const pending = useRef(false);
  const audio = useRef<Blob | null>(null);
  const noteId = useRef('');
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const stop = () => {
      controller.current?.abort();
      recorder.current?.cancel();
      audio.current = null;
    };
    window.addEventListener('pagehide', stop);
    return () => {
      mounted.current = false;
      window.removeEventListener('pagehide', stop);
      stop();
    };
  }, []);

  useEffect(() => {
    if (state.kind !== 'recording') return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [state.kind]);

  const start = async () => {
    if (pending.current) return;
    pending.current = true;
    controller.current = new AbortController();
    const signal = controller.current.signal;
    audio.current = null;
    noteId.current = crypto.randomUUID();
    setState({ kind: 'starting' });
    try {
      recorder.current = await startRecording(signal);
      if (signal.aborted) {
        recorder.current.cancel();
        return;
      }
      const { stop } = recorder.current;
      setNow(Date.now());
      setState({ kind: 'recording', since: Date.now(), stop });
    } catch {
      if (signal.aborted) return;
      setState({
        kind: 'idle',
        message:
          'We need the microphone to listen. Allow it in your browser settings, then try again.',
      });
    } finally {
      pending.current = false;
      if (signal.aborted && mounted.current) setState({ kind: 'idle', message: null });
    }
  };

  const finish = async (retry = false) => {
    if (pending.current || (!retry && state.kind !== 'recording')) return;
    pending.current = true;
    const signal = controller.current?.signal;
    setState({ kind: 'checking' });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!retry && state.kind === 'recording') audio.current = await state.stop();
      if (!audio.current) throw new Error('No recording was captured.');
      const form = new FormData();
      form.append('audio', audio.current);
      timer = setTimeout(() => controller.current?.abort(), 75_000);
      const res = await sessionFetch('/api/voice-note', {
        method: 'POST',
        headers: { 'x-voice-note-id': noteId.current },
        body: form,
        signal,
      }).catch(() => null);
      if (!mounted.current || signal?.aborted) return;
      if (res?.ok) {
        const call = CallRecord.parse(await res.json());
        audio.current = null;
        setState({ kind: 'idle', message: null });
        focus(call.id);
        router.push('/grandma');
        appScroller().scrollTo({ top: 0, behavior: 'smooth' });
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
    } catch {
      if (!signal?.aborted)
        setState({ kind: 'idle', message: 'Recording failed. Please try again.' });
    } finally {
      clearTimeout(timer);
      pending.current = false;
      if (signal?.aborted && mounted.current) {
        controller.current = new AbortController();
        setState({
          kind: 'idle',
          message: 'That took too long. Check the call list before sending again.',
        });
      }
    }
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
          <Button onClick={() => finish()}>I've finished, check it</Button>
        </>
      ) : (
        <Button
          variant="secondary"
          onClick={start}
          disabled={state.kind === 'checking' || state.kind === 'starting'}
        >
          <Mic />
          {state.kind === 'checking'
            ? 'Checking what you said…'
            : state.kind === 'starting'
              ? 'Opening the microphone…'
              : 'Check a call I answered'}
        </Button>
      )}
      {state.kind === 'idle' && state.message && (
        <p role="status" className="font-semibold">
          {state.message}
        </p>
      )}
      {state.kind === 'idle' && audio.current && (
        <Button variant="secondary" onClick={() => finish(true)}>
          Retry this recording
        </Button>
      )}
      {(state.kind === 'recording' || state.kind === 'starting') && (
        <Button
          variant="secondary"
          onClick={() => {
            controller.current?.abort();
            recorder.current?.cancel();
            audio.current = null;
            setState({ kind: 'idle', message: null });
          }}
        >
          Cancel recording
        </Button>
      )}
    </Card>
  );
}
