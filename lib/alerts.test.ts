import { describe, expect, it } from 'vitest';
import { statusAt, toSamAlert } from './alerts';
import { SEED_SETTINGS } from './seed';
import type { AlertRecord, CallRecord } from './types';

const alert: AlertRecord = {
  id: 'a1',
  callId: 'c1',
  createdAt: '2026-10-24T10:00:00.000Z',
  trigger: 'auto_strong',
  alertMode: 'auto_strong',
  status: 'sent',
  acknowledgedAt: null,
};

const call: CallRecord = {
  id: 'c1',
  source: 'screener',
  createdAt: alert.createdAt,
  callerLabel: 'Unknown caller (demo)',
  transcript: 'A courier will collect your cash. Do not tell your family.',
  analysis: {
    band: 'strong',
    family: 'courier',
    cues: ['courier will collect your cash'],
    summary: 'The caller asked for cash to be collected.',
    nextSteps: ['call_159'],
    matchedPatternIds: [],
  },
};

const at = (minutes: number) => Date.parse(alert.createdAt) + minutes * 60_000;

describe('statusAt', () => {
  it('escalates an unacknowledged alert after the window', () => {
    expect(statusAt(alert, at(2))).toBe('sent');
    expect(statusAt(alert, at(3))).toBe('escalated');
  });

  it('never escalates an acknowledged alert', () => {
    expect(statusAt({ ...alert, acknowledgedAt: alert.createdAt }, at(60))).toBe('acknowledged');
  });
});

describe('toSamAlert', () => {
  it('never exposes the transcript or cues', () => {
    const shown = JSON.stringify(toSamAlert(alert, call, SEED_SETTINGS));
    expect(shown).not.toContain('Do not tell your family');
    expect(shown).not.toContain('courier will collect your cash');
  });

  it('shares the summary only when she had chosen automatic alerts at the time', () => {
    expect(toSamAlert(alert, call, SEED_SETTINGS).summary).toBe(call.analysis.summary);
    // A tap while on automatic alerts carries the summary too.
    const tap = { ...alert, trigger: 'user_tap' as const };
    expect(toSamAlert(tap, call, SEED_SETTINGS).summary).toBe(call.analysis.summary);
    // A tap made under ask-first stays without a summary after she later turns on automatic alerts.
    expect(toSamAlert({ ...tap, alertMode: 'ask_first' }, call, SEED_SETTINGS).summary).toBeNull();
  });
});
