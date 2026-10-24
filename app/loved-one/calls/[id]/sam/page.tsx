'use client';
import Link from 'next/link';
import { useState } from 'react';
import { CallScreen } from '@/components/loved-one/CallScreen';
import { useLovedOne } from '@/components/loved-one/LovedOneData';
import { SAM_LINE, SAM_STYLE, samState } from '@/components/loved-one/sam';
import { Button, buttonClass } from '@/components/ui/Button';
import { Phone } from '@/components/ui/icons';
import { GUIDANCE } from '@/lib/guidance';
import type { CallView } from '@/lib/types';

function GetSam({ call }: { call: CallView }) {
  const { contact, paused } = useLovedOne();
  const [asked, setAsked] = useState<'idle' | 'sending' | 'failed'>('idle');
  const sam = samState(call, paused);
  const { box, Icon } = SAM_STYLE[sam];

  const ask = async () => {
    setAsked('sending');
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ callId: call.id }),
    }).catch(() => null);
    // On success the 2-second poll brings the alert, which turns this into "Sam has been told".
    setAsked(res?.ok ? 'idle' : 'failed');
  };

  return (
    <div className="space-y-6">
      <p
        aria-live="polite"
        className={`flex items-start gap-3 rounded-card border p-5 text-2xl font-bold ${box}`}
      >
        <Icon className="mt-1 size-[1.1em]" />
        {SAM_LINE[sam](contact)}
      </p>
      {sam === 'unsent' && (
        <Button onClick={ask} disabled={asked === 'sending'}>
          <Phone />
          {asked === 'sending' ? `Telling ${contact}…` : `Ask ${contact} to call me`}
        </Button>
      )}
      {asked === 'failed' && (
        <p role="alert" className="font-semibold text-danger">
          That didn't send. Try again, or call {contact} or {GUIDANCE.call_159.tel} yourself.
        </p>
      )}
      {sam === 'paused' && (
        <p>
          You can turn messages back on in{' '}
          <Link href="/loved-one/settings" className="font-bold text-accent-ink underline">
            Settings
          </Link>
          .
        </p>
      )}
      {(sam === 'escalated' || sam === 'paused') && (
        <a href={`tel:${GUIDANCE.call_159.tel}`} className={buttonClass('primary')}>
          <Phone />
          {GUIDANCE.call_159.title}
        </a>
      )}
    </div>
  );
}

// Get Sam: what Sam knows, and the one tap that asks Sam to call her.
export default function SamPage() {
  const { contact } = useLovedOne();
  return <CallScreen title={`Get ${contact}`}>{(call) => <GetSam call={call} />}</CallScreen>;
}
