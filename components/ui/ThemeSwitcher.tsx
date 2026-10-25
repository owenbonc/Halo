'use client';
import { useEffect, useSyncExternalStore } from 'react';

// Theme trial (temporary): delete with the losing data-theme blocks and layouts once one is picked.
export const THEMES = [
  { id: '', label: 'Current' },
  { id: 'liberty', label: 'Liberty print' },
  { id: 'cornishware', label: 'Cornishware' },
  { id: 'departures', label: 'Departure board' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'bold', label: 'Big and bold' },
  { id: 'ios', label: 'iOS standard' },
] as const;
export type ThemeId = (typeof THEMES)[number]['id'];
const KEY = 'halo-theme-trial';

function apply(id: string) {
  if (id) document.documentElement.dataset.theme = id;
  else delete document.documentElement.dataset.theme;
}

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

/** The theme on screen, so a layout can follow it as well as the colours. */
export function useThemeTrial(): ThemeId {
  return useSyncExternalStore(
    subscribe,
    () => (document.documentElement.dataset.theme ?? '') as ThemeId,
    () => '',
  );
}

export function ThemeSwitcher() {
  const theme = useThemeTrial();

  // ?theme= wins so a phone (no desk to click) can try each one; otherwise the last pick on this device.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    let saved = '';
    try {
      saved = localStorage.getItem(KEY) ?? '';
    } catch {}
    apply(THEMES.some((t) => t.id === fromUrl) ? (fromUrl as string) : saved);
  }, []);

  function choose(id: string) {
    apply(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  }

  return (
    <fieldset className="fixed top-1/2 left-6 z-10 hidden -translate-y-1/2 flex-col gap-2 frame:flex">
      <legend className="mb-2 text-base font-semibold text-[oklch(96%_0_0)]">Theme trial</legend>
      {THEMES.map((t) => (
        <label
          key={t.id || 'current'}
          className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-full px-5 text-base font-semibold has-focus-visible:outline-2 has-focus-visible:outline-[oklch(96%_0_0)] ${theme === t.id ? 'bg-[oklch(96%_0_0)] text-[oklch(18%_0_0)]' : 'bg-[oklch(18%_0_0)] text-[oklch(96%_0_0)]'}`}
        >
          <input
            type="radio"
            name="theme-trial"
            className="sr-only"
            checked={theme === t.id}
            onChange={() => choose(t.id)}
          />
          {t.label}
        </label>
      ))}
    </fieldset>
  );
}
