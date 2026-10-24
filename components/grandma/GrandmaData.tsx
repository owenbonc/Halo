'use client';
import { createContext, type ReactNode, useContext } from 'react';
import { Clock, Inbox, User } from '@/components/ui/icons';
import { TabBar } from '@/components/ui/TabBar';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';
import { useAppliedTextSize, useDone } from './prefs';

// A green call is shown briefly so she sees it was screened, then clears itself and is never kept.
export const GREEN_SHOWN_MS = 5 * 60_000;

type GrandmaState = {
  calls: CallView[] | null;
  error: string | null;
  settings: Settings | null;
  contact: string;
  paused: boolean;
  /** Calls she hasn't dealt with yet: warnings first, newest first. */
  untouched: CallView[];
  /** Every warning call, newest first: her history. Green calls are never kept. */
  past: CallView[];
  done: string[];
};

const Ctx = createContext<GrandmaState | null>(null);

export function useGrandma(): GrandmaState {
  const state = useContext(Ctx);
  if (!state) throw new Error('useGrandma must be used inside GrandmaShell');
  return state;
}

/** Polls once for every Grandma screen, applies her text size, and draws the tab bar. */
export function GrandmaShell({ children }: { children: ReactNode }) {
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const done = useDone();
  useAppliedTextSize();

  const now = Date.now();
  const all = calls.data ?? [];
  const warnings = all.filter((c) => c.analysis.band !== 'none');
  const freshGreen = all.filter(
    (c) => c.analysis.band === 'none' && now - Date.parse(c.createdAt) < GREEN_SHOWN_MS,
  );
  const untouched = [...warnings, ...freshGreen].filter((c) => !done.includes(c.id));

  const state: GrandmaState = {
    calls: calls.data,
    error: calls.error,
    settings: settings.data,
    contact: settings.data?.contact.name ?? 'your person',
    paused: settings.data?.paused ?? false,
    untouched,
    past: warnings,
    done,
  };

  return (
    <Ctx.Provider value={state}>
      {children}
      <TabBar
        tabs={[
          { href: '/grandma', label: 'New', Icon: Inbox, badge: untouched.length },
          { href: '/grandma/past', label: 'Past calls', Icon: Clock, match: ['/grandma/calls/'] },
          { href: '/grandma/profile', label: 'Profile', Icon: User },
        ]}
      />
    </Ctx.Provider>
  );
}
