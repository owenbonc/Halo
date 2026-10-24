'use client';
import { useEffect, useSyncExternalStore } from 'react';

// Grandma's per-phone choices. localStorage can throw (private browsing); the app still works, it just forgets.
const DONE_KEY = 'hang-up-and-check.done';
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

// ---- Calls she has dealt with ----

let doneRaw: string | null = null;
let doneIds: string[] = [];
function doneSnapshot(): string[] {
  const raw = read(DONE_KEY);
  if (raw !== doneRaw) {
    doneRaw = raw;
    try {
      const parsed: unknown = JSON.parse(raw ?? '[]');
      doneIds = Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
      doneIds = [];
    }
  }
  return doneIds;
}
const noDone: string[] = [];

/** Ids of calls she tapped "I've dealt with this" on, on this phone. */
export function useDone(): string[] {
  return useSyncExternalStore(subscribe, doneSnapshot, () => noDone);
}

export function markDone(id: string) {
  const ids = doneSnapshot();
  if (!ids.includes(id)) write(DONE_KEY, JSON.stringify([...ids, id].slice(-200)));
}

// ---- Text size ----

// Standard sits just above the caretaker's 17px; 93.75% keeps 3rem tap targets at 45px, above Apple's 44pt.
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

/** Applies her text size while the calling screen is mounted. */
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
