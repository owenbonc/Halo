'use client';
import { useEffect, useState } from 'react';

// Theme trial (temporary): delete with the losing data-theme blocks once one is picked.
const THEMES = [
  { id: '', label: 'Current' },
  { id: 'liberty', label: 'Liberty print' },
  { id: 'cornishware', label: 'Cornishware' },
  { id: 'departures', label: 'Departure board' },
  { id: 'ios', label: 'iOS standard' },
] as const;
const KEY = 'halo-theme-trial';

function apply(id: string) {
  if (id) document.documentElement.dataset.theme = id;
  else delete document.documentElement.dataset.theme;
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState('');

  // ?theme= wins so a phone (no desk to click) can try each one; otherwise the last pick on this device.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    let saved = '';
    try {
      saved = localStorage.getItem(KEY) ?? '';
    } catch {}
    const initial = THEMES.some((t) => t.id === fromUrl) ? (fromUrl as string) : saved;
    apply(initial);
    setTheme(initial);
  }, []);

  function choose(id: string) {
    apply(id);
    setTheme(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  }

  return (
    <fieldset className="fixed top-1/2 left-6 z-10 hidden -translate-y-1/2 flex-col gap-2 frame:flex">
      <legend className="mb-2 text-base font-semibold text-surface">Theme trial</legend>
      {THEMES.map((t) => (
        <label
          key={t.id || 'current'}
          className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-full px-5 text-base font-semibold has-focus-visible:outline-2 has-focus-visible:outline-surface ${theme === t.id ? 'bg-surface text-ink' : 'bg-ink text-surface'}`}
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
