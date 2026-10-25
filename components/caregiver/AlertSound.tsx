'use client';
import { useRef, useSyncExternalStore } from 'react';
import { Speaker } from '@/components/ui/icons';
import { onSoundChange, soundOn, unlockSound } from './alert-signal';

// The context's own changes, plus coming back to the tab, when Safari may have suspended it.
function subscribeSound(notify: () => void) {
  const off = onSoundChange(notify);
  document.addEventListener('visibilitychange', notify);
  return () => {
    off();
    document.removeEventListener('visibilitychange', notify);
  };
}

// Shared by Alerts and Settings. Follows the shared audio context, so the button returns when sound stops.
export function AlertSound() {
  const sound = useSyncExternalStore(subscribeSound, soundOn, () => false);
  const status = useRef<HTMLDivElement>(null);

  return (
    // One live region for both states, focused on tap, since the tapped button unmounts.
    <div ref={status} role="status" tabIndex={-1} className="outline-none">
      {sound ? (
        <p className="flex items-center gap-2 text-[0.9375rem] text-ink-2">
          <Speaker className="size-5" />
          Alert sound is on while this app is open.
        </p>
      ) : (
        // Quiet on purpose: the alert is the one thing on the Alerts screen that should shout.
        <button
          type="button"
          className="-ml-1 inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-[0.9375rem] font-semibold text-accent-ink active:scale-[0.97]"
          onClick={() => {
            status.current?.focus();
            unlockSound();
          }}
        >
          <Speaker className="size-5" />
          Turn on alert sound
        </button>
      )}
    </div>
  );
}
