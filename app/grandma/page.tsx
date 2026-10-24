'use client';
import Link from 'next/link';
import { CallFace } from '@/components/grandma/CallCard';
import { useGrandma } from '@/components/grandma/GrandmaData';
import { TopBar } from '@/components/grandma/TopBar';
import { VoiceNote } from '@/components/grandma/VoiceNote';
import { Button, buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/band';
import { ArrowRight, Stack } from '@/components/ui/icons';
import { BAND_LABEL } from '@/lib/labels';

// The Alerts tab: one call at a time, most important first, like the top card of a deck.
export default function AlertsPage() {
  const { current, pending, calls, error, next } = useGrandma();
  const position = current ? pending.indexOf(current) + 1 : 0;
  // Side by side when both fit, stacked at bigger text sizes.
  const pair = 'w-auto! grow basis-36 gap-2! whitespace-nowrap px-4! text-lg!';

  return (
    <section className="space-y-4">
      <TopBar
        title="Alerts"
        count={pending.length > 1 ? `${position} of ${pending.length}` : undefined}
      />
      <p className="sr-only" aria-live="polite">
        {current
          ? `Call ${position} of ${pending.length}: ${BAND_LABEL[current.analysis.band].title}`
          : ''}
      </p>
      {error && (
        <p role="alert" className="font-semibold text-danger">
          We can't get your latest calls right now. We'll keep trying.
        </p>
      )}
      {!calls && !error && <p role="status">Checking for calls…</p>}

      {current ? (
        <CallFace
          call={current}
          footer={
            <div className="flex flex-wrap gap-3">
              {pending.length > 1 && (
                <Button variant="secondary" className={pair} onClick={next}>
                  Next call
                  <ArrowRight />
                </Button>
              )}
              <Link href="/grandma/others" className={`${buttonClass('secondary')} ${pair}`}>
                <Stack />
                Other calls
              </Link>
            </div>
          }
        />
      ) : (
        calls && (
          <>
            <Card className="space-y-2">
              <h2 className="text-2xl font-bold">You're all caught up</h2>
              <p>
                When a number you don't know rings, we'll answer it and tell you here what we found.
                Calls you've dealt with are in Past calls.
              </p>
            </Card>
            <VoiceNote />
          </>
        )
      )}

      {/* Room to scroll the last item clear of the tab bar. */}
      <div aria-hidden="true" className="h-24" />
    </section>
  );
}
