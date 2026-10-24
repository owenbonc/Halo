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
import { AlertModeChoice, Choice, WhatTheySee } from '@/components/loved-one/Consent';
import {
  setTextSize,
  TEXT_SIZES,
  type TextSize,
  useAppliedTextSize,
} from '@/components/loved-one/prefs';
import { Button } from '@/components/ui/Button';
import { saveRole } from '@/lib/role';
import type { Settings } from '@/lib/types';

// The caregiver fills in the first four steps on her phone; the last step is hers alone.
const STEPS = ['her', 'you', 'backup', 'size', 'handover', 'consent'] as const;
type Step = (typeof STEPS)[number];

export default function SetupPage() {
  const router = useRouter();
  const textSize = useAppliedTextSize();
  const [index, setIndex] = useState(0);
  const [elderName, setElderName] = useState('');
  const [contactName, setContactName] = useState('');
  const [backupName, setBackupName] = useState('');
  const [alertMode, setAlertMode] = useState<Settings['alertMode'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const step: Step = STEPS[index] ?? 'her';
  const next = () => setIndex(Math.min(index + 1, STEPS.length - 1));
  const back = () => (index > 0 ? setIndex(index - 1) : router.push('/?switch'));
  const her = elderName.trim();
  const you = contactName.trim();

  // Each step replaces the screen, so move focus to its heading for screen readers.
  useEffect(() => {
    if (index > 0) heading.current?.focus();
  }, [index]);

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

  switch (step) {
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
        <Frame {...shared} title={`Which text size suits ${her}?`}>
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
            The last choice is {her}'s to make: when {you} hears about a worrying call.
          </p>
          <Button onClick={next}>I'm {her}. Carry on</Button>
        </Frame>
      );
    case 'consent':
      return (
        <Frame {...shared} title={`Hello ${her}`}>
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
  step: number;
  title: string;
  onBack?: () => void;
};

function Frame({ heading, step, title, onBack, children }: FrameProps & { children: ReactNode }) {
  return (
    <section className="space-y-8 pb-8">
      <header className="space-y-3">
        <p className="font-semibold text-ink-2 tabular-nums">
          Step {step} of {STEPS.length}
        </p>
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
