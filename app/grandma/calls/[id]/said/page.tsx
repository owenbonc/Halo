'use client';
import Link from 'next/link';
import { CallScreen } from '@/components/grandma/CallScreen';
import { buttonClass } from '@/components/ui/Button';
import { Quote } from '@/components/ui/icons';

// Their words: the phrases that worried us, and a way into the whole call.
export default function SaidPage() {
  return (
    <CallScreen title="Their words">
      {(call) => (
        <div className="space-y-6">
          {call.analysis.cues.length > 0 ? (
            <>
              <p className="text-ink-2">The caller said these words, which worried us:</p>
              <ul className="space-y-3">
                {call.analysis.cues.map((cue) => (
                  <li
                    key={cue}
                    className="break-words rounded-card border border-line bg-surface px-5 py-4 text-2xl font-bold"
                  >
                    “{cue}”
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>Nothing the caller said matched the warning signs we look for.</p>
          )}
          <Link href={`/grandma/calls/${call.id}/transcript`} className={buttonClass('secondary')}>
            <Quote />
            See the whole call
          </Link>
        </div>
      )}
    </CallScreen>
  );
}
