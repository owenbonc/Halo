'use client';
import { useEffect, useSyncExternalStore } from 'react';

// The loved one's per-phone choices. localStorage can throw (private browsing); the app still works, it just forgets.
const DONE_KEY = 'hang-up-and-check.done';
const OPENED_KEY = 'hang-up-and-check.opened';
const SIZE_KEY = 'hang-up-and-check.text-size';

const listeners = new Set<() => void>();
const emit = () => {
  for (const notify of listeners) notify();
};
function subscribe(notify: () => void) {
  listeners.add(notify);
  window.addEventListener('storage', notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener('storage', notify);
  };
}
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
  emit();
}

// ---- Calls she has opened, and calls she has dealt with ----

// A list of call ids on this phone, kept to the newest 200.
function idList(key: string) {
  let raw: string | null = null;
  let ids: string[] = [];
  const snapshot = (): string[] => {
    const next = read(key);
    if (next !== raw) {
      raw = next;
      try {
        const parsed: unknown = JSON.parse(next ?? '[]');
        ids = Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
      } catch {
        ids = [];
      }
    }
    return ids;
  };
  return {
    use: () => useSyncExternalStore(subscribe, snapshot, () => noIds),
    add: (id: string) => {
      const current = snapshot();
      if (!current.includes(id)) write(key, JSON.stringify([...current, id].slice(-200)));
    },
  };
}
const noIds: string[] = [];

const done = idList(DONE_KEY);
const opened = idList(OPENED_KEY);

/** Ids of calls she tapped "I've dealt with this" on, on this phone. */
export const useDone = done.use;
export const markDone = done.add;
/** Ids of calls she has tapped any button on, on this phone. */
export const useOpened = opened.use;
export const markOpened = opened.add;

// ---- Text size ----

// Standard sits just above the caregiver's 17px; 93.75% keeps 3rem tap targets at 45px, above Apple's 44pt.
export const TEXT_SIZES = {
  standard: { label: 'Standard', hint: 'A little bigger than usual.', scale: '93.75%' },
  large: { label: 'Large', hint: 'Bigger everywhere.', scale: '100%' },
  larger: { label: 'Larger', hint: 'Bigger still.', scale: '112.5%' },
  largest: { label: 'Largest', hint: 'As big as it goes.', scale: '125%' },
} as const;
export type TextSize = keyof typeof TEXT_SIZES;

function sizeSnapshot(): TextSize {
  const raw = read(SIZE_KEY);
  return raw && raw in TEXT_SIZES ? (raw as TextSize) : 'standard';
}

export function useTextSize(): TextSize {
  return useSyncExternalStore(subscribe, sizeSnapshot, () => 'standard' as const);
}

export function setTextSize(size: TextSize) {
  write(SIZE_KEY, size);
}

/** Applies her text size while her app or setup is mounted. */
export function useAppliedTextSize(): TextSize {
  const size = useTextSize();
  // Everything in her app is in rem, so one root size scales cards, pills, buttons and the tab bar together.
  useEffect(() => {
    document.documentElement.style.fontSize = TEXT_SIZES[size].scale;
    return () => {
      document.documentElement.style.fontSize = '';
    };
  }, [size]);
  return size;
}
