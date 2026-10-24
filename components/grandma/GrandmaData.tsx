'use client';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { Bell, Clock, Gear } from '@/components/ui/icons';
import { TabBar } from '@/components/ui/TabBar';
import type { CallView, Settings } from '@/lib/types';
import { usePoll } from '@/lib/use-poll';
import { buildDeck, type Deck, passCurrent } from './deck';
import { markOpened, useAppliedTextSize, useDone, useOpened } from './prefs';

type GrandmaState = Deck & {
  calls: CallView[] | null;
  error: string | null;
  contact: string;
  paused: boolean;
  done: string[];
  /** She tapped a button on this call: it counts as opened and stays in front of her. */
  open: (id: string) => void;
  /** Put this call in front of her without opening it (a voice note she just sent). */
  focus: (id: string) => void;
  /** "Next call": move past the card in front of her. */
  next: () => void;
};

const Ctx = createContext<GrandmaState | null>(null);

export function useGrandma(): GrandmaState {
  const state = useContext(Ctx);
  if (!state) throw new Error('useGrandma must be used inside GrandmaShell');
  return state;
}

/** Polls once for every Grandma screen, keeps her deck of calls, applies her text size, and draws the tab bar. */
export function GrandmaShell({ children }: { children: ReactNode }) {
  const calls = usePoll<CallView[]>('/api/calls');
  const settings = usePoll<Settings>('/api/settings', 10_000);
  const done = useDone();
  const opened = useOpened();
  // This visit only: where she is in the deck. A reload starts again from the most important call.
  const [passed, setPassed] = useState<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  useAppliedTextSize();

  const deck = buildDeck(calls.data ?? [], { done, opened, passed, held });

  const state: GrandmaState = {
    ...deck,
    calls: calls.data,
    error: calls.error,
    contact: settings.data?.contact.name ?? 'your person',
    paused: settings.data?.paused ?? false,
    done,
    open: (id) => {
      markOpened(id);
      setHeld(id);
    },
    focus: setHeld,
    next: () => {
      if (!deck.current) return;
      markOpened(deck.current.id);
      setPassed(passCurrent(deck, passed));
      setHeld(null);
    },
  };

  return (
    <Ctx.Provider value={state}>
      {children}
      <TabBar
        tabs={[
          {
            href: '/grandma',
            label: 'Alerts',
            Icon: Bell,
            badge: deck.unopened,
            match: ['/grandma/calls/', '/grandma/others'],
          },
          { href: '/grandma/past', label: 'Past calls', Icon: Clock },
          { href: '/grandma/settings', label: 'Settings', Icon: Gear },
        ]}
      />
    </Ctx.Provider>
  );
}
