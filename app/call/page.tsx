'use client';
import { useEffect, useRef, useState } from 'react';
import { SCREENER_OPENING } from '@/lib/screener-prompt';
import { CallRecord, PostCallBody } from '@/lib/types';
import { LiveCall } from './live-call';
import { LiveTokenResponse } from './protocol';
import { RecordedCall } from './recorded-call';

type Phase = 'idle' | 'connecting' | 'listening' | 'sending' | 'done' | 'error';
type Attempt = {
  cancelled: boolean;
  ending: boolean;
  id?: string;
  stream?: MediaStream;
  context?: AudioContext;
  call?: LiveCall | RecordedCall;
  timer?: ReturnType<typeof setInterval>;
  limit?: ReturnType<typeof setTimeout>;
};
function dispose(attempt: Attempt) {
  attempt.cancelled = true;
  clearInterval(attempt.timer);
  clearTimeout(attempt.limit);
  attempt.call?.dispose();
  attempt.stream?.getTracks().forEach((t) => {
    t.stop();
  });
  if (attempt.context?.state !== 'closed') void attempt.context?.close().catch(() => {});
}

export default function CallPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<'live' | 'recorded'>('live');
  const [actualMode, setActualMode] = useState(mode);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<Attempt | null>(null);
  useEffect(
    () => () => {
      if (current.current) dispose(current.current);
    },
    [],
  );

  const finish = async (attempt: Attempt) => {
    if (attempt.cancelled || attempt.ending) return;
    attempt.ending = true;
    clearInterval(attempt.timer);
    clearTimeout(attempt.limit);
    setPhase('sending');
    try {
      if (!attempt.call || !attempt.id)
        throw new Error('The call did not connect. Please try again.');
      const transcript = await attempt.call.finish();
      if (attempt.cancelled) return;
      const body = PostCallBody.parse({
        callSessionId: attempt.id,
        transcript,
        callerLabel: 'Unknown caller (demo)',
      });
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok)
        throw new Error('The call could not be passed on. Start a new call to try again.');
      CallRecord.parse(await response.json());
      if (!attempt.cancelled) setPhase('done');
    } catch (e) {
      if (!attempt.cancelled) {
        setError(
          e instanceof Error && !(e.name === 'ZodError')
            ? e.message
            : 'The call could not be passed on. Please try again.',
        );
        setPhase('error');
      }
    } finally {
      dispose(attempt);
      if (current.current === attempt) current.current = null;
    }
  };

  const start = async () => {
    if (current.current) return;
    const attempt: Attempt = { cancelled: false, ending: false };
    current.current = attempt;
    setPhase('connecting');
    setSeconds(0);
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error('Open this page over HTTPS to use the microphone.');
      if (mode === 'live') {
        attempt.context = new AudioContext();
        // Unlock playback in the initiating tap, before network or microphone awaits.
        await attempt.context.resume();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      attempt.stream = stream;
      if (attempt.cancelled) {
        dispose(attempt);
        return;
      }
      const response = await fetch(`/api/live-token?mode=${mode}`, {
        method: 'POST',
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error('Could not connect. Try again or choose Recorded message.');
      const token = LiveTokenResponse.parse(await response.json());
      if (attempt.cancelled) return;
      attempt.id = token.callSessionId;
      const ended = () => {
        void finish(attempt);
      };
      if (token.token && token.model && attempt.context) {
        setActualMode('live');
        const live = new LiveCall(attempt.context, stream, ended);
        attempt.call = live;
        await live.start(token.token, token.model);
      } else {
        setActualMode('recorded');
        if (attempt.context) await attempt.context.close();
        const recorded = new RecordedCall(stream, ended);
        attempt.call = recorded;
        await recorded.start();
      }
      if (attempt.cancelled || attempt.ending) return;
      setPhase('listening');
      const began = Date.now();
      attempt.timer = setInterval(
        () => setSeconds(Math.min(45, Math.floor((Date.now() - began) / 1000))),
        250,
      );
      attempt.limit = setTimeout(ended, 45_000);
    } catch (e) {
      if (!attempt.cancelled && !attempt.ending) {
        setError(
          e instanceof DOMException && e.name === 'NotAllowedError'
            ? 'Microphone access was denied. Allow it in your browser and try again.'
            : e instanceof Error && e.name !== 'ZodError'
              ? e.message
              : 'Could not start the call. Please try again.',
        );
        setPhase('error');
      }
      dispose(attempt);
      if (current.current === attempt) current.current = null;
    }
  };
  const busy = phase === 'connecting' || phase === 'listening' || phase === 'sending';
  const status =
    phase === 'connecting'
      ? 'Connecting. Allow microphone access when asked.'
      : phase === 'listening'
        ? actualMode === 'live'
          ? 'Connected. Speak with Grandma’s assistant.'
          : 'Recording your message. Say your name and why you’re calling.'
        : phase === 'sending'
          ? 'Passing the conversation to Grandma…'
          : phase === 'done'
            ? 'Passed to Grandma.'
            : 'Ready for a practice call.';
  return (
    <section className="space-y-6 text-center">
      <p className="rounded-full bg-stone-200 px-4 py-1 text-base">Simulated call for the demo</p>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Call Grandma</h1>
        <p className="text-lg text-stone-600">
          Her assistant will ask who’s calling and what it’s about.
        </p>
      </div>
      <fieldset disabled={busy} className="flex justify-center gap-5 text-base disabled:opacity-60">
        <legend className="sr-only">Call mode</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'live'}
            onChange={() => setMode('live')}
          />
          Live conversation
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="radio"
            name="mode"
            checked={mode === 'recorded'}
            onChange={() => setMode('recorded')}
          />
          Recorded message
        </label>
      </fieldset>
      <p role="status" aria-live="polite" className="min-h-14">
        {status}
      </p>
      {phase === 'listening' && (
        <p role="timer" className="text-4xl tabular-nums" aria-label={`${seconds} seconds elapsed`}>
          00:{String(seconds).padStart(2, '0')}
        </p>
      )}
      {actualMode === 'recorded' && phase === 'listening' && (
        <p className="rounded-xl bg-stone-100 p-4 text-lg">{SCREENER_OPENING}</p>
      )}
      {phase === 'listening' ? (
        <button
          type="button"
          onClick={() => {
            if (current.current) void finish(current.current);
          }}
          className="w-full rounded-full bg-red-700 p-6 font-semibold text-white focus-visible:outline-4 focus-visible:outline-offset-4"
        >
          Hang up
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="w-full rounded-full bg-green-800 p-6 font-semibold text-white disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4"
        >
          {phase === 'sending'
            ? 'Passing it on…'
            : phase === 'connecting'
              ? 'Connecting…'
              : 'Call Grandma'}
        </button>
      )}
      {phase === 'connecting' && (
        <button
          type="button"
          className="min-h-11 underline"
          onClick={() => {
            if (current.current) dispose(current.current);
            current.current = null;
            setPhase('idle');
          }}
        >
          Cancel
        </button>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}
      <p className="text-base text-stone-600">
        Use a made-up caller and story. Calls last up to 45 seconds. If live calling is unavailable,
        choose Recorded message.
      </p>
    </section>
  );
}
