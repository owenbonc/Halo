import type { Band, CallView } from '@/lib/types';

const RANK: Record<Band, number> = { strong: 0, some: 1, none: 2 };

// Strongest band first, newest first within a band.
const byImportance = (a: CallView, b: CallView) =>
  RANK[a.analysis.band] - RANK[b.analysis.band] || b.createdAt.localeCompare(a.createdAt);

export type DeckState = {
  /** Calls she tapped "I've dealt with this" on. */
  done: string[];
  /** Calls she tapped any button on. */
  opened: string[];
  /** Calls she moved past with "Next call" this visit. */
  passed: string[];
  /** The call she is working on, kept on top until she moves on. */
  held: string | null;
};

export type Deck = {
  /** Every call still in the deck, in order. */
  pending: CallView[];
  current: CallView | null;
  /** Calls she hasn't opened yet: the Alerts badge. */
  unopened: number;
  /** Every warning call not dealt with: the "Other calls" list. */
  others: CallView[];
  /** Calls dealt with, and green calls she has opened, newest first. */
  past: CallView[];
};

/*
 * The deck holds calls she hasn't opened, then refills with calls opened but not dealt with.
 * A green call leaves for Past once opened, except while it is the card in front of her.
 */
export function buildDeck(calls: CallView[], { done, opened, passed, held }: DeckState): Deck {
  const gone = (c: CallView) =>
    done.includes(c.id) || (c.analysis.band === 'none' && opened.includes(c.id) && c.id !== held);
  const pending = calls.filter((c) => !gone(c)).sort(byImportance);
  const fresh = pending.filter((c) => !passed.includes(c.id));
  const current =
    fresh.find((c) => c.id === held) ??
    fresh.find((c) => !opened.includes(c.id)) ??
    fresh[0] ??
    pending[0] ??
    null;
  return {
    pending,
    current,
    unopened: pending.filter((c) => !opened.includes(c.id)).length,
    others: pending.filter((c) => c.analysis.band !== 'none'),
    past: calls.filter(gone),
  };
}

/** The passed list after "Next call": once every card has been passed, start again after this one. */
export function passCurrent(deck: Deck, passed: string[]): string[] {
  if (!deck.current) return passed;
  const next = [...passed, deck.current.id];
  return deck.pending.every((c) => next.includes(c.id)) ? [deck.current.id] : next;
}
