'use client';
import { useEffect, useRef, useState } from 'react';
import { Disconnect } from '@/components/Disconnect';
import { Button } from '@/components/ui/Button';
import { SCREENER_OPENING } from '@/lib/screener-prompt';
import { CallRecord, PostCallBody } from '@/lib/types';
import { testSpeaker } from './audio-player';
import { LiveCall } from './live-call';
import { LiveTokenResponse } from './protocol';
import { RecordedCall } from './recorded-call';
import { CallError, callRequest } from './request';
import { loadVoice, type VoiceClips } from './scripted-voice';

type Phase = 'idle' | 'connecting' | 'prompting' | 'listening' | 'sending' | 'done' | 'error';
type Attempt = {
  cancelled: boolean;
  ending: boolean;
  abort: AbortController;
  id?: string;
  stream?: MediaStream;
  context?: AudioContext;
  clips?: VoiceClips;
  call?: LiveCall | RecordedCall;
  timer?: ReturnType<typeof setInterval>;
  limit?: ReturnType<typeof setTimeout>;
};
function dispose(attempt: Attempt) {
  attempt.cancelled = true;
  attempt.abort.abort();
  clearInterval(attempt.timer);
  clearTimeout(attempt.limit);
  attempt.call?.dispose();
  attempt.stream?.getTracks().forEach((t) => {
    t.stop();
  });
  if (attempt.context?.state !== 'closed') void attempt.context?.close().catch(() => {});
}
function errorMessage(error: unknown, delivery = false) {
  if (error instanceof CallError) return error.message;
  if (error instanceof DOMException && error.name === 'NotAllowedError')
    return 'Microphone access was denied. Allow it in your browser and try again.';
  if (error instanceof DOMException && error.name === 'NotFoundError')
    return 'No microphone was found. Connect one and try again.';
  if (error instanceof DOMException && error.name === 'NotReadableError')
    return 'The microphone is busy. Close other calling apps and try again.';
  return delivery
    ? 'We could not confirm delivery. Check Grandma’s page before making another call.'
    : 'The call could not start. Check your connection or browser settings and try again.';
}
export default function CallPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<'live' | 'recorded'>('live');
  const [actualMode, setActualMode] = useState(mode);
  const [seconds, setSeconds] = useState(0);
  const [activity, setActivity] = useState<'waiting' | 'speaking' | 'listening'>('waiting');
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof PostCallBody.parse> | null>(null);
  const retrying = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef<Attempt | null>(null);
  useEffect(() => {
    const stop = () => {
      if (current.current) dispose(current.current);
      current.current = null;
    };
    const hide = () => {
      stop();
      setPhase('idle');
      setPending(null);
      setMuted(false);
    };
    window.addEventListener('pagehide', hide);
    return () => {
      window.removeEventListener('pagehide', hide);
      stop();
    };
  }, []);
  const fail = (attempt: Attempt, e: unknown) => {
    if (!attempt.cancelled) {
      setError(errorMessage(e));
      setPhase('error');
    }
    dispose(attempt);
    if (current.current === attempt) current.current = null;
  };
  const finish = async (attempt: Attempt) => {
    if (attempt.cancelled || attempt.ending) return;
    attempt.ending = true;
    clearInterval(attempt.timer);
    clearTimeout(attempt.limit);
    setPhase('sending');
    try {
      if (!attempt.call || !attempt.id)
        throw new CallError('The call did not connect. Please try again.');
      const transcript = await attempt.call.finish();
      if (attempt.cancelled) return;
      const body = PostCallBody.parse({
        callSessionId: attempt.id,
        transcript,
        callerLabel: 'Unknown caller (demo)',
      });
      setPending(body);
      const response = await callRequest(
        '/api/calls',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        30_000,
        attempt.abort.signal,
      );
      if (!response.ok)
        throw new CallError(
          'We could not confirm delivery. Check Grandma’s page before making another call.',
        );
      CallRecord.parse(response.data);
      if (!attempt.cancelled) {
        setPending(null);
        setPhase('done');
      }
    } catch (e) {
      if (!attempt.cancelled) {
        setError(errorMessage(e, true));
        setPhase('error');
      }
    } finally {
      dispose(attempt);
      if (current.current === attempt) current.current = null;
    }
  };
  const listening = (attempt: Attempt) => {
    if (attempt.cancelled || attempt.ending) return;
    setPhase('listening');
    const began = Date.now();
    attempt.timer = setInterval(
      () => setSeconds(Math.min(45, Math.floor((Date.now() - began) / 1000))),
      250,
    );
    attempt.limit = setTimeout(() => {
      void finish(attempt);
    }, 45_000);
  };
  const microphone = async (attempt: Attempt) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });
    attempt.stream = stream;
    if (attempt.cancelled || attempt.ending) {
      stream.getTracks().forEach((t) => {
        t.stop();
      });
      throw new CallError('Call cancelled.');
    }
    return stream;
  };
  const start = async () => {
    if (current.current) return;
    const attempt: Attempt = { cancelled: false, ending: false, abort: new AbortController() };
    current.current = attempt;
    setPhase('connecting');
    setSeconds(0);
    setMuted(false);
    setActivity('waiting');
    setError(null);
    setPending(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new CallError(
          'Open this page in a current browser over HTTPS to use the microphone.',
        );
      if (mode === 'recorded' && typeof MediaRecorder === 'undefined')
        throw new CallError(
          'This browser cannot record messages. Use a current Safari, Chrome or Edge browser.',
        );
      if (mode === 'live') {
        if (
          typeof AudioContext === 'undefined' ||
          typeof AudioWorkletNode === 'undefined' ||
          typeof WebSocket === 'undefined'
        )
          throw new CallError(
            'Live audio is not supported in this browser. Choose Recorded message, or update your browser.',
          );
        attempt.context = new AudioContext();
        // Unlock the speaker in the tap, before asynchronous setup.
        await attempt.context.resume();
        if (attempt.cancelled) return;
        attempt.clips = await loadVoice(attempt.abort.signal);
        if (attempt.cancelled) return;
        await microphone(attempt);
      }
      const response = await callRequest(
        `/api/live-token?mode=${mode}`,
        { method: 'POST' },
        20_000,
        attempt.abort.signal,
      );
      if (response.status === 429)
        throw new CallError(
          'The demo’s call limit has been reached. Please wait and try again later.',
        );
      if (!response.ok)
        throw new CallError(
          'Calling is unavailable. Ask the demo organiser to check the service, then try again.',
        );
      const token = LiveTokenResponse.parse(response.data);
      if (attempt.cancelled) return;
      attempt.id = token.callSessionId;
      if (token.token && token.model && attempt.context && attempt.stream && attempt.clips) {
        setActualMode('live');
        const live = new LiveCall(
          attempt.context,
          attempt.stream,
          () => {
            void finish(attempt);
          },
          attempt.clips,
          setActivity,
        );
        attempt.call = live;
        live.setVolume(volume / 100);
        await live.start(token.token, token.model);
        listening(attempt);
      } else {
        attempt.stream?.getTracks().forEach((t) => {
          t.stop();
        });
        if (attempt.context) await attempt.context.close();
        setActualMode('recorded');
        setPhase('prompting');
      }
    } catch (e) {
      if (!attempt.ending) fail(attempt, e);
    }
  };
  const record = async () => {
    const attempt = current.current;
    if (!attempt || phase !== 'prompting') return;
    setPhase('connecting');
    try {
      if (typeof MediaRecorder === 'undefined')
        throw new CallError(
          'This browser cannot record messages. Use a current Safari, Chrome or Edge browser.',
        );
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      const stream = await microphone(attempt);
      const recording = new RecordedCall(
        stream,
        () => {
          void finish(attempt);
        },
        attempt.id as string,
      );
      attempt.call = recording;
      recording.start();
      listening(attempt);
    } catch (e) {
      fail(attempt, e);
    }
  };
  const readQuestion = () => {
    if (!('speechSynthesis' in window)) {
      setError(
        'This browser cannot read the question aloud. You can read it above and start recording.',
      );
      return;
    }
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(SCREENER_OPENING);
    speech.lang = 'en-GB';
    speech.rate = 0.95;
    const voice = speechSynthesis.getVoices().find((v) => v.lang === 'en-GB' && v.localService);
    if (voice) speech.voice = voice;
    speechSynthesis.speak(speech);
  };
  const busy = ['connecting', 'prompting', 'listening', 'sending'].includes(phase);
  const status =
    phase === 'connecting'
      ? 'Connecting. Allow microphone access if asked.'
      : phase === 'prompting'
        ? 'Read or listen to the question, then start your message.'
        : phase === 'listening'
          ? actualMode === 'recorded'
            ? 'Recording your message.'
            : muted
              ? 'Your microphone is muted.'
              : activity === 'speaking'
                ? 'The assistant is speaking. Your microphone is paused until she finishes.'
                : activity === 'waiting'
                  ? 'Preparing the response. Your microphone is paused; please wait.'
                  : 'Listening. Tell the assistant why you’re calling.'
          : phase === 'sending'
            ? 'Microphone off. Passing the conversation to Grandma…'
            : phase === 'done'
              ? 'Passed on.'
              : phase === 'error'
                ? 'Call stopped. Your microphone is off.'
                : 'Ready for a practice call.';
  return (
    <section className="space-y-5 text-center">
      <p className="rounded-full bg-stone-200 px-4 py-1 text-base">Simulated call for the demo</p>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Call Grandma</h1>
        <p className="text-lg text-stone-600">
          Her assistant will ask who’s calling and what it’s about.
        </p>
      </div>
      <fieldset
        disabled={busy}
        className="flex flex-wrap justify-center gap-x-5 text-base disabled:opacity-60"
      >
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
      {mode === 'live' && (
        <p className="text-base text-stone-600">
          Kokoro voice · prerecorded screening questions. Please take turns: background sounds won’t
          cut off a question. Gemini listens when the assistant finishes.
        </p>
      )}
      {!busy && (
        <button
          type="button"
          disabled={speakerTesting}
          className="min-h-11 underline disabled:opacity-50"
          onClick={async () => {
            setSpeakerTesting(true);
            try {
              await testSpeaker();
            } catch {
              setError('The speaker could not play. Check your browser sound settings.');
            } finally {
              setSpeakerTesting(false);
            }
          }}
        >
          Test speaker
        </button>
      )}
      <p role="status" aria-live="polite" className="min-h-14">
        {status}
      </p>
      {phase === 'prompting' && (
        <div className="space-y-3 rounded-xl bg-stone-100 p-4">
          <p>{SCREENER_OPENING}</p>
          <button type="button" onClick={readQuestion} className="min-h-11 underline">
            Read question aloud
          </button>
          <button
            type="button"
            onClick={record}
            className="w-full rounded-full bg-green-800 p-5 font-semibold text-white"
          >
            Start recording
          </button>
        </div>
      )}
      {phase === 'listening' && (
        <p role="timer" className="text-4xl tabular-nums" aria-label={`${seconds} seconds elapsed`}>
          00:{String(seconds).padStart(2, '0')}
        </p>
      )}
      {phase === 'listening' && actualMode === 'live' && (
        <div className="space-y-3">
          <button
            type="button"
            aria-pressed={muted}
            className="min-h-12 rounded-xl border-2 border-stone-600 px-5"
            onClick={() => {
              const next = !muted;
              if (current.current?.call instanceof LiveCall) current.current.call.setMuted(next);
              setMuted(next);
            }}
          >
            {muted ? 'Unmute microphone' : 'Mute microphone'}
          </button>
          <label className="block text-base">
            Assistant volume
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              className="block min-h-11 w-full"
              onChange={(e) => {
                const next = Number(e.target.value);
                setVolume(next);
                if (current.current?.call instanceof LiveCall)
                  current.current.call.setVolume(next / 100);
              }}
            />
          </label>
        </div>
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
        phase !== 'prompting' && (
          <button
            type="button"
            onClick={start}
            disabled={busy || speakerTesting}
            className="w-full rounded-full bg-green-800 p-6 font-semibold text-white disabled:opacity-50 focus-visible:outline-4 focus-visible:outline-offset-4"
          >
            {phase === 'sending'
              ? 'Passing it on…'
              : phase === 'connecting'
                ? 'Connecting…'
                : 'Call Grandma'}
          </button>
        )
      )}
      {(phase === 'connecting' || phase === 'prompting') && (
        <button
          type="button"
          className="min-h-11 underline"
          onClick={() => {
            if (current.current) dispose(current.current);
            current.current = null;
            if ('speechSynthesis' in window) speechSynthesis.cancel();
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
      {pending && !busy && (
        <Button
          onClick={async () => {
            if (retrying.current) return;
            retrying.current = true;
            setPhase('sending');
            setError(null);
            try {
              const response = await callRequest(
                '/api/calls',
                {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(pending),
                },
                45_000,
              );
              if (!response.ok)
                throw new CallError(
                  'The call is not confirmed yet. Wait a moment and retry this conversation.',
                );
              CallRecord.parse(response.data);
              setPending(null);
              setPhase('done');
            } catch (error) {
              setError(errorMessage(error, true));
              setPhase('error');
            } finally {
              retrying.current = false;
            }
          }}
        >
          Retry this conversation
        </Button>
      )}
      <Disconnect />
      <p className="text-base text-stone-600">
        Use a made-up caller and story. Calls last up to 45 seconds. Live audio is processed by
        Google; the transcript is saved for analysis. Grandma receives a summary card.
      </p>
    </section>
  );
}
