'use client';
import { useSyncExternalStore } from 'react';
import { Speaker } from '@/components/ui/icons';
import { muteSound, onSoundChange, soundOn, unlockSound } from './alert-signal';

// The context's own changes, plus coming back to the tab, when Safari may have suspended it.
function subscribeSound(notify: () => void) {
  const off = onSoundChange(notify);
  document.addEventListener('visibilitychange', notify);
  return () => {
    off();
    document.removeEventListener('visibilitychange', notify);
  };
}

// Shared by Alerts and Settings. Follows the shared audio context, so it shows off again when Safari stops it.
export function AlertSound() {
  const sound = useSyncExternalStore(subscribeSound, soundOn, () => false);

  return (
    <div className="flex flex-wrap items-center gap-x-3">
      <p role="status" className="flex items-center gap-2 text-[0.9375rem] text-ink-2">
        <Speaker className="size-5" />
        {sound ? 'Alert sound is on while this app is open.' : 'Alert sound is off.'}
      </p>
      {/* Quiet on purpose: the alert is the one thing on the Alerts screen that should shout. */}
      <button
        type="button"
        className="-ml-1 inline-flex min-h-11 items-center rounded-full px-1 text-[0.9375rem] font-semibold text-accent-ink underline active:scale-[0.97]"
        aria-label={sound ? 'Turn off alert sound' : 'Turn on alert sound'}
        onClick={() => (sound ? muteSound() : unlockSound())}
      >
        {sound ? 'Turn off' : 'Turn on'}
      </button>
    </div>
  );
}
