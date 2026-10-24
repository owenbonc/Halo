'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SCREENER_OPENING } from '@/lib/screener-prompt';
import { testSpeaker } from './audio-player';
import { LiveCall } from './live-call';
import { LiveTokenResponse } from './protocol';
import { RecordedCall } from './recorded-call';
import { AccessCodeError, CallError, callRequest } from './request';
import { loadVoice, type VoiceClips } from './scripted-voice';
import { submitCall } from './submit-call';

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
    ? 'We could not confirm delivery. Check the recipient’s Alerts screen before making another call.'
    : 'The call could not start. Check your connection or browser settings and try again.';
}
export default function CallScreen({ localTranscription }: { localTranscription: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<'live' | 'recorded'>(localTranscription ? 'recorded' : 'live');
  const [actualMode, setActualMode] = useState(mode);
  const [fixture, setFixture] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [activity, setActivity] = useState<'waiting' | 'speaking' | 'listening'>('waiting');
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [codeRequired, setCodeRequired] = useState(false);
  const [code, setCode] = useState('');
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
      await submitCall(attempt.call, attempt.id, attempt.abort.signal);
      if (!attempt.cancelled) setPhase('done');
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
    setFixture(false);
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
        { method: 'POST', headers: { 'x-call-demo-code': code } },
        20_000,
        attempt.abort.signal,
      );
      if (response.status === 401) {
        setCodeRequired(true);
        throw new AccessCodeError('Enter the event demo code, then try again.');
      }
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
      setFixture(token.recordedFixture);
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
      if (!attempt.id) throw new CallError('The call did not start. Please try again.');
      const recording = new RecordedCall(stream, attempt.id, () => {
        void finish(attempt);
      });
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
            ? 'Microphone off. Preparing the summary card…'
            : phase === 'done'
              ? fixture
                ? 'Sample result sent to the recipient’s Alerts screen.'
                : 'Summary card sent to the recipient’s Alerts screen.'
              : phase === 'error'
                ? 'Call stopped. Your microphone is off.'
                : 'Ready for a practice call.';
  return (
    <section className="space-y-5 text-center">
      <p className="rounded-full bg-surface-2 px-4 py-1 text-base">Simulated call for the demo</p>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Make a practice call</h1>
        <p className="text-lg text-ink-2">
          The assistant will ask who’s calling and what it’s about.
        </p>
      </div>
      <fieldset
        disabled={busy}
        className="flex flex-wrap justify-center gap-x-5 text-base disabled:opacity-60"
      >
        <legend className="sr-only">Call mode</legend>
        <label className="flex min-h-12 items-center gap-2">
          <input
            type="radio"
            className="accent-accent-ink"
            name="mode"
            checked={mode === 'live'}
            onChange={() => setMode('live')}
          />
          Live conversation
        </label>
        <label className="flex min-h-12 items-center gap-2">
          <input
            type="radio"
            className="accent-accent-ink"
            name="mode"
            checked={mode === 'recorded'}
            onChange={() => setMode('recorded')}
          />
          Recorded message
        </label>
      </fieldset>
      {mode === 'live' && (
        <p className="text-base text-ink-2">
          The assistant uses prerecorded questions. Wait for “Listening” before you speak;
          background sounds won’t cut off a question.
        </p>
      )}
      {localTranscription && mode === 'recorded' && (
        <p className="rounded-chip bg-accent-soft p-3 text-base text-ink">
          Your recording is transcribed on the demo organiser’s private computer. The full analysis
          still uses Google when available.
        </p>
      )}
      {codeRequired && (
        <label className="block text-left text-base">
          Event demo code
          <input
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
            maxLength={256}
            className="mt-2 block w-full rounded-chip border-2 border-line-strong p-3"
          />
        </label>
      )}
      {!busy && (
        <Button
          type="button"
          disabled={speakerTesting}
          variant="secondary"
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
        </Button>
      )}
      {fixture && phase !== 'idle' && (
        <p className="rounded-chip border border-caution bg-caution-soft p-4 text-base">
          Demo fallback: this recording isn’t transcribed. The recipient gets the preset police-call
          sample, whatever you say.
        </p>
      )}
      <p role="status" aria-live="polite" className="min-h-14">
        {status}
      </p>
      {phase === 'prompting' && (
        <div className="space-y-3 rounded-chip bg-surface-2 p-4">
          <p>{SCREENER_OPENING}</p>
          <Button type="button" onClick={readQuestion} variant="secondary">
            Read question aloud
          </Button>
          <Button type="button" onClick={record}>
            Start recording
          </Button>
        </div>
      )}
      {phase === 'listening' && (
        <p role="timer" className="text-4xl tabular-nums" aria-label={`${seconds} seconds elapsed`}>
          00:{String(seconds).padStart(2, '0')}
        </p>
      )}
      {phase === 'listening' && actualMode === 'live' && (
        <div className="space-y-3">
          <Button
            type="button"
            aria-pressed={muted}
            variant="secondary"
            onClick={() => {
              const next = !muted;
              if (current.current?.call instanceof LiveCall) current.current.call.setMuted(next);
              setMuted(next);
            }}
          >
            {muted ? 'Unmute microphone' : 'Mute microphone'}
          </Button>
          <label className="block text-base">
            Assistant volume
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              className="block min-h-12 w-full"
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
        <Button
          type="button"
          onClick={() => {
            if (current.current) void finish(current.current);
          }}
          className="bg-danger! text-surface!"
        >
          Hang up
        </Button>
      ) : (
        phase !== 'prompting' && (
          <Button type="button" onClick={start} disabled={busy || speakerTesting}>
            {phase === 'sending'
              ? 'Passing it on…'
              : phase === 'connecting'
                ? 'Connecting…'
                : 'Start call'}
          </Button>
        )
      )}
      {(phase === 'connecting' || phase === 'prompting') && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (current.current) dispose(current.current);
            current.current = null;
            if ('speechSynthesis' in window) speechSynthesis.cancel();
            setPhase('idle');
          }}
        >
          Cancel
        </Button>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-chip border border-danger bg-danger-soft p-4 text-danger"
        >
          {error}
        </p>
      )}
      <p className="text-base text-ink-2">
        Use a made-up caller and story. Calls last up to 45 seconds.{' '}
        {localTranscription && mode === 'recorded'
          ? 'Recorded messages use the private transcription service described above.'
          : 'Audio is processed by Google.'}{' '}
        The transcript is saved for analysis. The recipient receives a summary card.
      </p>
    </section>
  );
}
