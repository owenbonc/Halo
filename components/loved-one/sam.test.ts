import { describe, expect, it } from 'vitest';
import type { AlertRecord, CallView } from '@/lib/types';
import { samState } from './sam';

const call = (alert: Partial<AlertRecord> | null): CallView => ({
  id: 'synthetic-call',
  source: 'screener',
  createdAt: '2026-10-24T15:00:00Z',
  callerLabel: 'Synthetic caller',
  analysis: {
    band: 'strong',
    family: 'courier',
    summary: 'A courier asked to collect cash.',
    cues: [],
    nextSteps: ['call_159'],
    matchedPatternIds: [],
  },
  alert: alert && {
    id: 'synthetic-alert',
    callId: 'synthetic-call',
    createdAt: '2026-10-24T15:00:00Z',
    trigger: 'auto_strong',
    alertMode: 'auto_strong',
    status: 'sent',
    acknowledgedAt: null,
    ...alert,
  },
});
const at = (minutes: number) => Date.parse('2026-10-24T15:00:00Z') + minutes * 60_000;

describe('samState', () => {
  it('says Sam is calling for an hour after the tap, then that Sam said they would', () => {
    const acked = call({ status: 'acknowledged', acknowledgedAt: '2026-10-24T15:10:00Z' });
    expect(samState(acked, false, at(69))).toBe('acknowledged');
    expect(samState(acked, false, at(70))).toBe('promised');
  });
  it('keeps the other states as they are', () => {
    expect(samState(call(null), false, at(600))).toBe('unsent');
    expect(samState(call(null), true, at(600))).toBe('paused');
    expect(samState(call({ status: 'escalated' }), false, at(600))).toBe('escalated');
  });
});
