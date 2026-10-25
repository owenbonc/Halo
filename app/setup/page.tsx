'use client';
import { useRouter } from 'next/navigation';
import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { AlertModeChoice, Choice, List, WhatTheySee } from '@/components/loved-one/Consent';
import {
  setTextSize,
  TEXT_SIZES,
  type TextSize,
  useAppliedTextSize,
} from '@/components/loved-one/prefs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { Check, Cross } from '@/components/ui/icons';
import { savedRole, saveRole } from '@/lib/role';
import type { Settings } from '@/lib/types';

// First, whose phone this is. Her phone then runs the steps below: the caregiver does the first five, the last two are hers.
const STEPS = ['about', 'her', 'you', 'backup', 'handover', 'size', 'consent'] as const;
type Step = (typeof STEPS)[number];

export default function SetupPage() {
  const router = useRouter();
  const textSize = useAppliedTextSize();
  // null: still asking whose phone this is.
  const [path, setPath] = useState<'hers' | 'mine' | null>(null);
  // A phone that already has a role came here from its Settings, so it has somewhere to go back to.
  const [home, setHome] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [elderName, setElderName] = useState('');
  const [contactName, setContactName] = useState('');
  const [backupName, setBackupName] = useState('');
  const [alertMode, setAlertMode] = useState<Settings['alertMode'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const step: Step = STEPS[index] ?? 'about';
  const next = () => setIndex(Math.min(index + 1, STEPS.length - 1));
  const back = () => (index > 0 ? setIndex(index - 1) : setPath(null));
  const leave = () =>
    window.history.length > 1 ? router.back() : home ? router.push(home) : undefined;
  const her = elderName.trim();
  const you = contactName.trim();

  useEffect(() => {
    const role = savedRole();
    if (role) setHome(`/${role}`);
  }, []);

  // Each step replaces the screen, so move focus to its heading for screen readers (not on first load).
  const moved = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: path and index only exist to re-run this effect.
  useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [path, index]);

  const finish = async () => {
    if (!alertMode) return;
    setSaving(true);
    setFailed(false);
    const settings: Settings = {
      elderName: her,
      // The caregiver is holding her phone while setting up, so the contact is confirmed in person.
      contact: { name: you, verified: true },
      backupContact: backupName.trim() ? { name: backupName.trim() } : null,
      alertMode,
      paused: false,
    };
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => null);
    if (!res?.ok) {
      setSaving(false);
      setFailed(true);
      return;
    }
    saveRole('loved-one');
    router.replace('/loved-one');
  };

  const shared = { heading, step: index + 1, onBack: back };

  if (!path)
    return (
      <section className="space-y-10 pt-6">
        <header className="space-y-3">
          <p className="font-display text-2xl font-extrabold tracking-[-0.02em] text-accent-ink">
            Halo
          </p>
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-4xl font-bold leading-tight focus:outline-none"
          >
            Whose phone is this?
          </h1>
          <p className="text-ink-2">This phone will remember your answer.</p>
        </header>
        <div className="space-y-4">
          {(
            [
              ['hers', 'Someone I look after', 'Set it up on their phone, together'],
              ['mine', 'Mine. I look out for someone', 'Get told when a call worries them'],
            ] as const
          ).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPath(value)}
              className="glass flex min-h-24 w-full flex-col items-start justify-center gap-1 rounded-card px-6 py-4 text-left transition-[transform,background-color] duration-100 ease-out active:scale-[0.97]"
            >
              <span className="font-display text-3xl font-bold tracking-[-0.02em]">{label}</span>
              <span className="font-normal text-ink-2">{hint}</span>
            </button>
          ))}
        </div>
        {home && (
          <Button variant="secondary" onClick={leave}>
            Back
          </Button>
        )}
      </section>
    );

  if (path === 'mine')
    return (
      <Frame heading={heading} title="What you'll see" onBack={() => setPath(null)}>
        <Card className="space-y-4">
          <List
            icon={<Check className="mt-1 size-6 text-accent-ink" />}
            heading="You will see"
            items={[
              'That a call worried them, and the kind of scam it looked like',
              'A request to call them',
              'A one-line summary of the call, if they choose',
            ]}
          />
          <List
            icon={<Cross className="mt-1 size-6 text-ink-2" />}
            heading="You will never see"
            items={[
              'What was said, word for word',
              'Recordings of any call',
              'Calls that showed no warning signs',
            ]}
          />
        </Card>
        <p>
          They choose whether you're told automatically or only when they ask. Next, set up their
          phone with them: open Halo on it and choose "Someone I look after". You add your name
          there, so it matches on both phones.
        </p>
        <Button
          onClick={() => {
            saveRole('caregiver');
            router.replace('/caregiver');
          }}
        >
          Continue
        </Button>
      </Frame>
    );

  switch (step) {
    case 'about':
      return (
        <Frame {...shared} title="What Halo does on this phone">
          <Card className="space-y-4">
            <List
              icon={<Check className="mt-1 size-6 text-accent-ink" />}
              heading="Halo will"
              items={[
                "Ask callers who they are and why they're calling",
                'Check their words against known scam scripts',
                'Show a card with what it found and what to do next',
                'Tell their person only if they agree',
              ]}
            />
            <List
              icon={<Cross className="mt-1 size-6 text-ink-2" />}
              heading="Halo won't"
              items={[
                'Keep recordings: only the words of the call are kept',
                'Show any phone number or link a caller gives',
                "Promise a call is genuine. It can only say it didn't find warning signs",
              ]}
            />
          </Card>
          <p className="text-ink-2">
            The caller's voice is processed by Google's Gemini to understand it.
          </p>
          <Button onClick={next}>Next</Button>
        </Frame>
      );
    case 'her':
      return (
        <NameStep
          {...shared}
          title="Who is this phone for?"
          hint="The name the app will use for them, like Margaret or Mum."
          value={elderName}
          onChange={setElderName}
          autoComplete="off"
          onNext={next}
        />
      );
    case 'you':
      return (
        <NameStep
          {...shared}
          title={`Who should we tell when a call worries ${her}?`}
          hint="Usually your own first name."
          value={contactName}
          onChange={setContactName}
          autoComplete="given-name"
          onNext={next}
        />
      );
    case 'backup':
      return (
        <NameStep
          {...shared}
          title={`Anyone else, if ${you} doesn't reply?`}
          hint="Optional. You can skip this."
          value={backupName}
          onChange={setBackupName}
          autoComplete="off"
          optional
          onNext={next}
        />
      );
    case 'size':
      return (
        <Frame {...shared} title={`Hello ${her}`}>
          <p>First, pick the text size that's easiest for you to read.</p>
          <fieldset className="min-w-0 space-y-3">
            <legend className="sr-only">Text size</legend>
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
          <Button onClick={next}>Next</Button>
        </Frame>
      );
    case 'handover':
      return (
        <Frame {...shared} title={`Now hand the phone to ${her}`}>
          <p>
            The last two choices are {her}'s to make: the text size, and when {you} hears about a
            worrying call.
          </p>
          <Button onClick={next}>I'm {her}. Carry on</Button>
        </Frame>
      );
    case 'consent':
      return (
        <Frame {...shared} title="One last choice">
          <p>
            We answer numbers you don't know and tell you what we found. You decide what {you}{' '}
            hears.
          </p>
          <AlertModeChoice contact={you} mode={alertMode} onChange={setAlertMode} />
          <WhatTheySee contact={you} mode={alertMode} />
          {failed && (
            <p role="alert" className="font-semibold text-danger">
              That didn't save. Check the internet connection and try again.
            </p>
          )}
          <Button onClick={finish} disabled={!alertMode || saving}>
            {saving ? 'Saving…' : 'Start'}
          </Button>
          {!alertMode && <p className="text-ink-2">Pick one of the two choices first.</p>}
        </Frame>
      );
  }
}

type FrameProps = {
  heading: RefObject<HTMLHeadingElement | null>;
  /** Her steps only: whose phone it is, and the caregiver's own page, aren't counted. */
  step?: number;
  title: string;
  onBack?: () => void;
};

function Frame({ heading, step, title, onBack, children }: FrameProps & { children: ReactNode }) {
  return (
    <section className="space-y-8 pb-8">
      <header className="space-y-3">
        {step && (
          <p className="font-semibold text-ink-2 tabular-nums">
            Step {step} of {STEPS.length}
          </p>
        )}
        <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold focus:outline-none">
          {title}
        </h1>
      </header>
      {children}
      {onBack && (
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
      )}
    </section>
  );
}

function NameStep({
  hint,
  value,
  onChange,
  autoComplete,
  optional,
  onNext,
  ...frame
}: FrameProps & {
  hint: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  optional?: boolean;
  onNext: () => void;
}) {
  const inputId = useId();
  const hintId = useId();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (optional || value.trim()) onNext();
  };

  return (
    <Frame {...frame}>
      <form className="space-y-4" onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          {frame.title}
        </label>
        <p id={hintId} className="text-ink-2">
          {hint}
        </p>
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={40}
          required={!optional}
          autoComplete={autoComplete}
          aria-describedby={hintId}
          className="min-h-14 w-full rounded-chip border border-line-strong bg-surface px-4 text-xl"
        />
        <Button type="submit">{optional && !value.trim() ? 'Skip' : 'Next'}</Button>
      </form>
    </Frame>
  );
}
