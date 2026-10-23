'use client';
import { useSyncExternalStore } from 'react';

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

export const TEXT_SIZES = {
  standard: { label: 'Standard', hint: 'The usual size.', scale: '100%' },
  large: { label: 'Large', hint: 'A bit bigger everywhere.', scale: '112.5%' },
  largest: { label: 'Largest', hint: 'As big as it goes.', scale: '125%' },
} as const;
export type TextSize = keyof typeof TEXT_SIZES;

function sizeSnapshot(): TextSize {
  const raw = read(SIZE_KEY);
  return raw === 'large' || raw === 'largest' ? raw : 'standard';
}

export function useTextSize(): TextSize {
  return useSyncExternalStore(subscribe, sizeSnapshot, () => 'standard' as const);
}

export function setTextSize(size: TextSize) {
  write(SIZE_KEY, size);
}
