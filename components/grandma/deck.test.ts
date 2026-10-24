import { describe, expect, it } from 'vitest';
import type { Band, CallView } from '@/lib/types';
import { buildDeck, type DeckState, passCurrent } from './deck';

const call = (id: string, band: Band, minute: number): CallView => ({
  id,
  source: 'screener',
  createdAt: new Date(Date.UTC(2026, 9, 24, 10, minute)).toISOString(),
  callerLabel: 'Unknown caller',
  analysis: {
    band,
    family: band === 'none' ? 'none' : 'courier',
    cues: [],
    summary: '',
    nextSteps: [],
    matchedPatternIds: [],
  },
  alert: null,
});

const fresh: DeckState = { done: [], opened: [], passed: [], held: null };
// Newest first, as GET /api/calls returns them.
const calls = [
  call('green', 'none', 5),
  call('some', 'some', 4),
  call('strong-old', 'strong', 1),
  call('strong-new', 'strong', 3),
];
const ids = (list: CallView[]) => list.map((c) => c.id);

describe('buildDeck', () => {
  it('orders by band, then newest first, with green at the bottom', () => {
    const deck = buildDeck(calls, fresh);
    expect(ids(deck.pending)).toEqual(['strong-new', 'strong-old', 'some', 'green']);
    expect(deck.current?.id).toBe('strong-new');
    expect(deck.unopened).toBe(4);
    expect(ids(deck.others)).toEqual(['strong-new', 'strong-old', 'some']);
  });

  it('keeps the card she is working on in front after she opens it', () => {
    const deck = buildDeck(calls, { ...fresh, opened: ['strong-new'], held: 'strong-new' });
    expect(deck.current?.id).toBe('strong-new');
    expect(deck.unopened).toBe(3);
  });

  it('shows unopened calls first, then refills with opened ones', () => {
    const opened = ['strong-new', 'strong-old', 'some'];
    expect(buildDeck(calls, { ...fresh, opened }).current?.id).toBe('green');
    const allOpened = buildDeck(calls, {
      ...fresh,
      opened: [...opened, 'green'],
      passed: ['strong-new'],
    });
    expect(allOpened.current?.id).toBe('strong-old');
  });

  it('moves dealt-with calls and opened green calls to Past', () => {
    const deck = buildDeck(calls, { ...fresh, done: ['strong-old'], opened: ['green'] });
    expect(ids(deck.pending)).toEqual(['strong-new', 'some']);
    expect(ids(deck.past)).toEqual(['green', 'strong-old']);
  });

  it('keeps an opened green call in front until she moves on', () => {
    const deck = buildDeck(calls, { ...fresh, opened: ['green'], held: 'green' });
    expect(deck.current?.id).toBe('green');
    expect(ids(deck.past)).toEqual([]);
  });
});

describe('passCurrent', () => {
  it('walks through every card, then starts again after the last one seen', () => {
    const warnings = calls.filter((c) => c.analysis.band !== 'none');
    let state: DeckState = { ...fresh, opened: ids(warnings) };
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const deck = buildDeck(warnings, state);
      seen.push(deck.current?.id ?? '');
      state = { ...state, passed: passCurrent(deck, state.passed) };
    }
    expect(seen).toEqual(['strong-new', 'strong-old', 'some', 'strong-new']);
  });
});
