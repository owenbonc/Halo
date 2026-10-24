'use client';
import { CallScreen } from '@/components/loved-one/CallScreen';
import { buttonClass } from '@/components/ui/Button';
import { Phone } from '@/components/ui/icons';
import { GUIDANCE } from '@/lib/guidance';

// What to do: the fixed next steps for this call. Every word and number comes from lib/guidance.ts.
export default function HelpPage() {
  return (
    <CallScreen title="What to do">
      {(call) => (
        <div className="space-y-6">
          {call.analysis.band === 'strong' && (
            <a href={`tel:${GUIDANCE.call_159.tel}`} className={buttonClass('primary')}>
              <Phone />
              {GUIDANCE.call_159.title}
            </a>
          )}
          <ol className="space-y-5">
            {call.analysis.nextSteps.map((id, i) => (
              <li key={id} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 font-bold text-ink tabular-nums"
                >
                  {i + 1}
                </span>
                <span>
                  <strong>{GUIDANCE[id].title}.</strong> {GUIDANCE[id].body}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </CallScreen>
  );
}
