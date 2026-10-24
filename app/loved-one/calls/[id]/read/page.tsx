'use client';
import { useEffect } from 'react';
import { reassurance } from '@/components/loved-one/CallCard';
import { CallScreen } from '@/components/loved-one/CallScreen';
import { useLovedOne } from '@/components/loved-one/LovedOneData';
import { readScript, useReadAloud } from '@/components/loved-one/read-aloud';
import { Button } from '@/components/ui/Button';
import { BandBadge } from '@/components/ui/band';
import { Speaker } from '@/components/ui/icons';
import type { CallView } from '@/lib/types';

function ReadIt({ call }: { call: CallView }) {
  const { contact, paused } = useLovedOne();
  const voice = useReadAloud();
  const script = readScript(call, contact, paused);
  const summary = call.analysis.summary.trim();

  // She tapped "Read aloud" to get here, so start reading straight away.
  // biome-ignore lint/correctness/useExhaustiveDependencies: read once on arrival, not on every poll
  useEffect(() => {
    voice.read(script);
  }, [call.id]);

  return (
    <div className="space-y-6">
      <BandBadge band={call.analysis.band} />
      {summary && <p className="text-2xl leading-normal">{summary}</p>}
      <p>{reassurance(call)}</p>
      {voice.error && (
        <p role="alert" className="font-semibold text-ink-2">
          {voice.error}
        </p>
      )}
      <Button
        variant={voice.speaking ? 'secondary' : 'primary'}
        onClick={() => (voice.speaking ? voice.stop() : voice.read(script))}
      >
        <Speaker />
        {voice.speaking ? 'Stop reading' : 'Read it again'}
      </Button>
    </div>
  );
}

// Read aloud: the summary in large words, read aloud.
export default function ReadPage() {
  return <CallScreen title="Read aloud">{(call) => <ReadIt call={call} />}</CallScreen>;
}
