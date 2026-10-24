'use client';
import { useEffect } from 'react';
import { reassurance } from '@/components/grandma/CallCard';
import { CallScreen } from '@/components/grandma/CallScreen';
import { useGrandma } from '@/components/grandma/GrandmaData';
import { readScript, useReadAloud } from '@/components/grandma/read-aloud';
import { Button } from '@/components/ui/Button';
import { BandBadge } from '@/components/ui/band';
import { Speaker } from '@/components/ui/icons';
import type { CallView } from '@/lib/types';

function ReadIt({ call }: { call: CallView }) {
  const { contact, paused } = useGrandma();
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
