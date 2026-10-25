import { describe, expect, it } from 'vitest';
import type { Band, CallView } from '@/lib/types';
import { readScript } from './read-aloud';

const call = (band: Band, summary: string): CallView => ({
  id: 'synthetic-call',
  source: 'screener',
  createdAt: '2026-10-24T15:00:00Z',
  callerLabel: 'Untrusted caller label 08001234567',
  alert: null,
  analysis: {
    band,
    family: band === 'none' ? 'none' : 'courier',
    summary,
    cues: [],
    nextSteps: band === 'none' ? [] : ['call_159'],
    matchedPatternIds: [],
  },
});

describe('readScript', () => {
  it('reads a green call summary once and retains the uncertainty caveat', () => {
    const summary = 'Her GP surgery called about her flu jab.';
    const script = readScript(call('none', summary), 'Sam', false);
    expect(script.split(summary)).toHaveLength(2);
    expect(script).toContain('No common warning signs found. This is not a guarantee.');
    expect(script).not.toContain('Sam');
    expect(script).not.toContain('What to do now');
  });
  it.each(['strong', 'some'] as const)(
    'retains summary and trusted guidance for %s warnings',
    (band) => {
      const script = readScript(call(band, 'A courier asked to collect cash.'), 'Sam', false);
      expect(script).toContain('A courier asked to collect cash.');
      expect(script).toContain('Call 159.');
      expect(script).toContain("Sam hasn't been told yet.");
    },
  );
  it('handles an empty summary without an empty spoken sentence', () => {
    const script = readScript(call('none', '   '), 'Sam', false);
    expect(script).not.toContain(' .');
    expect(script).toContain('This is not a guarantee.');
  });
  it('never reads the caller-controlled label or a raw transcript', () => {
    const record = {
      ...call('none', 'Her GP surgery called.'),
      transcript: 'Synthetic private transcript 08009876543',
    };
    const script = readScript(record, 'Sam', false);
    expect(script).not.toMatch(/0800|private transcript|Untrusted caller/);
  });
});
